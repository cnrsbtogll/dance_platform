import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile } from '../../services/userService';
import ProfilePhotoUploader from './ProfilePhotoUploader';
import { DanceLevel, DanceStyle, User } from '../../types';

interface ProfileEditorProps {
  user: User | null;
  onUpdate?: () => void;
}

// Extended User type to include bio which might be in Firestore but not in the User type
interface UserWithProfile extends User {
  bio?: string;
}

const danceStyleOptions: DanceStyle[] = ['salsa', 'bachata', 'kizomba', 'other'];

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
  
  const handleDanceStyleChange = (style: DanceStyle) => {
    setFormData(prev => {
      const currentStyles = [...prev.danceStyles];
      
      if (currentStyles.includes(style)) {
        // Remove if already selected
        return {
          ...prev,
          danceStyles: currentStyles.filter(s => s !== style)
        };
      } else {
        // Add if not selected
        return {
          ...prev,
          danceStyles: [...currentStyles, style]
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
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Profil Düzenle</h2>
      </div>
      
      {error && (
        <div className="bg-red-50 px-6 py-3 text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 px-6 py-3 text-green-700">
          Profil başarıyla güncellendi.
        </div>
      )}
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:space-x-6">
          {/* Profile Photo Section */}
          <div className="md:w-1/3 flex flex-col items-center mb-6 md:mb-0">
            <ProfilePhotoUploader 
              userId={user.id}
              currentPhotoURL={user.photoURL}
              onSuccess={handlePhotoUploadSuccess}
              onError={handlePhotoUploadError}
            />
            <p className="text-sm text-gray-500 text-center mt-2">
              Profil fotoğrafını değiştirmek için resme tıklayın
            </p>
          </div>
          
          {/* Profile Details Form */}
          <div className="md:w-2/3">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
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
                  <div className="flex flex-wrap gap-2">
                    {danceStyleOptions.map(style => (
                      <button
                        key={style}
                        type="button"
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          formData.danceStyles.includes(style)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                        onClick={() => handleDanceStyleChange(style)}
                      >
                        {style === 'salsa' ? 'Salsa' :
                         style === 'bachata' ? 'Bachata' :
                         style === 'kizomba' ? 'Kizomba' : 'Diğer'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Güncelleniyor...' : 'Profili Güncelle'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor; 