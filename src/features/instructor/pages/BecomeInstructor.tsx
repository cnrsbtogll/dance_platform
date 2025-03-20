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
  danceStyles: string[];
  contactNumber: string;
  bio: string;
  email?: string; // Email alanı opsiyonel
  password?: string; // Şifre alanı opsiyonel
}

function BecomeInstructor() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    experience: '',
    danceStyles: [],
    contactNumber: '',
    bio: '',
    email: '',
    password: ''
  });
  const [selectedDanceStyles, setSelectedDanceStyles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
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
    // Artık login yapmamış kişi için yönlendirme yapmıyoruz
    // Burada formData'yı güncelleyebiliriz
    if (currentUser) {
      // Email alanını currentUser'dan al
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || ''
      }));
    }

    const checkUserStatus = async () => {
    try {
      if (!currentUser) {
        // Giriş yapmamış kullanıcı için başvuru oluyor, normal devam et
        setIsLoading(false);
        return;
      }
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
        setGeneralError('Kullanıcı durumu kontrol edilirken bir hata oluştu. Lütfen tekrar deneyin.');
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
    
    // Kullanıcı bir alanı güncellediğinde o alandaki hatayı temizle
    if (formErrors[name as keyof FormData]) {
      setFormErrors(prev => {
        const updated = {...prev};
        delete updated[name as keyof FormData];
        return updated;
      });
    }
  };

  const handleDanceStyleChange = (value: string | string[]) => {
    // value bir array olarak geldiğinde (multiple seçim) doğrudan kullan
    // string olarak geldiğinde bir array'e dönüştür
    const danceStylesArray = Array.isArray(value) ? value : [value];
    
    // Boş seçim durumunda boş array ile güncelle
    // Tümü seçeneği seçildiğinde boş array dönücek
    const filteredStyles = value === '' ? [] : danceStylesArray.filter(style => style !== '');
    
    setSelectedDanceStyles(filteredStyles);
    setFormData(prev => ({
      ...prev,
      danceStyles: filteredStyles
    }));
    
    // Dans stili seçildiğinde ilgili hatayı temizle
    if (formErrors.danceStyles) {
      setFormErrors(prev => {
        const updated = {...prev};
        delete updated.danceStyles;
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError(null);
    setFormErrors({});
    
    // Form validasyon kontrolü
    const errors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Bu alan zorunlu';
    }
    
    if (!formData.danceStyles || formData.danceStyles.length === 0) {
      errors.danceStyles = 'En az bir dans stili seçmelisiniz';
    }
    
    // Telefon numarasının kontrolü - boşlukları kaldır ve doğrula
    const cleanPhone = formData.contactNumber.replace(/\s/g, '');
    
    if (!cleanPhone) {
      errors.contactNumber = 'Bu alan zorunlu';
    } else if (cleanPhone.length !== 10) {
      errors.contactNumber = '10 rakam girmelisiniz';
    }
    
    if (!currentUser) {
      if (!formData.email) {
        errors.email = 'Bu alan zorunlu';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Geçerli bir email adresi girin';
      }
      
      if (!formData.password) {
        errors.password = 'Bu alan zorunlu';
      } else if (formData.password.length < 6) {
        errors.password = 'En az 6 karakter girmelisiniz';
      }
    }
    
    // Hata varsa, formu göndermeyi durdur
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Kullanıcı ID'si ve email
      const userId = currentUser?.uid || 'guest-' + Date.now();
      const userEmail = currentUser?.email || formData.email;
      
      // Eğitmen isteği oluştur
      await addDoc(collection(db, 'instructorRequests'), {
        fullName: formData.fullName,
        experience: formData.experience,
        danceStyles: formData.danceStyles, // Artık bir array olduğu için direkt kullanabiliyoruz
        contactNumber: formData.contactNumber,
        bio: formData.bio,
        userId: userId,
        userEmail: userEmail,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setSuccess(true);
      
      // Formu sıfırla
      setFormData({
        fullName: '',
        experience: '',
        danceStyles: [],
        contactNumber: '',
        bio: '',
        email: '',
        password: ''
      });
      setSelectedDanceStyles([]);
      
    } catch (err) {
      console.error('Error submitting instructor application:', err);
      setGeneralError(`Başvuru gönderilirken bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen bir hata'}`);
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
        {generalError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{generalError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
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
              placeholder="Adınızı ve soyadınızı giriniz"
              className={`w-full p-2 border ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-indigo-500`}
            />
            {formErrors.fullName && (
              <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
            )}
          </div>
          
        {/* Email alanı - sadece giriş yapmamış kullanıcılara göster */}
        {!currentUser && (
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail Adresiniz*
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="E-mail adresinizi giriniz"
              className={`w-full p-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-indigo-500`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>
        )}
        
        {/* Şifre alanı - sadece giriş yapmamış kullanıcılara göster */}
        {!currentUser && (
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Şifre*
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="En az 6 karakter şifre giriniz"
              className={`w-full p-2 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-indigo-500`}
            />
            {formErrors.password && (
              <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
            )}
          </div>
        )}
          
          <div className="mb-4">
            {loadingStyles ? (
              <div className="bg-gray-100 p-2 rounded-md flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                <span className="text-gray-600">Dans stilleri yükleniyor...</span>
              </div>
            ) : (
              <CustomSelect
                label="Uzmanlık Alanlarınız (Dans Stilleri)*"
                options={danceStyleOptions}
                value={selectedDanceStyles}
                onChange={handleDanceStyleChange}
                placeholder="Dans stillerinizi seçin"
                className="w-full"
                error={formErrors.danceStyles}
                multiple={true}
              />
            )}
            {/* multiple={true} ile dans stillerinin birden fazla seçilebilmesi sağlanmıştır */}
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
              İletişim Numarası*
            </label>
            <div className="flex items-center">
            <div className={`bg-gray-100 p-2 border ${formErrors.contactNumber ? 'border-red-500' : 'border-gray-300'} border-r-0 rounded-l-md`}>
            +90
            </div>
              <input
                type="tel"
                pattern="[0-9]*"
                inputMode="numeric"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => {
                  // Sadece rakam girişine izin ver
                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                  
                  // 10 karakterden uzun olmasını engelleyin (Türkiye formatında)
                  const trimmedValue = rawValue.slice(0, 10);
                  
                  // Telefon numarasına maske uygula (5XX XXX XX XX formatında)
                  let formattedValue = trimmedValue;
                  
                  if (trimmedValue.length > 3) {
                    formattedValue = `${trimmedValue.slice(0, 3)} ${trimmedValue.slice(3)}`;
                  }
                  if (trimmedValue.length > 6) {
                    formattedValue = `${formattedValue.slice(0, 7)} ${formattedValue.slice(7)}`;
                  }
                  if (trimmedValue.length > 8) {
                    formattedValue = `${formattedValue.slice(0, 10)} ${formattedValue.slice(10)}`;
                  }
                  
                  setFormData(prev => ({
                    ...prev,
                    contactNumber: formattedValue
                  }));
                  
                  // Hata mesajını temizle
                  if (formErrors.contactNumber) {
                    setFormErrors(prev => {
                      const updated = {...prev};
                      delete updated.contactNumber;
                      return updated;
                    });
                  }
                }}
                placeholder="5XX XXX XX XX"
                className={`w-full p-2 border ${formErrors.contactNumber ? 'border-red-500' : 'border-gray-300'} rounded-r-md focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
            {formErrors.contactNumber && (
              <p className="text-red-500 text-xs mt-1">{formErrors.contactNumber}</p>
            )}
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