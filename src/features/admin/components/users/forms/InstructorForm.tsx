import React, { useEffect, useState } from 'react';
import { InstructorFormData, FormErrors } from '../types';
import CustomInput from '../../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../../../../common/components/ui/ImageUploader';
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

  useEffect(() => {
    const fetchDanceStyles = async () => {
      try {
        const danceStylesQuery = query(collection(db, 'danceStyles'), orderBy('label'));
        const querySnapshot = await getDocs(danceStylesQuery);
        const styles = querySnapshot.docs.map(doc => ({
          value: doc.id,
          label: doc.data().label
        }));
        setDanceStyles(styles);
      } catch (error) {
        console.error('Error fetching dance styles:', error);
        setDanceStyles([]);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchDanceStyles();
  }, []);

  // Handle specialties change
  const handleSpecialtiesChange = (selectedValues: string | string[]) => {
    if (Array.isArray(selectedValues)) {
      onInputChange({ target: { name: 'specialties', value: selectedValues } });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="col-span-2">
        <CustomInput
          label="Ad Soyad"
          name="displayName"
          value={formData.displayName}
          onChange={onInputChange}
          helperText={formErrors.displayName}
          error={!!formErrors.displayName}
        />
      </div>

      <div className="col-span-2">
        <CustomInput
          label="E-posta"
          name="email"
          type="email"
          value={formData.email}
          onChange={onInputChange}
          helperText={formErrors.email}
          error={!!formErrors.email}
        />
      </div>

      <div className="col-span-2">
        <CustomPhoneInput
          name="phoneNumber"
          label="Telefon"
          countryCode="+90"
          phoneNumber={formData.phoneNumber || ''}
          onCountryCodeChange={() => {}}
          onPhoneNumberChange={(value) => onInputChange({ target: { name: 'phoneNumber', value } })}
          error={!!formErrors.phoneNumber}
          helperText={formErrors.phoneNumber}
        />
      </div>

      <div className="col-span-2">
        <CustomInput
          label="Deneyim (Yıl)"
          name="experience"
          type="text"
          value={formData.experience?.toString() || ''}
          onChange={onInputChange}
          helperText={formErrors.experience}
          error={!!formErrors.experience}
        />
      </div>

      <div className="col-span-2">
        <CustomInput
          label="Biyografi"
          name="bio"
          value={formData.bio || ''}
          onChange={onInputChange}
          helperText={formErrors.bio}
          error={!!formErrors.bio}
          multiline
          rows={3}
        />
      </div>

      <div className="col-span-2">
        <CustomSelect
          label="Dans Okulu"
          name="schoolId"
          value={formData.schoolId || ''}
          options={[
            { value: '', label: 'Okul Seç...' },
            ...schools.map(school => ({
              value: school.id,
              label: school.displayName
            }))
          ]}
          onChange={(value) => onInputChange({ target: { name: 'schoolId', value } })}
          error={formErrors.schoolId}
        />
      </div>

      <div className="col-span-2">
        <CustomSelect
          label="Dans Stilleri"
          name="specialties"
          value={formData.specialties || []}
          options={danceStyles}
          multiple
          onChange={handleSpecialtiesChange}
          error={formErrors.specialties}
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