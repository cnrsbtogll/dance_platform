import React from 'react';
import { SchoolFormData, FormErrors } from '../types';
import CustomInput from '../../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../../../../common/components/ui/ImageUploader';

interface SchoolFormProps {
  formData: SchoolFormData;
  formErrors: FormErrors;
  isEdit: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => void;
  onPhotoChange: (base64Image: string | null) => void;
}

export const SchoolForm: React.FC<SchoolFormProps> = ({
  formData,
  formErrors,
  isEdit,
  onInputChange,
  onPhotoChange
}) => {
  // Available facilities options
  const facilitiesOptions = [
    { value: 'parking', label: 'Otopark' },
    { value: 'shower', label: 'Duş' },
    { value: 'locker', label: 'Soyunma Odası' },
    { value: 'cafe', label: 'Kafeterya' },
    { value: 'airCondition', label: 'Klima' },
    { value: 'wifi', label: 'Wifi' }
  ];

  // Handle facilities change
  const handleFacilitiesChange = (selectedValues: string | string[]) => {
    if (Array.isArray(selectedValues)) {
      onInputChange({ target: { name: 'facilities', value: selectedValues } });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="col-span-2">
        <CustomInput
          label="Dans Okulu Adı"
          name="displayName"
          value={formData.displayName}
          onChange={onInputChange}
          error={formErrors.displayName}
          required
        />
      </div>

      <div className="col-span-2">
        <CustomInput
          label="E-posta"
          name="email"
          type="email"
          value={formData.email}
          onChange={onInputChange}
          error={formErrors.email}
          required
        />
      </div>

      <div className="col-span-2">
        <CustomPhoneInput
          value={formData.phoneNumber}
          onChange={(value) => onInputChange({ target: { name: 'phoneNumber', value } })}
          error={formErrors.phoneNumber}
        />
      </div>

      <div className="col-span-2">
        <CustomInput
          label="Website"
          name="website"
          type="text"
          value={formData.website || ''}
          onChange={onInputChange}
          error={formErrors.website}
        />
      </div>

      <div className="col-span-2">
        <CustomInput
          label="İletişim Kişisi"
          name="contactPerson"
          value={formData.contactPerson || ''}
          onChange={onInputChange}
          error={formErrors.contactPerson}
        />
      </div>

      <div className="md:col-span-1">
        <CustomInput
          label="Şehir"
          name="city"
          value={formData.city || ''}
          onChange={onInputChange}
          error={formErrors.city}
        />
      </div>

      <div className="md:col-span-1">
        <CustomInput
          label="İlçe"
          name="district"
          value={formData.district || ''}
          onChange={onInputChange}
          error={formErrors.district}
        />
      </div>

      <div className="col-span-2">
        <CustomInput
          label="Adres"
          name="address"
          value={formData.address || ''}
          onChange={onInputChange}
          error={formErrors.address}
          multiline
          rows={3}
        />
      </div>

      <div className="col-span-2">
        <CustomInput
          label="Açıklama"
          name="description"
          value={formData.description || ''}
          onChange={onInputChange}
          error={formErrors.description}
          multiline
          rows={3}
        />
      </div>

      <div className="col-span-2">
        <CustomSelect
          label="Olanaklar"
          name="facilities"
          value={formData.facilities || []}
          options={facilitiesOptions}
          multiple
          onChange={handleFacilitiesChange}
          error={formErrors.facilities}
        />
      </div>

      <div className="col-span-2">
        <ImageUploader
          currentPhotoURL={formData.photoURL}
          onImageChange={(base64Image) => onPhotoChange(base64Image)}
          displayName={formData.displayName || '?'}
          userType="school"
          shape="square"
          width={200}
          height={150}
        />
      </div>
    </div>
  );
}; 