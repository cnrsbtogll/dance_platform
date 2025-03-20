import React, { useState, useEffect } from 'react';
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
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';

interface SchoolRequest {
  id: string;
  schoolName: string;
  schoolDescription: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  website?: string;
  danceStyles: string[];
  establishedYear: string;
  userId: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
}

function SchoolRequests(): JSX.Element {
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
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
        collection(db, 'schoolRequests'),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const requestsData: SchoolRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data()
        } as SchoolRequest);
      });
      
      // Sort by creation date (newest first)
      requestsData.sort((a, b) => {
        return b.createdAt?.toMillis() - a.createdAt?.toMillis();
      });
      
      setRequests(requestsData);
      
    } catch (err) {
      console.error('Okul talepleri getirilirken hata oluştu:', err);
      setError('Okul talepleri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, userId: string) => {
    setProcessingId(requestId);
    
    try {
      // 1. Get the request document
      const requestDocRef = doc(db, 'schoolRequests', requestId);
      const requestDoc = await getDoc(requestDocRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Talep bulunamadı');
      }
      
      const requestData = requestDoc.data() as SchoolRequest;
      
      // 2. Get the user document
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        throw new Error('Kullanıcı bulunamadı');
      }
      
      // 3. Update the user document to add the school role
      const userData = userDoc.data();
      let roles = userData.role || [];
      
      if (!Array.isArray(roles)) {
        roles = [roles];
      }
      
      if (!roles.includes('school')) {
        roles.push('school');
      }
      
      // Add school-specific data to the user document
      await updateDoc(userDocRef, {
        role: roles,
        isSchool: true,
        schoolApprovedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 4. Add school to the schools collection
      const schoolData = {
        name: requestData.schoolName,
        description: requestData.schoolDescription,
        address: requestData.address,
        city: requestData.city,
        zipCode: requestData.zipCode,
        country: requestData.country,
        website: requestData.website || '',
        danceStyles: requestData.danceStyles,
        establishedYear: requestData.establishedYear,
        contactPerson: requestData.contactPerson,
        contactEmail: requestData.contactEmail,
        contactPhone: requestData.contactPhone,
        userId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active'
      };
      
      const schoolsCollectionRef = collection(db, 'schools');
      const newSchoolDoc = await addDoc(schoolsCollectionRef, schoolData);
      
      // 5. Update the request status
      await updateDoc(requestDocRef, {
        status: 'approved',
        updatedAt: serverTimestamp(),
        approvedBy: 'admin', // Ideally, this would be the admin user ID
        schoolId: newSchoolDoc.id
      });
      
      // 6. Update the local state
      setRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      alert('Okul talebi başarıyla onaylandı. Okul, okullar listesine eklendi ve kullanıcı bilgileri güncellendi.');
      
    } catch (err) {
      console.error('Okul talebi onaylanırken hata oluştu:', err);
      alert(`Hata: ${err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingId(requestId);
    
    try {
      // Update the request status
      const requestDocRef = doc(db, 'schoolRequests', requestId);
      await updateDoc(requestDocRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        rejectedBy: 'admin' // Ideally, this would be the admin user ID
      });
      
      // Update the local state
      setRequests(prev => 
        prev.filter(req => req.id !== requestId)
      );
      
      alert('Okul talebi reddedildi.');
      
    } catch (err) {
      console.error('Okul talebi reddedilirken hata oluştu:', err);
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
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Okul Başvuruları</h2>
        <p className="text-gray-600">Şu anda bekleyen okul başvurusu bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Okul Başvuruları</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Okul Adı</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim Kişisi</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şehir</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dans Stilleri</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başvuru Tarihi</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{request.schoolName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{request.contactPerson}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{request.contactEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{request.contactPhone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{request.city}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">{request.danceStyles.join(', ')}</div>
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

export default SchoolRequests; 