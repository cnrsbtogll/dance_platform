import React, { useEffect, useState, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updateUserProfile } from '../../api/services/userService';
import { DanceLevel, DanceStyle, User, UserRole } from '../../types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import CustomInput from '../../common/components/ui/CustomInput';
import CustomSelect from '../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../common/components/ui/CustomPhoneInput';
import Button from '../../common/components/ui/Button';
import ImageUploader from '../../common/components/ui/ImageUploader';

interface ProfileEditorProps {
  user: User | null;
  onUpdate: (updatedUser: User) => void;
}

interface FormData {
  displayName: string;
  gender: string;
  age: number | undefined;
  level: DanceLevel;
  city: string;
  phoneNumber: string;
  height?: number;
  weight?: number;
  photoURL?: string;
  danceStyles: DanceStyle[];
  availableTimes: string[];
  role?: UserRole;
}

const ProfilePage: React.FC<ProfileEditorProps> = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    displayName: user?.displayName || '',
    gender: user?.gender || '',
    age: user?.age,
    level: user?.level || 'beginner',
    city: user?.city || '',
    phoneNumber: user?.phoneNumber || '',
    height: user?.height,
    weight: user?.weight,
    photoURL: user?.photoURL,
    danceStyles: user?.danceStyles || [],
    availableTimes: user?.availableTimes || [],
    role: user?.role
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location } });
    }
  }, [user, navigate, location]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => {
    setFormData(prev => ({
      ...prev,
      [(e as any).target.name]: (e as any).target.value
    }));
  };

  const handleDanceStyleChange = (selectedStyles: DanceStyle[]) => {
    setFormData(prev => ({
      ...prev,
      danceStyles: selectedStyles
    }));
  };

  const handleTimeChange = (selectedTimes: string[]) => {
    setFormData(prev => ({
      ...prev,
      availableTimes: selectedTimes
    }));
  };

  const handlePhotoUploadSuccess = (base64Image: string | null) => {
    if (base64Image) {
      setFormData(prev => ({
        ...prev,
        photoURL: base64Image
      }));
    }
  };

  const handlePhotoUploadError = (error: Error) => {
    console.error('Photo upload failed:', error);
    // TODO: Show error message to user
  };

  const nextStep = () => {
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const updatedUserData: Partial<User> = {
        ...formData,
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: new Date()
      };
      const updatedUser = await updateUserProfile(user.id, updatedUserData);
      onUpdate(updatedUser);
    } catch (error) {
      console.error('Profile update failed:', error);
      // Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  // Temel bilgiler formu
  const renderBasicInfoForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler (Zorunlu)</h3>
        <p className="text-sm text-gray-500 mb-6">
          Bu bilgiler dans partnerinizle eşleşmeniz için gereklidir.
        </p>
      </div>
      
      <ImageUploader
        currentPhotoURL={user?.photoURL}
        onImageChange={handlePhotoUploadSuccess}
        displayName={user?.displayName || ''}
        userType="student"
        shape="circle"
        width={150}
        height={150}
      />
      
      <div>
        <CustomInput
          name="displayName"
          label="Adınız Soyadınız"
          value={formData.displayName}
          onChange={handleInputChange}
          required
        />
      </div>
      
      <div>
        <CustomSelect
          name="gender"
          label="Cinsiyet"
          value={formData.gender}
          onChange={(value: string | string[]) => handleInputChange({ target: { name: 'gender', value: value as string } })}
          options={[
            { value: 'male', label: 'Erkek' },
            { value: 'female', label: 'Kadın' },
            { value: 'other', label: 'Diğer' }
          ]}
          required
        />
      </div>
      
      <div>
        <CustomInput
          type="text"
          name="age"
          label="Yaş"
          value={formData.age?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            handleInputChange({ target: { name: 'age', value } });
          }}
          required
        />
      </div>
      
      <div>
        <CustomSelect
          name="level"
          label="Dans Seviyesi"
          value={formData.level}
          onChange={(value: string | string[]) => handleInputChange({ target: { name: 'level', value: value as DanceLevel } })}
          options={[
            { value: 'beginner', label: 'Başlangıç' },
            { value: 'intermediate', label: 'Orta Seviye' },
            { value: 'advanced', label: 'İleri Seviye' },
            { value: 'professional', label: 'Profesyonel' }
          ]}
          required
        />
      </div>
      
      <div>
        <CustomInput
          name="city"
          label="Şehir"
          value={formData.city}
          onChange={handleInputChange}
          required
          placeholder="Örn: İstanbul, Ankara"
        />
      </div>
      
      <div>
        <CustomPhoneInput
          name="phoneNumber"
          label="Telefon Numarası"
          countryCode="+90"
          phoneNumber={formData.phoneNumber}
          onPhoneNumberChange={(value: string) => handleInputChange({ target: { name: 'phoneNumber', value } })}
          onCountryCodeChange={() => {}}
        />
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={nextStep}
          variant="primary"
        >
          İleri
        </Button>
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
        <CustomInput
          type="text"
          name="height"
          label="Boy (cm)"
          value={formData.height?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            handleInputChange({ target: { name: 'height', value } });
          }}
          placeholder="Örn: 175"
        />
      </div>
      
      <div>
        <CustomInput
          type="text"
          name="weight"
          label="Kilo (kg)"
          value={formData.weight?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            handleInputChange({ target: { name: 'weight', value } });
          }}
          placeholder="Örn: 70"
        />
      </div>
      
      <div className="flex justify-between">
        <Button
          onClick={prevStep}
          variant="secondary"
        >
          Geri
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
      {step === 1 ? renderBasicInfoForm() : renderPhysicalAttributesForm()}
    </form>
  );
};

export default ProfilePage; 