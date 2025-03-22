import React from 'react';
import { InstructorFormData, FormErrors } from '../types';
import CustomInput from '../../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../../../../common/components/ui/ImageUploader';
import { DanceLevel } from '../../../../../types';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <CustomInput
          name="displayName"
          label="Ad Soyad"
          type="text"
          required
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
          required
          value={formData.email}
          onChange={onInputChange}
          disabled={isEdit}
          helperText={isEdit ? "Mevcut kullanıcıların e-posta adresleri değiştirilemez." : formErrors.email}
          fullWidth
        />
      </div>
      
      <div>
        <CustomPhoneInput
          name="phoneNumber"
          label="Telefon"
          value={formData.phoneNumber}
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
          type="number"
          value={formData.experience.toString()}
          onChange={onInputChange}
          fullWidth
        />
      </div>

      <div>
        <CustomSelect
          name="specialties"
          label="Uzmanlık Alanları"
          value={formData.specialties}
          onChange={(value) => {
            const selectedSpecialties = Array.isArray(value) ? value : [value];
            onInputChange({ target: { name: 'specialties', value: selectedSpecialties } });
          }}
          options={[
            { value: 'salsa', label: 'Salsa' },
            { value: 'bachata', label: 'Bachata' },
            { value: 'kizomba', label: 'Kizomba' },
            { value: 'zouk', label: 'Zouk' }
          ]}
          multiple
          fullWidth
        />
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