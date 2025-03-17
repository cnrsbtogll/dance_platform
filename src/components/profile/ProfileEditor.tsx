import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile } from '../../services/userService';
import ProfilePhotoUploader from './ProfilePhotoUploader';
import { DanceLevel, DanceStyle, User } from '../../types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface ProfileEditorProps {
  user: User | null;
  onUpdate?: () => void;
}

// Extended User type to include bio which might be in Firestore but not in the User type
interface UserWithProfile extends User {
  bio?: string;
}

// Define FirestoreDanceStyle interface
interface FirestoreDanceStyle {
  id: string;
  label: string;
  value: string;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    level: 'beginner' as DanceLevel,
    phoneNumber: '',
    danceStyles: [] as DanceStyle[]
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
            { id: 'default-4', label: 'Other', value: 'other' }
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
          { id: 'default-4', label: 'Other', value: 'other' }
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
        danceStyles: user.danceStyles || []
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Profil Bilgilerinizi Düzenleyin</h2>
      
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
          
          <ProfilePhotoUploader 
            userId={user?.id || ''} 
            currentPhotoURL={user?.photoURL || ''} 
            onSuccess={handlePhotoUploadSuccess}
            onError={handlePhotoUploadError}
          />
          
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Adınız Soyadınız</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
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
          
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700">Dans Seviyesi</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="beginner">Başlangıç</option>
              <option value="intermediate">Orta Seviye</option>
              <option value="advanced">İleri Seviye</option>
              <option value="professional">Profesyonel</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dans Stilleri</label>
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
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Profili Güncelle'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditor; 