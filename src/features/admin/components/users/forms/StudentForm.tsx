import React from 'react';
import { StudentFormData, FormErrors } from '../types';
import CustomInput from '../../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../../../../common/components/ui/ImageUploader';
import { DanceLevel } from '../../../../../types';

interface StudentFormProps {
  formData: StudentFormData;
  formErrors: FormErrors;
  isEdit: boolean;
  instructors: Array<{ id: string; displayName: string }>;
  schools: Array<{ id: string; displayName: string }>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => void;
  onPhotoChange: (base64Image: string | null) => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  formData,
  formErrors,
  isEdit,
  instructors,
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
          error={!!formErrors.displayName}
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
          error={!!formErrors.email}
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
          error={!!formErrors.phoneNumber}
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
        <CustomSelect
          name="instructorId"
          label="Eğitmen"
          value={formData.instructorId}
          onChange={(value) => onInputChange({ target: { name: 'instructorId', value } })}
          options={[
            { value: '', label: 'Eğitmen Seç...' },
            ...instructors.map(instructor => ({
              value: instructor.id,
              label: instructor.displayName
            }))
          ]}
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
          userType="student"
          shape="circle"
          width={200}
          height={200}
        />
      </div>
    </div>
  );
}; 