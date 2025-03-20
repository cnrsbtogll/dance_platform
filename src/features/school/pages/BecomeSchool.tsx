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
  getDoc
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import { motion } from 'framer-motion';

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
}

function BecomeSchool() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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
    establishedYear: ''
  });
  
  const [selectedDanceStyles, setSelectedDanceStyles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    // Redirect to login if not authenticated
    if (!currentUser) {
      navigate('/signin?redirect=become-school');
      return;
    }

    const checkUserStatus = async () => {
      try {
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
    let updatedStyles;
    
    // Check if style is already selected
    if (selectedDanceStyles.includes(value)) {
      // Remove style if already selected
      updatedStyles = selectedDanceStyles.filter(style => style !== value);
    } else {
      // Add style if not already selected
      updatedStyles = [...selectedDanceStyles, value];
    }
    
    setSelectedDanceStyles(updatedStyles);
    setFormData(prev => ({
      ...prev,
      danceStyles: updatedStyles
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
      if (!formData.schoolName.trim()) {
        throw new Error('Lütfen dans okulu adını girin.');
      }
      
      if (!formData.contactPerson.trim()) {
        throw new Error('Lütfen yetkili kişi adını girin.');
      }
      
      if (!formData.contactEmail.trim()) {
        throw new Error('Lütfen iletişim e-postasını girin.');
      }
      
      if (!formData.contactPhone.trim()) {
        throw new Error('Lütfen iletişim telefonunu girin.');
      }
      
      if (formData.danceStyles.length === 0) {
        throw new Error('Lütfen en az bir dans stilini seçin.');
      }
      
      // Create school request
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
        userId: currentUser.uid,
        userEmail: currentUser.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      setSuccess(true);
      
      // Reset form
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
        establishedYear: ''
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
          <p className="text-gray-600 mb-6">Dans okulu başvurunuz başarıyla alındı. Başvurunuz incelendikten sonra size e-posta ile bilgilendirme yapılacaktır.</p>
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
        
        <form onSubmit={handleSubmit}>
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
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {danceStyleOptions.map(style => (
                    <div key={style.value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`style-${style.value}`}
                        value={style.value}
                        checked={selectedDanceStyles.includes(style.value)}
                        onChange={() => handleDanceStyleChange(style.value)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`style-${style.value}`} className="ml-2 text-sm text-gray-700">
                        {style.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {formData.danceStyles.length === 0 && (
                <p className="text-red-500 text-xs mt-1">Lütfen en az bir dans stili seçin</p>
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
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
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
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                İletişim Telefonu*
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                required
                placeholder="Örn: 05XX XXX XX XX"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              />
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