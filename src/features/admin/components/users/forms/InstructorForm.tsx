import React, { useState, useEffect } from 'react';
import { InstructorFormData, FormErrors } from '../types';
import CustomInput from '../../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../../../../common/components/ui/ImageUploader';
import { DanceLevel } from '../../../../../types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../../api/firebase/firebase';

interface InstructorFormProps {
  formData: InstructorFormData;
  formErrors: FormErrors;
  isEdit: boolean;
  schools: Array<{ id: string; displayName: string }>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => void;
  onPhotoChange: (base64Image: string | null) => void;
}

export const InstructorForm: React.FC<InstructorFormProps> = ({
  formData,
  formErrors,
  isEdit,
  schools,
  onInputChange,
  onPhotoChange
}) => {
  const [danceStyles, setDanceStyles] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  // Dans stillerini Firebase'den getir
  useEffect(() => {
    const fetchDanceStyles = async () => {
      try {
        const stylesRef = collection(db, 'danceStyles');
        const q = query(stylesRef, orderBy('label'));
        const querySnapshot = await getDocs(q);
        
        const styles = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            label: data.label || data.name || '',
            value: data.value || doc.id
          };
        });
        
        setDanceStyles(styles);
      } catch (error) {
        console.error('Dans stilleri yüklenirken hata:', error);
        // Hata durumunda varsayılan stiller
        setDanceStyles([
          { value: 'salsa', label: 'Salsa' },
          { value: 'bachata', label: 'Bachata' },
          { value: 'kizomba', label: 'Kizomba' },
          { value: 'zouk', label: 'Zouk' }
        ]);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchDanceStyles();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <CustomInput
          name="displayName"
          label="Ad Soyad"
          type="text"
          value={formData.displayName}
          onChange={onInputChange}
          helperText={formErrors.displayName}
          fullWidth
        />
      </div>
      
      <div>
        <CustomInput
          type="email"
          name="email"
          label="E-posta"
          value={formData.email}
          onChange={onInputChange}
          readOnly={isEdit}
          helperText={isEdit ? "Mevcut kullanıcıların e-posta adresleri değiştirilemez." : formErrors.email}
          fullWidth
        />
      </div>
      
      <div>
        <CustomPhoneInput
          name="phoneNumber"
          label="Telefon"
          initialValue={formData.phoneNumber}
          onChange={onInputChange}
          helperText={formErrors.phoneNumber}
          fullWidth
        />
      </div>

      <div>
        <CustomSelect
          name="level"
          label="Dans Seviyesi"
          value={formData.level}
          onChange={(value) => onInputChange({ target: { name: 'level', value } })}
          options={[
            { value: 'beginner', label: 'Başlangıç' },
            { value: 'intermediate', label: 'Orta' },
            { value: 'advanced', label: 'İleri' },
            { value: 'professional', label: 'Profesyonel' }
          ]}
          fullWidth
        />
      </div>

      <div>
        <CustomInput
          name="experience"
          label="Deneyim (Yıl)"
          type="text"
          value={formData.experience.toString()}
          onChange={onInputChange}
          fullWidth
        />
      </div>

      <div>
        {loadingStyles ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="text-sm text-gray-500">Dans stilleri yükleniyor...</span>
          </div>
        ) : (
          <CustomSelect
            name="specialties"
            label="Uzmanlık Alanları"
            value={formData.specialties}
            onChange={(value) => {
              const selectedSpecialties = Array.isArray(value) ? value : [value];
              onInputChange({ target: { name: 'specialties', value: selectedSpecialties } });
            }}
            options={danceStyles}
            multiple
            fullWidth
          />
        )}
      </div>
      
      <div className="md:col-span-2">
        <CustomInput
          name="bio"
          label="Biyografi"
          multiline
          rows={4}
          value={formData.bio}
          onChange={onInputChange}
          fullWidth
        />
      </div>

      <div>
        <CustomSelect
          name="schoolId"
          label="Dans Okulu"
          value={formData.schoolId}
          onChange={(value) => onInputChange({ target: { name: 'schoolId', value } })}
          options={[
            { value: '', label: 'Okul Seç...' },
            ...schools.map(school => ({
              value: school.id,
              label: school.displayName
            }))
          ]}
          fullWidth
        />
      </div>

      <div className="col-span-2">
        <ImageUploader
          currentPhotoURL={formData.photoURL}
          onImageChange={(base64Image) => onPhotoChange(base64Image)}
          displayName={formData.displayName || '?'}
          userType="instructor"
          shape="circle"
          width={200}
          height={200}
        />
      </div>
    </div>
  );
}; 