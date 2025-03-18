import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import { motion } from 'framer-motion';

// Dans stilleri interface
interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

interface FormData {
  fullName: string;
  experience: string;
  danceStyles: string;
  contactNumber: string;
  bio: string;
}

function BecomeInstructor() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    experience: '',
    danceStyles: '',
    contactNumber: '',
    bio: ''
  });
  const [selectedDanceStyle, setSelectedDanceStyle] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [isAlreadyInstructor, setIsAlreadyInstructor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  // Fetch dance styles from Firestore
  useEffect(() => {
    const fetchDanceStyles = async () => {
      setLoadingStyles(true);
      try {
        const danceStylesRef = collection(db, 'danceStyles');
        const q = query(danceStylesRef, orderBy('label'));
        const querySnapshot = await getDocs(q);
        
        const styles: DanceStyle[] = [];
        querySnapshot.forEach((doc) => {
          styles.push({
            id: doc.id,
            ...doc.data()
          } as DanceStyle);
        });
        
        if (styles.length === 0) {
          // If no styles in Firestore, use default styles
          setDanceStyles([
            { id: 'default-1', label: 'Salsa', value: 'salsa' },
            { id: 'default-2', label: 'Bachata', value: 'bachata' },
            { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
            { id: 'default-4', label: 'Tango', value: 'tango' },
            { id: 'default-5', label: 'Vals', value: 'vals' }
          ]);
        } else {
          setDanceStyles(styles);
        }
      } catch (err) {
        console.error('Error fetching dance styles:', err);
        // Fallback to default styles on error
        setDanceStyles([
          { id: 'default-1', label: 'Salsa', value: 'salsa' },
          { id: 'default-2', label: 'Bachata', value: 'bachata' },
          { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
          { id: 'default-4', label: 'Tango', value: 'tango' },
          { id: 'default-5', label: 'Vals', value: 'vals' }
        ]);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchDanceStyles();
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate('/login?redirect=become-instructor');
      return;
    }

    const checkUserStatus = async () => {
      try {
        // Check if user is already an instructor
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const roles = userData.role || [];
          
          // If user already has instructor role, redirect to instructor panel
          if (Array.isArray(roles) && roles.includes('instructor')) {
            setIsAlreadyInstructor(true);
            setIsLoading(false);
            return;
          }

          // Pre-fill form with user data if available
          if (userData.displayName) {
            setFormData(prev => ({
              ...prev,
              fullName: userData.displayName
            }));
          }
          if (userData.phoneNumber) {
            setFormData(prev => ({
              ...prev,
              contactNumber: userData.phoneNumber
            }));
          }
        }

        // Check if user already has a pending application
        const requestsRef = collection(db, 'instructorRequests');
        const q = query(
          requestsRef,
          where('userId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setHasExistingApplication(true);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error checking user status:', err);
        setError('Kullanıcı durumu kontrol edilirken bir hata oluştu. Lütfen tekrar deneyin.');
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [currentUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDanceStyleChange = (value: string) => {
    setSelectedDanceStyle(value);
    setFormData(prev => ({
      ...prev,
      danceStyles: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!currentUser) {
        throw new Error('Kullanıcı girişi yapılmamış. Lütfen giriş yapın ve tekrar deneyin.');
      }
      
      // Validate form data
      if (!formData.fullName.trim()) {
        throw new Error('Lütfen adınızı ve soyadınızı girin.');
      }
      
      if (!formData.danceStyles) {
        throw new Error('Lütfen uzmanlık alanınızı seçin.');
      }
      
      // Create instructor request
      await addDoc(collection(db, 'instructorRequests'), {
        fullName: formData.fullName,
        experience: formData.experience,
        danceStyles: formData.danceStyles,
        contactNumber: formData.contactNumber,
        bio: formData.bio,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        fullName: '',
        experience: '',
        danceStyles: '',
        contactNumber: '',
        bio: ''
      });
      setSelectedDanceStyle('');
      
    } catch (err) {
      console.error('Error submitting instructor application:', err);
      setError(`Başvuru gönderilirken bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen bir hata'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  if (isAlreadyInstructor) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-green-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Zaten bir eğitmensiniz!</h2>
          <p className="text-gray-600 mb-6">Eğitmen panelinize giderek derslerinizi yönetebilirsiniz.</p>
          <button 
            onClick={() => navigate('/instructor-panel')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Eğitmen Paneline Git
          </button>
        </div>
      </div>
    );
  }

  if (hasExistingApplication) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-yellow-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Başvurunuz İnceleniyor</h2>
          <p className="text-gray-600 mb-6">Eğitmen başvurunuz halihazırda inceleniyor. Başvurunuz onaylandığında size e-posta ile bilgilendirme yapılacaktır.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-green-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Başvurunuz Alındı!</h2>
          <p className="text-gray-600 mb-6">Eğitmen başvurunuz başarıyla alındı. Başvurunuz incelendikten sonra size e-posta ile bilgilendirme yapılacaktır.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  // Get dance style options for the dropdown
  const danceStyleOptions = danceStyles.map(style => ({
    label: style.label,
    value: style.value
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 inline-block relative bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Eğitmen Olarak Başvurun
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Dans tutkunuzu profesyonel bir kariyere dönüştürün ve platformumuzda yeni öğrencilerle buluşun.
        </p>
      </motion.div>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Adınız Soyadınız*
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="mb-4">
            {loadingStyles ? (
              <div className="bg-gray-100 p-2 rounded-md flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                <span className="text-gray-600">Dans stilleri yükleniyor...</span>
              </div>
            ) : (
              <CustomSelect
                label="Uzmanlık Alanınız (Dans Stili)*"
                options={danceStyleOptions}
                value={selectedDanceStyle}
                onChange={handleDanceStyleChange}
                placeholder="Dans stilinizi seçin"
                className="w-full"
              />
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
              Deneyim Süresi
            </label>
            <input
              type="text"
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="Örn: 5 yıl"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
              İletişim Numarası
            </label>
            <input
              type="text"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="Örn: 05XX XXX XX XX"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Özgeçmiş / Biyografi
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Kendiniz hakkında kısa bir bilgi..."
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Gönder'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h3 className="text-blue-800 font-semibold">Bilgi</h3>
        <p className="text-blue-700 text-sm mt-1">
          Eğitmen başvurunuz, yönetici onayından sonra aktif olacaktır. Onay sürecinde ek bilgiler istenebilir.
          Onay sonrası eğitmen panelinize erişim sağlayabileceksiniz.
        </p>
      </div>
    </div>
  );
}

export default BecomeInstructor; 