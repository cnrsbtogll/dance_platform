
import { useNavigate, useLocation } from 'react-router-dom';
import { updateUserProfile } from '../../api/services/userService';
import ProfilePhotoUploader from './components/ProfilePhotoUploader';
import { DanceLevel, DanceStyle, User } from '../../types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import { useEffect, useState } from 'react';

interface ProfileEditorProps {
  user: User | null;
  onUpdate?: () => void;
}

// Extended User type to include bio which might be in Firestore but not in the User type
interface UserWithProfile extends User {
  bio?: string;
  gender?: string;
  age?: number;
  city?: string;
  availableTimes?: string[];
  height?: number;
  weight?: number;
}

// Define FirestoreDanceStyle interface
interface FirestoreDanceStyle {
  id: string;
  label: string;
  value: string;
}

const ProfilePage: React.FC<ProfileEditorProps> = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL query parametresi ile profil tipini kontrol et
  const queryParams = new URLSearchParams(location.search);
  const profileType = queryParams.get('type');
  
  // Kullanıcı rollerini kontrol et
  const isInstructor = profileType === 'instructor' || user?.role?.includes('instructor');
  const isSchoolAdmin = profileType === 'school' || user?.role?.includes('school_admin');
  const isAdmin = profileType === 'admin' || user?.role?.includes('admin');
  
  // Dans seviyesi gösterilmeli mi?
  const shouldShowDanceLevel = !isInstructor && !isSchoolAdmin && !isAdmin;
  
  // Adım yönetimi
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    level: 'beginner' as DanceLevel,
    phoneNumber: '',
    danceStyles: [] as DanceStyle[],
    // Partner matching için ek alanlar
    gender: '',
    age: undefined as number | undefined,
    city: '',
    availableTimes: [] as string[],
    height: undefined as number | undefined,
    weight: undefined as number | undefined
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [danceStyleOptions, setDanceStyleOptions] = useState<FirestoreDanceStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  
  // Fetch dance styles from Firestore
  useEffect(() => {
    const fetchDanceStyles = async () => {
      setLoadingStyles(true);
      try {
        const danceStylesRef = collection(db, 'danceStyles');
        const q = query(danceStylesRef, orderBy('label'));
        const querySnapshot = await getDocs(q);
        
        const styles: FirestoreDanceStyle[] = [];
        querySnapshot.forEach((doc) => {
          styles.push({
            id: doc.id,
            ...doc.data()
          } as FirestoreDanceStyle);
        });
        
        if (styles.length === 0) {
          // If no styles in Firestore, use default styles
          setDanceStyleOptions([
            { id: 'default-1', label: 'Salsa', value: 'salsa' },
            { id: 'default-2', label: 'Bachata', value: 'bachata' },
            { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
            { id: 'default-4', label: 'Tango', value: 'tango' },
            { id: 'default-5', label: 'Zeybek', value: 'zeybek' },
            { id: 'default-6', label: 'Hip Hop', value: 'hiphop' },
            { id: 'default-7', label: 'Modern Dans', value: 'modern' }
          ]);
        } else {
          setDanceStyleOptions(styles);
        }
      } catch (err) {
        console.error('Error fetching dance styles:', err);
        // Fallback to default styles on error
        setDanceStyleOptions([
          { id: 'default-1', label: 'Salsa', value: 'salsa' },
          { id: 'default-2', label: 'Bachata', value: 'bachata' },
          { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
          { id: 'default-4', label: 'Tango', value: 'tango' },
          { id: 'default-5', label: 'Zeybek', value: 'zeybek' },
          { id: 'default-6', label: 'Hip Hop', value: 'hiphop' },
          { id: 'default-7', label: 'Modern Dans', value: 'modern' }
        ]);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchDanceStyles();
  }, []);
  
  // Initialize form data from user
  useEffect(() => {
    if (user) {
      const userWithProfile = user as UserWithProfile;
      setFormData({
        displayName: user.displayName || '',
        bio: userWithProfile.bio || '',
        level: user.level || 'beginner',
        phoneNumber: user.phoneNumber || '',
        danceStyles: user.danceStyles || [],
        gender: userWithProfile.gender || '',
        age: userWithProfile.age,
        city: userWithProfile.city || '',
        availableTimes: userWithProfile.availableTimes || [],
        height: userWithProfile.height,
        weight: userWithProfile.weight
      });
    }
  }, [user]);
  
  // If no user, redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Sayısal değerler için dönüşüm
    if (name === 'age' || name === 'height' || name === 'weight') {
      const numValue = value ? parseInt(value) : undefined;
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleDanceStyleChange = (style: string) => {
    setFormData(prev => {
      const currentStyles = [...prev.danceStyles];
      
      if (currentStyles.includes(style as DanceStyle)) {
        // Remove if already selected
        return {
          ...prev,
          danceStyles: currentStyles.filter(s => s !== style) as DanceStyle[]
        };
      } else {
        // Add if not selected
        return {
          ...prev,
          danceStyles: [...currentStyles, style as DanceStyle]
        };
      }
    });
  };
  
  const handleTimeChange = (time: string) => {
    setFormData(prev => {
      const currentTimes = [...prev.availableTimes];
      
      if (currentTimes.includes(time)) {
        // Remove if already selected
        return {
          ...prev,
          availableTimes: currentTimes.filter(t => t !== time)
        };
      } else {
        // Add if not selected
        return {
          ...prev,
          availableTimes: [...currentTimes, time]
        };
      }
    });
  };
  
  const handlePhotoUploadSuccess = (newPhotoURL: string) => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    
    // Trigger parent update if provided
    if (onUpdate) {
      onUpdate();
    }
    
    // Sayfayı kısa bir gecikme ile yenile, böylece UI güncellensin
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  
  const handlePhotoUploadError = (error: Error) => {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };
  
  // Adımlar arası geçiş
  const nextStep = () => {
    if (currentStep < totalSteps) {
      // Adım geçişlerinde validasyon
      if (currentStep === 1) {
        // Temel bilgiler için validasyon
        if (!formData.displayName) {
          setError('Lütfen adınızı girin');
          return;
        }
        if (!formData.gender) {
          setError('Lütfen cinsiyetinizi seçin');
          return;
        }
        if (!formData.age) {
          setError('Lütfen yaşınızı girin');
          return;
        }
        if (!formData.level) {
          setError('Lütfen dans seviyenizi seçin');
          return;
        }
        if (!formData.city) {
          setError('Lütfen şehrinizi girin');
          return;
        }
      } else if (currentStep === 2) {
        // Dans tercihleri için validasyon
        if (formData.danceStyles.length === 0) {
          setError('Lütfen en az bir dans stili seçin');
          return;
        }
      }
      
      setError(null);
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await updateUserProfile(user.id, formData);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Trigger parent update if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setError('Profil bilgileri güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return <div>Yükleniyor...</div>;
  }
  
  // İlerleme çubuğu için adım başlıkları
  const stepTitles = [
    'Temel Bilgiler',
    'Dans Tercihleri',
    'Fiziksel Özellikler'
  ];
  
  // Temel bilgiler formu
  const renderBasicInfoForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler (Zorunlu)</h3>
        <p className="text-sm text-gray-500 mb-6">
          Bu bilgiler dans partnerinizle eşleşmeniz için gereklidir.
        </p>
      </div>
      
      <ProfilePhotoUploader 
        userId={user?.id || ''} 
        currentPhotoURL={user?.photoURL || ''} 
        onSuccess={handlePhotoUploadSuccess}
        onError={handlePhotoUploadError}
      />
      
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Adınız Soyadınız <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Cinsiyet <span className="text-red-500">*</span></label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">Seçiniz</option>
          <option value="male">Erkek</option>
          <option value="female">Kadın</option>
          <option value="other">Diğer</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700">Yaş <span className="text-red-500">*</span></label>
        <input
          type="number"
          id="age"
          name="age"
          min="18"
          max="100"
          value={formData.age || ''}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="level" className="block text-sm font-medium text-gray-700">Dans Seviyesi <span className="text-red-500">*</span></label>
        <select
          id="level"
          name="level"
          value={formData.level}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="beginner">Başlangıç</option>
          <option value="intermediate">Orta Seviye</option>
          <option value="advanced">İleri Seviye</option>
          <option value="professional">Profesyonel</option>
        </select>
      </div>
      
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">Şehir <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleInputChange}
          required
          placeholder="Örn: İstanbul, Ankara"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Telefon Numarası</label>
        <input
          type="tel"
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          placeholder="İsteğe bağlı"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={nextStep}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          İleri
        </button>
      </div>
    </div>
  );
  
  // Dans tercihleri formu
  const renderDancePreferencesForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dans Tercihleri</h3>
        <p className="text-sm text-gray-500 mb-6">
          Sevdiğiniz dans stillerini ve uygun zamanlarınızı seçin.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dans Stilleri <span className="text-red-500">*</span></label>
        {loadingStyles ? (
          <div className="bg-gray-100 p-2 rounded-md flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
            <span className="text-gray-600">Dans stilleri yükleniyor...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {danceStyleOptions.map(style => (
              <button
                key={style.id}
                type="button"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  formData.danceStyles.includes(style.value as DanceStyle)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                onClick={() => handleDanceStyleChange(style.value)}
              >
                {style.label}
              </button>
            ))}
          </div>
        )}
        {formData.danceStyles.length === 0 && (
          <p className="mt-2 text-xs text-red-500">En az bir dans stili seçmelisiniz</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Uygun Zamanlar</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['Sabah', 'Öğlen', 'Akşam', 'Hafta Sonu'].map(time => (
            <button
              key={time}
              type="button"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                formData.availableTimes.includes(time)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              onClick={() => handleTimeChange(time)}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Hakkımda</label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Kendiniz hakkında kısa bir bilgi..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        ></textarea>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Geri
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          İleri
        </button>
      </div>
    </div>
  );
  
  // Fiziksel özellikler formu
  const renderPhysicalAttributesForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Fiziksel Özellikler (İsteğe Bağlı)</h3>
        <p className="text-sm text-gray-500 mb-6">
          Bu bilgileri paylaşmak isteğe bağlıdır, ancak daha uyumlu partner eşleştirmeleri yapılmasına yardımcı olur.
        </p>
      </div>
      
      <div>
        <label htmlFor="height" className="block text-sm font-medium text-gray-700">Boy (cm)</label>
        <input
          type="number"
          id="height"
          name="height"
          min="120"
          max="220"
          value={formData.height || ''}
          onChange={handleInputChange}
          placeholder="Örn: 175"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Kilo (kg)</label>
        <input
          type="number"
          id="weight"
          name="weight"
          min="30"
          max="150"
          value={formData.weight || ''}
          onChange={handleInputChange}
          placeholder="Örn: 70"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Geri
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Profili Güncelle'}
        </button>
      </div>
    </div>
  );
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Profil Bilgilerinizi Düzenleyin</h2>
      
      {/* İlerleme çubuğu */}
      <div className="mb-8">
        <div className="flex mb-4 justify-between">
          {stepTitles.map((title, index) => {
            const step = index + 1;
            return (
              <div 
                key={step}
                className={`${
                  step === 3 ? 'text-right' : step === 2 ? 'text-center' : 'text-left'
                } flex-1 ${
                  currentStep === step
                    ? 'text-indigo-600 font-medium'
                    : currentStep > step
                    ? 'text-green-500'
                    : 'text-gray-400'
                }`}
              >
                <div className="relative">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep === step
                      ? 'border-indigo-600 bg-indigo-50'
                      : currentStep > step
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {currentStep > step ? (
                      <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  {title}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-width duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          <p>Profil başarıyla güncellendi!</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          {currentStep === 1 && renderBasicInfoForm()}
          {currentStep === 2 && renderDancePreferencesForm()}
          {currentStep === 3 && renderPhysicalAttributesForm()}
        </div>
      </form>
    </div>
  );
};

export default ProfilePage; 