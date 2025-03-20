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
  setDoc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, AuthError } from 'firebase/auth';
import { db, auth } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import { motion } from 'framer-motion';
import { getAuthErrorMessage } from '../../../pages/auth/services/authService';

interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

interface FormData {
  schoolName: string;
  schoolDescription: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  website: string;
  danceStyles: string[];
  establishedYear: string;
  password?: string; // Şifre alanı opsiyonel
}

function BecomeSchool() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  // Form ve validation state'leri
  const [formData, setFormData] = useState<FormData>({
    schoolName: '',
    schoolDescription: '',
    contactPerson: '',
    contactEmail: currentUser?.email || '',
    contactPhone: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'Türkiye',
    website: '',
    danceStyles: [],
    establishedYear: '',
    password: ''
  });
  
  const [selectedDanceStyles, setSelectedDanceStyles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [success, setSuccess] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [isAlreadySchool, setIsAlreadySchool] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  // Fetch dance styles from Firestore
  useEffect(() => {
    const fetchDanceStyles = async () => {
      setLoadingStyles(true);
      try {
        const danceStylesRef = collection(db, 'danceStyles');
        const querySnapshot = await getDocs(danceStylesRef);
        
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
    // Kullanıcı bilgilerini kontrol et
    const checkUserStatus = async () => {
      try {
        if (currentUser) {
          // Kullanıcı giriş yapmışsa kontrolleri yap
          
          // Check if user is already a school admin
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const roles = userData.role || [];
            
            // If user already has school role, redirect to school admin panel
            if (Array.isArray(roles) && roles.includes('school')) {
              setIsAlreadySchool(true);
              setIsLoading(false);
              return;
            }

            // Pre-fill form with user data if available
            if (userData.displayName) {
              setFormData(prev => ({
                ...prev,
                contactPerson: userData.displayName
              }));
            }
            if (userData.phoneNumber) {
              setFormData(prev => ({
                ...prev,
                contactPhone: userData.phoneNumber
              }));
            }
          }

          // Check if user already has a pending application
          const requestsRef = collection(db, 'schoolRequests');
          const q = query(
            requestsRef,
            where('userId', '==', currentUser.uid),
            where('status', '==', 'pending')
          );
          
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            setHasExistingApplication(true);
          }
          
          // Email alanını currentUser'dan al
          setFormData(prev => ({
            ...prev,
            contactEmail: currentUser.email || ''
          }));
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
    
    // Alanın hata mesajını temizle
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
    setError(null);
    setFormErrors({});
    
    try {
      // Validate form data
      const errors: Partial<Record<keyof FormData, string>> = {};
      
      if (!formData.schoolName.trim()) {
        errors.schoolName = 'Bu alan zorunlu';
      }
      
      if (!formData.contactPerson.trim()) {
        errors.contactPerson = 'Bu alan zorunlu';
      }
      
      if (!formData.contactEmail.trim()) {
        errors.contactEmail = 'Bu alan zorunlu';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        errors.contactEmail = 'Geçerli bir email adresi girin';
      }
      
      // Telefon numarasının kontrolü - boşlukları kaldır ve doğrula
      const cleanPhone = formData.contactPhone.replace(/\s/g, '');
      
      if (!cleanPhone) {
        errors.contactPhone = 'Bu alan zorunlu';
      } else if (cleanPhone.length !== 10) {
        errors.contactPhone = '10 rakam girmelisiniz';
      }
      
      if (formData.danceStyles.length === 0) {
        errors.danceStyles = 'En az bir dans stili seçmelisiniz';
      }
      
      // Kullanıcı giriş yapmamışsa şifre kontrolü
      if (!currentUser) {
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
      
      // Kullanıcı hesabı ve okul başvurusu oluşturma işlemi
      let userId = currentUser?.uid;
      let userEmail = currentUser?.email || formData.contactEmail;
      
      // Kullanıcı giriş yapmamışsa yeni hesap oluştur
      if (!currentUser) {
        try {
          // Firebase Authentication ile kullanıcı oluştur
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.contactEmail, 
            formData.password as string
          );
          
          // Kullanıcı profiline displayName ekle
          await updateProfile(userCredential.user, { displayName: formData.contactPerson });
          
          // User ID'sini güncelle
          userId = userCredential.user.uid;
          
          // Firestore'a kullanıcı bilgilerini kaydet
          await setDoc(doc(db, 'users', userId), {
            id: userId,
            email: formData.contactEmail,
            displayName: formData.contactPerson,
            photoURL: '',
            phoneNumber: formData.contactPhone,
            role: ['school_applicant'], // Başlangıçta başvuru rolü
            createdAt: serverTimestamp()
          });
          
        } catch (authError) {
          // Kimlik doğrulama hatasını işle
          const error = authError as AuthError;
          throw new Error(getAuthErrorMessage(error));
        }
      }
      
      // Okul başvurusu oluştur
      await addDoc(collection(db, 'schoolRequests'), {
        schoolName: formData.schoolName,
        schoolDescription: formData.schoolDescription,
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        country: formData.country,
        website: formData.website,
        danceStyles: formData.danceStyles,
        establishedYear: formData.establishedYear,
        userId: userId,
        userEmail: userEmail,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setSuccess(true);
      
      // Formu sıfırla
      setFormData({
        schoolName: '',
        schoolDescription: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        city: '',
        zipCode: '',
        country: 'Türkiye',
        website: '',
        danceStyles: [],
        establishedYear: '',
        password: ''
      });
      setSelectedDanceStyles([]);
      
    } catch (err) {
      console.error('Error submitting school application:', err);
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

  if (isAlreadySchool) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-green-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Zaten bir dans okulu yöneticisisiniz!</h2>
          <p className="text-gray-600 mb-6">Dans okulu panelinize giderek okulunuzu yönetebilirsiniz.</p>
          <button 
            onClick={() => navigate('/school-admin')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Dans Okulu Paneline Git
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
          <p className="text-gray-600 mb-6">Dans okulu başvurunuz halihazırda inceleniyor. Başvurunuz onaylandığında size e-posta ile bilgilendirme yapılacaktır.</p>
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
          <p className="text-gray-600 mb-6">
            {!currentUser ? "Hesabınız oluşturuldu ve " : ""}
            Dans okulu başvurunuz başarıyla alındı. Başvurunuz incelendikten sonra size e-posta ile bilgilendirme yapılacaktır.
          </p>
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
          Dans Okulu Başvurusu
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Dans okulunuzu platformumuza kaydedin ve binlerce dans öğrencisine ulaşın.
        </p>
      </motion.div>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Okul Bilgileri</h3>
            
            <div className="mb-4">
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                Dans Okulu Adı*
              </label>
              <input
                type="text"
                id="schoolName"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                placeholder="Okul adını giriniz"
                className={`w-full p-2 border ${formErrors.schoolName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-indigo-500`}
              />
              {formErrors.schoolName && (
                <p className="text-red-500 text-xs mt-1">{formErrors.schoolName}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="schoolDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Okul Tanımı
              </label>
              <textarea
                id="schoolDescription"
                name="schoolDescription"
                rows={4}
                value={formData.schoolDescription}
                onChange={handleChange}
                placeholder="Okulunuz hakkında kısa bir tanım..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label htmlFor="establishedYear" className="block text-sm font-medium text-gray-700 mb-1">
                Kuruluş Yılı
              </label>
              <input
                type="number"
                id="establishedYear"
                name="establishedYear"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.establishedYear}
                onChange={handleChange}
                placeholder="Örn: 2015"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dans Stilleri*
              </label>
              {loadingStyles ? (
                <div className="bg-gray-100 p-2 rounded-md flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                  <span className="text-gray-600">Dans stilleri yükleniyor...</span>
                </div>
              ) : (
                <CustomSelect
                  label=""
                  options={danceStyleOptions}
                  value={selectedDanceStyles}
                  onChange={handleDanceStyleChange}
                  placeholder="Dans stillerinizi seçin"
                  className="w-full"
                  error={formErrors.danceStyles}
                  multiple={true}
                />
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">İletişim Bilgileri</h3>
            
            <div className="mb-4">
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                Yetkili Kişi Adı*
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="Yetkili kişi adını giriniz"
                className={`w-full p-2 border ${formErrors.contactPerson ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-indigo-500`}
              />
              {formErrors.contactPerson && (
                <p className="text-red-500 text-xs mt-1">{formErrors.contactPerson}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                İletişim E-posta*
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="E-posta adresinizi giriniz"
                className={`w-full p-2 border ${formErrors.contactEmail ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-indigo-500`}
              />
              {formErrors.contactEmail && (
                <p className="text-red-500 text-xs mt-1">{formErrors.contactEmail}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                İletişim Telefonu*
              </label>
              <div className="flex items-center">
                <div className={`bg-gray-100 p-2 border ${formErrors.contactPhone ? 'border-red-500' : 'border-gray-300'} border-r-0 rounded-l-md`}>
                  +90
                </div>
                <input
                  type="tel"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
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
                      contactPhone: formattedValue
                    }));
                    
                    // Hata mesajını temizle
                    if (formErrors.contactPhone) {
                      setFormErrors(prev => {
                        const updated = {...prev};
                        delete updated.contactPhone;
                        return updated;
                      });
                    }
                  }}
                  placeholder="5XX XXX XX XX"
                  className={`w-full p-2 border ${formErrors.contactPhone ? 'border-red-500' : 'border-gray-300'} rounded-r-md focus:ring-2 focus:ring-indigo-500`}
                />
              </div>
              {formErrors.contactPhone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.contactPhone}</p>
              )}
            </div>
            
            <div className="mb-4">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
            Web Sitesi
            </label>
            <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            placeholder="Örn: https://www.dansokulum.com"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            />
            </div>

              {/* Giriş yapmamış kullanıcı için şifre alanı */}
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
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Adres Bilgileri</h3>
            
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Adres
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Sokak, mahalle, cadde..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="mb-4">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Posta Kodu
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Ülke
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
          Dans okulu başvurunuz, platformumuz tarafından incelendikten sonra aktif hale gelecektir. Onay sürecinde ek bilgiler veya belge istemleri olabilir.
          Onay sonrası okul yönetici panelinize erişim sağlayabileceksiniz.
        </p>
      </div>
    </div>
  );
}

export default BecomeSchool;