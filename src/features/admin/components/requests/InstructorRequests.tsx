import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import { Instructor as InstructorType } from '../../../../types';

interface InstructorRequest {
  id: string;
  fullName: string;
  experience: string;
  danceStyles: string | string[];
  contactNumber: string;
  bio: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

function InstructorRequests() {
  const [requests, setRequests] = useState<InstructorRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, 'instructorRequests'),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const requestsData: InstructorRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data()
        } as InstructorRequest);
      });
      
      // Sort by creation date (newest first)
      requestsData.sort((a, b) => {
        return b.createdAt?.toMillis() - a.createdAt?.toMillis();
      });
      
      setRequests(requestsData);
      
    } catch (err) {
      console.error('Eğitmen talepleri getirilirken hata oluştu:', err);
      setError('Eğitmen talepleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    setProcessingId(requestId);
    
    try {
      // 1. Get the request document
      const requestDocRef = doc(db, 'instructorRequests', requestId);
      const requestDoc = await getDoc(requestDocRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Talep bulunamadı');
      }
      
      const requestData = requestDoc.data() as InstructorRequest;
      
      // 2. Get the user document
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.error('Kullanıcı bulunamadı. User ID:', userId);
        console.error('Request Data:', requestData);
        
        // Kullanıcı yoksa, önce users koleksiyonunda yeni kullanıcı oluştur
        try {
          await setDoc(userDocRef, {
            email: requestData.userEmail,
            displayName: requestData.fullName,
            phoneNumber: requestData.contactNumber,
            role: ['instructor'],
            isInstructor: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'active'
          });
          
          console.log('Yeni kullanıcı oluşturuldu. User ID:', userId);
        } catch (createError) {
          console.error('Kullanıcı oluşturulurken hata:', createError);
          throw new Error('Kullanıcı oluşturulamadı. Lütfen tekrar deneyin.');
        }
      }
      
      // 3. Get fresh user data after potential creation
      const freshUserDoc = await getDoc(userDocRef);
      const userData = freshUserDoc.data();
      
      if (!userData) {
        throw new Error('Kullanıcı verilerine erişilemedi');
      }
      
      // Roles array'ini kontrol et ve güncelle
      let roles = userData.role || [];
      if (!Array.isArray(roles)) {
        roles = [roles];
      }
      if (!roles.includes('instructor')) {
        roles.push('instructor');
      }
      
      // Add instructor-specific data to the user document
      await updateDoc(userDocRef, {
        role: roles,
        isInstructor: true,
        instructorSpecialization: requestData.danceStyles,
        instructorExperience: requestData.experience,
        instructorBio: requestData.bio,
        instructorApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 4. Add instructor to the instructors collection with more user data
      const instructorData: Partial<InstructorType> = {
        userId: userId,
        displayName: requestData.fullName,
        email: userData.email || requestData.userEmail,
        photoURL: userData.photoURL || "/assets/images/dance/egitmen_default.jpg",
        phoneNumber: userData.phoneNumber || requestData.contactNumber,
        role: ['instructor'],
        specialties: Array.isArray(requestData.danceStyles) 
          ? requestData.danceStyles 
          : typeof requestData.danceStyles === 'string'
            ? requestData.danceStyles.split(',').map(s => s.trim())
            : [],
        experience: requestData.experience,
        bio: requestData.bio,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const instructorsCollectionRef = collection(db, 'instructors');
      const instructorDoc = await addDoc(instructorsCollectionRef, instructorData);
      console.log('Eğitmen dokümanı oluşturuldu. ID:', instructorDoc.id);
      
      // 5. Update the request status
      await updateDoc(requestDocRef, {
        status: 'approved',
        updatedAt: serverTimestamp(),
        approvedBy: 'admin',
        instructorDocId: instructorDoc.id // Oluşturulan eğitmen dokümanının referansını sakla
      });
      
      // 6. Update the local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      alert('Eğitmen talebi başarıyla onaylandı. Eğitmen, eğitmenler listesine eklendi ve kullanıcı bilgileri güncellendi.');
      
    } catch (err) {
      console.error('Eğitmen talebi onaylanırken hata oluştu:', err);
      alert(`Hata: ${err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingId(requestId);
    
    try {
      // Update the request status
      const requestDocRef = doc(db, 'instructorRequests', requestId);
      await updateDoc(requestDocRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        rejectedBy: 'admin' // Ideally, this would be the admin user ID
      });
      
      // Update the local state
      setRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      alert('Eğitmen talebi reddedildi.');
      
    } catch (err) {
      console.error('Eğitmen talebi reddedilirken hata oluştu:', err);
      alert('Talebiniz reddedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p>{error}</p>
        <button 
          onClick={fetchRequests} 
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Eğitmen Başvuruları</h2>
        <p className="text-gray-600">Şu anda bekleyen eğitmen başvurusu bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Eğitmen Başvuruları</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adı Soyadı</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deneyim</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dans Stilleri</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başvuru Tarihi</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{request.fullName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{request.userEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{request.experience}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{request.danceStyles}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">
                    {request.createdAt ? request.createdAt.toDate().toLocaleDateString('tr-TR') : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleApproveRequest(request.id, request.userId)}
                    disabled={processingId === request.id}
                    className="text-green-600 hover:text-green-900 mr-4 disabled:opacity-50"
                  >
                    {processingId === request.id ? 'İşleniyor...' : 'Onayla'}
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={processingId === request.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    {processingId === request.id ? 'İşleniyor...' : 'Reddet'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InstructorRequests; 