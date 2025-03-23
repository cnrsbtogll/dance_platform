import React, { useEffect, useState } from 'react';
import { StudentFormData, InstructorFormData, SchoolFormData, FormErrors } from '../types';
import CustomInput from '../../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../../../../common/components/ui/ImageUploader';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../../api/firebase/firebase';

type FormDataType = StudentFormData | InstructorFormData | SchoolFormData;

interface UserFormProps {
  formData: FormDataType;
  formErrors: FormErrors;
  isEdit: boolean;
  userType: 'student' | 'instructor' | 'school';
  instructors?: Array<{ id: string; displayName: string }>;
  schools?: Array<{ id: string; displayName: string }>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }) => void;
  onPhotoChange: (base64Image: string | null) => void;
}

export const UserForm: React.FC<UserFormProps> = ({
  formData,
  formErrors,
  isEdit,
  userType,
  instructors = [],
  schools = [],
  onInputChange,
  onPhotoChange
}) => {
  const [danceStyles, setDanceStyles] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingStyles, setLoadingStyles] = useState(false);

  // Fetch dance styles for instructor form
  useEffect(() => {
    if (userType === 'instructor') {
      const fetchDanceStyles = async () => {
        setLoadingStyles(true);
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
    }
  }, [userType]);

  // Available facilities options for school form
  const facilitiesOptions = [
    { value: 'parking', label: 'Otopark' },
    { value: 'shower', label: 'Duş' },
    { value: 'locker', label: 'Soyunma Odası' },
    { value: 'cafe', label: 'Kafeterya' },
    { value: 'airCondition', label: 'Klima' },
    { value: 'wifi', label: 'Wifi' }
  ];

  // Handle multi-select changes
  const handleMultiSelectChange = (name: string) => (selectedValues: string | string[]) => {
    if (Array.isArray(selectedValues)) {
      onInputChange({ target: { name, value: selectedValues } });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Common Fields for All User Types */}
      <div className="col-span-full md:col-span-2">
        <CustomInput
          label={userType === 'school' ? 'Dans Okulu Adı' : 'Ad Soyad'}
          name="displayName"
          value={formData.displayName}
          onChange={onInputChange}
          helperText={formErrors.displayName}
          error={!!formErrors.displayName}
          required
          fullWidth
        />
      </div>

      <div className="col-span-full md:col-span-1">
        <CustomInput
          label="E-posta"
          name="email"
          type="email"
          value={formData.email}
          onChange={onInputChange}
          helperText={isEdit ? "Mevcut kullanıcıların e-posta adresleri değiştirilemez." : formErrors.email}
          error={!!formErrors.email}
          disabled={isEdit}
          required
          fullWidth
        />
      </div>

      <div className="col-span-full md:col-span-1">
        <CustomPhoneInput
          name="phoneNumber"
          label="Telefon"
          countryCode="+90"
          phoneNumber={formData.phoneNumber || ''}
          onCountryCodeChange={() => {}}
          onPhoneNumberChange={(phoneNumber: string) => onInputChange({ target: { name: 'phoneNumber', value: phoneNumber } })}
          error={!!formErrors.phoneNumber}
          helperText={formErrors.phoneNumber}
        />
      </div>

      {/* Student Specific Fields */}
      {userType === 'student' && (
        <>
          <div className="col-span-full md:col-span-1">
            <CustomSelect
              name="level"
              label="Dans Seviyesi"
              value={(formData as StudentFormData).level}
              onChange={(value) => onInputChange({ target: { name: 'level', value } })}
              options={[
                { value: 'beginner', label: 'Başlangıç' },
                { value: 'intermediate', label: 'Orta' },
                { value: 'advanced', label: 'İleri' },
                { value: 'professional', label: 'Profesyonel' }
              ]}
              fullWidth
              required
            />
          </div>

          <div className="col-span-full md:col-span-1">
            <CustomSelect
              name="instructorId"
              label="Eğitmen"
              value={(formData as StudentFormData).instructorId}
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
        </>
      )}

      {/* Instructor Specific Fields */}
      {userType === 'instructor' && (
        <>
          <div className="col-span-full md:col-span-1">
            <CustomInput
              label="Deneyim (Yıl)"
              name="experience"
              type="text"
              value={(formData as InstructorFormData).experience?.toString() || ''}
              onChange={onInputChange}
              helperText={formErrors.experience}
              error={!!formErrors.experience}
              fullWidth
            />
          </div>

          <div className="col-span-full md:col-span-1">
            <CustomSelect
              label="Dans Stilleri"
              name="specialties"
              value={(formData as InstructorFormData).specialties || []}
              options={loadingStyles ? [{ value: '', label: 'Yükleniyor...' }] : danceStyles}
              multiple
              onChange={handleMultiSelectChange('specialties')}
              error={formErrors.specialties}
              fullWidth
            />
          </div>

          <div className="col-span-full">
            <CustomInput
              label="Biyografi"
              name="bio"
              value={(formData as InstructorFormData).bio || ''}
              onChange={onInputChange}
              helperText={formErrors.bio}
              error={!!formErrors.bio}
              multiline
              rows={3}
              fullWidth
            />
          </div>
        </>
      )}

      {/* School Specific Fields */}
      {userType === 'school' && (
        <>
          <div className="col-span-full md:col-span-1">
            <CustomInput
              label="Website"
              name="website"
              type="text"
              value={(formData as SchoolFormData).website || ''}
              onChange={onInputChange}
              helperText={formErrors.website}
              error={!!formErrors.website}
              fullWidth
            />
          </div>

          <div className="col-span-full md:col-span-1">
            <CustomInput
              label="İletişim Kişisi"
              name="contactPerson"
              value={(formData as SchoolFormData).contactPerson || ''}
              onChange={onInputChange}
              helperText={formErrors.contactPerson}
              error={!!formErrors.contactPerson}
              fullWidth
            />
          </div>

          <div className="col-span-full md:col-span-1">
            <CustomInput
              label="Şehir"
              name="city"
              value={(formData as SchoolFormData).city || ''}
              onChange={onInputChange}
              helperText={formErrors.city}
              error={!!formErrors.city}
              fullWidth
            />
          </div>

          <div className="col-span-full md:col-span-1">
            <CustomInput
              label="İlçe"
              name="district"
              value={(formData as SchoolFormData).district || ''}
              onChange={onInputChange}
              helperText={formErrors.district}
              error={!!formErrors.district}
              fullWidth
            />
          </div>

          <div className="col-span-full">
            <CustomInput
              label="Adres"
              name="address"
              value={(formData as SchoolFormData).address || ''}
              onChange={onInputChange}
              helperText={formErrors.address}
              error={!!formErrors.address}
              multiline
              rows={3}
              fullWidth
            />
          </div>

          <div className="col-span-full">
            <CustomInput
              label="Açıklama"
              name="description"
              value={(formData as SchoolFormData).description || ''}
              onChange={onInputChange}
              helperText={formErrors.description}
              error={!!formErrors.description}
              multiline
              rows={3}
              fullWidth
            />
          </div>

          <div className="col-span-full">
            <CustomSelect
              label="Olanaklar"
              name="facilities"
              value={(formData as SchoolFormData).facilities || []}
              options={facilitiesOptions}
              multiple
              onChange={handleMultiSelectChange('facilities')}
              error={formErrors.facilities}
              fullWidth
            />
          </div>
        </>
      )}

      {/* School Selection for Students and Instructors */}
      {(userType === 'student' || userType === 'instructor') && (
        <div className="col-span-full">
          <CustomSelect
            name="schoolId"
            label="Dans Okulu"
            value={(formData as StudentFormData | InstructorFormData).schoolId || ''}
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
      )}

      {/* Image Uploader */}
      <div className="col-span-full flex justify-center">
        <ImageUploader
          currentPhotoURL={formData.photoURL}
          onImageChange={onPhotoChange}
          displayName={formData.displayName || '?'}
          userType={userType}
          shape={userType === 'school' ? 'square' : 'circle'}
          width={userType === 'school' ? 200 : 150}
          height={userType === 'school' ? 150 : 150}
        />
      </div>
    </div>
  );
}; 