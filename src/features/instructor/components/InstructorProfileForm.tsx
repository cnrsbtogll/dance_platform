import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { doc, updateDoc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth, storage } from '../../../api/firebase/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { User, DanceLevel, DanceStyle } from '../../../types';
import ImageUploader from '../../../common/components/ui/ImageUploader';
import { toast } from 'react-hot-toast';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../common/components/ui/CustomPhoneInput';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import CustomInput from '../../../common/components/ui/CustomInput';

interface InstructorProfileFormProps {
  user: User;
}

// Dans stilleri için tip tanımı
interface DanceStyleOption {
  value: string;
  label: string;
}

// Form verisi için tip tanımı
interface InstructorProfileFormData {
  displayName: string;
  bio: string;
  specialties: string[];
  experience: string;
  phoneNumber: string;
  countryCode: string;
  location: string;
  photoURL: string;
  // User table fields
  gender: string;
  age: number | undefined;
  level: DanceLevel;
  city: string;
  height?: number;
  weight?: number;
  danceStyles: string[];
  availableTimes: string[];
  // Additional fields
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  role?: string;
  userId?: string;
}

const InstructorProfileForm: React.FC<InstructorProfileFormProps> = ({ user }) => {
  const navigate = useNavigate();
  console.log('🔵 Component rendered with user:', user);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>(user.photoURL || '');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [resetImageUploader, setResetImageUploader] = useState(false);
  const { register, handleSubmit, setValue, watch, reset, getValues } = useForm<InstructorProfileFormData>({
    defaultValues: {
      displayName: '',
      bio: '',
      specialties: [],
      experience: '',
      phoneNumber: '',
      countryCode: '+90',
      location: '',
      photoURL: '',
      gender: '',
      age: undefined,
      level: 'beginner',
      city: '',
      height: undefined,
      weight: undefined,
      danceStyles: [],
      availableTimes: []
    }
  });

  // Kullanıcı kontrolü
  useEffect(() => {
    if (!user?.id) {
      console.error('❌ Invalid user state:', user);
      toast.error('Geçersiz kullanıcı bilgisi');
      navigate('/'); // Ana sayfaya yönlendir
      return;
    }
  }, [user, navigate]);

  // Dans stilleri seçenekleri
  const danceStyleOptions: DanceStyleOption[] = [
    { value: 'salsa', label: 'Salsa' },
    { value: 'bachata', label: 'Bachata' },
    { value: 'kizomba', label: 'Kizomba' },
    { value: 'tango', label: 'Tango' },
    { value: 'vals', label: 'Vals' }
  ];

  // Form değerlerini izle ve logla
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log('🔄 Form field changed:', { field: name, value, type });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    const fetchInstructorProfile = async () => {
      if (!user?.id) {
        console.error('❌ User ID not found');
        setInitialLoading(false);
        setFetchError('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        navigate('/');
        return;
      }

      try {
        setInitialLoading(true);
        setFetchError(null);
        console.log('🔍 Fetching instructor profile for user:', user.id);

        // Önce users koleksiyonunda kullanıcıyı kontrol et
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          console.error('❌ User document not found in users collection');
          setFetchError('Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.');
          navigate('/');
          return;
        }

        const userData = userSnap.data();
        const instructorRef = doc(db, 'instructors', user.id);
        const instructorSnap = await getDoc(instructorRef);

        if (instructorSnap.exists()) {
          const instructorData = instructorSnap.data();
          console.log('✅ Instructor profile found:', instructorData);
          console.log('✅ User data found:', userData);

          // Her iki koleksiyondan gelen verileri birleştir
          const formData = {
            // Instructor koleksiyonundan gelen veriler
            displayName: instructorData.displayName || userData.displayName || '',
            bio: instructorData.bio || '',
            specialties: instructorData.specialties || [],
            experience: instructorData.experience || '',
            phoneNumber: instructorData.phoneNumber || '',
            countryCode: instructorData.countryCode || '+90',
            location: instructorData.location || '',
            photoURL: instructorData.photoURL || userData.photoURL || '',
            
            // User koleksiyonundan gelen veriler
            gender: userData.gender || '',
            age: userData.age,
            level: userData.level || 'beginner',
            city: userData.city || '',
            height: userData.height,
            weight: userData.weight,
            danceStyles: userData.danceStyles || [],
            availableTimes: userData.availableTimes || [],
            
            // Diğer alanlar
            createdAt: instructorData.createdAt || '',
            updatedAt: instructorData.updatedAt || '',
            isActive: instructorData.isActive || true,
            role: userData.role || 'instructor',
            userId: user.id
          };

          console.log('📝 Setting form data:', formData);
          reset(formData);
          setSelectedSpecialties(formData.specialties);
          setProfilePhotoURL(formData.photoURL);
          toast.success('Profil bilgileri yüklendi');
        } else {
          console.log('ℹ️ No instructor profile found, creating new instructor profile');
          
          // Yeni eğitmen profili oluştur
          const newInstructorData: Partial<InstructorProfileFormData> = {
            displayName: userData.displayName || '',
            bio: '',
            specialties: [],
            experience: '',
            phoneNumber: '',
            countryCode: '+90',
            location: '',
            photoURL: userData.photoURL || '',
            gender: userData.gender || '',
            age: userData.age,
            level: userData.level || 'beginner' as DanceLevel,
            city: userData.city || '',
            height: userData.height,
            weight: userData.weight,
            danceStyles: userData.danceStyles || [],
            availableTimes: userData.availableTimes || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            role: 'instructor',
            userId: user.id
          };

          try {
            await setDoc(instructorRef, newInstructorData);
            console.log('✅ New instructor profile created:', newInstructorData);
            
            reset(newInstructorData as InstructorProfileFormData);
            setSelectedSpecialties([]);
            setProfilePhotoURL(userData.photoURL || '');
            toast.success('Yeni eğitmen profili oluşturuldu');
            
            // User dokümanını da güncelle
            await updateDoc(userRef, {
              role: 'instructor',
              updatedAt: new Date().toISOString()
            });
          } catch (error) {
            console.error('❌ Error creating instructor profile:', error);
            toast.error('Eğitmen profili oluşturulurken bir hata oluştu');
            throw error;
          }
        }
      } catch (error) {
        console.error('❌ Error fetching/creating profile:', error);
        setFetchError('Profil bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        toast.error('Profil bilgileri yüklenirken bir hata oluştu');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInstructorProfile();
  }, [user, reset, setValue, getValues, navigate]);

  const onSubmit = async (data: InstructorProfileFormData) => {
    if (!user?.id) {
      console.error('❌ Cannot submit: User ID not found');
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    console.log('📤 Form verileri:', data);
    console.log('📍 Seçilen dans stilleri:', data.danceStyles);

    setLoading(true);
    setSaveSuccess(false);

    try {
      const updateTimestamp = new Date().toISOString();

      // Instructor'a özel alanlar
      const instructorUpdates = {
        displayName: data.displayName.trim(),
        bio: data.bio.trim(),
        specialties: data.danceStyles || [],
        experience: data.experience.trim(),
        phoneNumber: data.phoneNumber.replace(/\s/g, ''),
        countryCode: data.countryCode,
        location: data.location.trim(),
        updatedAt: updateTimestamp,
        isActive: true,
        role: 'instructor'
      };

      // Users koleksiyonu için alanlar - boş değerleri kontrol et
      const userUpdates = {
        displayName: data.displayName.trim(),
        gender: data.gender || 'Belirtilmemiş',
        age: typeof data.age === 'number' ? data.age : 0,
        level: data.level || 'beginner',
        city: data.city || 'Belirtilmemiş',
        height: typeof data.height === 'number' ? data.height : 0,
        weight: typeof data.weight === 'number' ? data.weight : 0,
        danceStyles: data.danceStyles || [],
        availableTimes: data.availableTimes || [],
        role: 'instructor',
        updatedAt: updateTimestamp
      };

      console.log('📝 Güncellenecek instructor verileri:', instructorUpdates);
      console.log('📝 Güncellenecek user verileri:', userUpdates);

      // Firestore referansları
      const instructorRef = doc(db, 'instructors', user.id);
      const userRef = doc(db, 'users', user.id);

      // Batch write kullanarak her iki tabloyu da güncelle
      const batch = writeBatch(db);
      batch.update(instructorRef, instructorUpdates);
      batch.update(userRef, userUpdates);

      // Batch'i commit et
      await batch.commit();
      console.log('✅ Tüm güncellemeler tamamlandı');

      setSaveSuccess(true);
      toast.success('Profil başarıyla güncellendi');

      // Form verilerini yeniden yükle
      const [instructorSnap, userSnap] = await Promise.all([
        getDoc(instructorRef),
        getDoc(userRef)
      ]);

      if (instructorSnap.exists() && userSnap.exists()) {
        const instructorData = instructorSnap.data();
        const userData = userSnap.data();
        const updatedData = {
          ...instructorData,
          ...userData
        };
        console.log('📥 Güncel veriler:', updatedData);
        reset({
          ...data,
          ...updatedData
        });
      }

      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Güncelleme hatası:', error);
      console.error('Hata detayları:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });

      if (error.code === 'permission-denied') {
        toast.error('Bu işlem için yetkiniz bulunmuyor');
      } else if (error.code === 'invalid-argument') {
        toast.error('Geçersiz veri formatı');
      } else if (error.code === 'not-found') {
        toast.error('Profil bulunamadı');
      } else {
        toast.error('Profil güncellenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadComplete = async (base64Image: string | null) => {
    if (!user?.id) {
      console.error('❌ Cannot update photo: User ID not found');
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    if (!base64Image) {
      console.error('❌ No image data provided');
      toast.error('Fotoğraf verisi bulunamadı');
      return;
    }

    console.log('🖼️ Starting profile photo update:', { userId: user.id, hasImage: !!base64Image });
    
    try {
      // Önce UI state'ini güncelle
      setProfilePhotoURL(base64Image);
      setValue('photoURL', base64Image);

      // Batch write oluştur
      const batch = writeBatch(db);
      const instructorRef = doc(db, 'instructors', user.id);
      const userRef = doc(db, 'users', user.id);

      const updateTimestamp = new Date().toISOString();
      const sharedUpdates = {
        photoURL: base64Image,
        updatedAt: updateTimestamp
      };

      // Batch'e güncellemeleri ekle
      batch.update(instructorRef, sharedUpdates);
      batch.update(userRef, sharedUpdates);

      // Batch'i commit et
      await batch.commit();
      console.log('✅ Batch write completed successfully');

      // ImageUploader'ı sıfırla
      setResetImageUploader(true);
      setTimeout(() => setResetImageUploader(false), 100);

      toast.success('Profil fotoğrafı güncellendi');
    } catch (error: any) {
      // Hata durumunda UI'ı eski haline getir
      setProfilePhotoURL(user.photoURL || '');
      setValue('photoURL', user.photoURL || '');
      console.error('❌ Error updating profile photo:', error);

      if (error.code === 'resource-exhausted') {
        toast.error('Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyip tekrar deneyin.');
        // Otomatik yeniden deneme için timeout ekle
        setTimeout(() => {
          toast.success('Şimdi tekrar deneyebilirsiniz');
        }, 5000);
      } else {
        toast.error('Profil fotoğrafı güncellenirken bir hata oluştu');
      }
    }
  };

  // Dans stilleri değişikliğini handle eden fonksiyon
  const handleDanceStylesChange = (value: string | string[]) => {
    const styles = Array.isArray(value) ? value : [value];
    const filteredStyles = value === '' ? [] : styles.filter(style => style !== '');
    setValue('danceStyles', filteredStyles);
    setSelectedSpecialties(filteredStyles);
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg shadow-sm p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600">Profil bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hata Oluştu</h3>
          <p className="text-gray-600 mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  // Form içeriğine yeni alanları ekle
  const renderBasicInfoForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler</h3>
        <p className="text-sm text-gray-500 mb-6">
          Bu bilgiler profilinizde görüntülenecek ve öğrencilerinizle eşleşmeniz için kullanılacaktır.
        </p>
      </div>
      
      <ImageUploader
        currentPhotoURL={profilePhotoURL}
        onImageChange={handleImageUploadComplete}
        displayName={watch('displayName') || ''}
        userType="instructor"
        shape="circle"
        width={150}
        height={150}
      />
      
      <div>
        <CustomInput
          name="displayName"
          label="Adınız Soyadınız"
          value={watch('displayName')}
          onChange={(e) => setValue('displayName', e.target.value)}
          required
        />
      </div>
      
      <div>
        <CustomSelect
          name="gender"
          label="Cinsiyet"
          value={watch('gender')}
          onChange={(value: string | string[]) => setValue('gender', value as string)}
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
          value={watch('age')?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            setValue('age', value);
          }}
          required
        />
      </div>
      
      <div>
        <CustomSelect
          name="level"
          label="Dans Seviyesi"
          value={watch('level')}
          onChange={(value: string | string[]) => setValue('level', value as DanceLevel)}
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
          value={watch('city')}
          onChange={(e) => setValue('city', e.target.value)}
          required
          placeholder="Örn: İstanbul, Ankara"
        />
      </div>
      
      <div>
        <CustomPhoneInput
          name="phoneNumber"
          label="Telefon Numarası"
          countryCode={watch('countryCode')}
          phoneNumber={watch('phoneNumber')}
          onCountryCodeChange={(value) => setValue('countryCode', value)}
          onPhoneNumberChange={(value) => setValue('phoneNumber', value)}
        />
      </div>
    </div>
  );

  // Dans ve fiziksel özellikler formu
  const renderDanceAndPhysicalForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dans ve Fiziksel Özellikler</h3>
        <p className="text-sm text-gray-500 mb-6">
          Dans stilleriniz ve fiziksel özellikleriniz hakkında bilgi verin.
        </p>
      </div>
      
      <div>
        <CustomSelect
          name="danceStyles"
          label="Dans Stilleri"
          value={watch('danceStyles')}
          onChange={handleDanceStylesChange}
          options={danceStyleOptions}
          multiple={true}
          required
        />
        <p className="mt-2 text-sm text-gray-500">
          Seçtiğiniz dans stilleri hem uzmanlık alanlarınız hem de dans stilleriniz olarak kaydedilecektir.
        </p>
      </div>
      
      <div>
        <CustomInput
          type="text"
          name="height"
          label="Boy (cm)"
          value={watch('height')?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            setValue('height', value);
          }}
          placeholder="Örn: 175"
        />
      </div>
      
      <div>
        <CustomInput
          type="text"
          name="weight"
          label="Kilo (kg)"
          value={watch('weight')?.toString() || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            setValue('weight', value);
          }}
          placeholder="Örn: 70"
        />
      </div>
      
      <div>
        <CustomSelect
          name="availableTimes"
          label="Müsait Zamanlar"
          value={watch('availableTimes')}
          onChange={(value: string | string[]) => setValue('availableTimes', value as string[])}
          options={[
            { value: 'Sabah', label: 'Sabah' },
            { value: 'Öğlen', label: 'Öğlen' },
            { value: 'Akşam', label: 'Akşam' },
            { value: 'Hafta Sonu', label: 'Hafta Sonu' }
          ]}
          multiple={true}
        />
      </div>
    </div>
  );

  // Eğitmen özellikleri formu
  const renderInstructorDetailsForm = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Eğitmen Bilgileri</h3>
        <p className="text-sm text-gray-500 mb-6">
          Eğitmenlik deneyiminiz hakkında bilgi verin.
        </p>
      </div>
      
      <div>
        <CustomInput
          name="bio"
          label="Biyografi"
          value={watch('bio')}
          onChange={(e) => setValue('bio', e.target.value)}
          placeholder="Kendinizden, dans geçmişinizden ve öğretim yaklaşımınızdan bahsedin..."
          multiline
          rows={4}
        />
      </div>
      
      <div>
        <CustomInput
          name="experience"
          label="Deneyim"
          value={watch('experience')}
          onChange={(e) => setValue('experience', e.target.value)}
          placeholder="Örn: 5 yıl profesyonel dans eğitmenliği"
        />
      </div>
      
      <div>
        <CustomInput
          name="location"
          label="Ders Lokasyonu"
          value={watch('location')}
          onChange={(e) => setValue('location', e.target.value)}
          placeholder="Ders verdiğiniz stüdyo veya mekan"
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header Section */}
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Profil Bilgileri</h2>
          <p className="mt-1 text-sm text-gray-600">
            Profilinizi güncelleyerek öğrencilerinize kendinizi daha iyi tanıtın
          </p>
        </div>

        <div className="p-6 space-y-8">
          {renderBasicInfoForm()}
          {renderDanceAndPhysicalForm()}
          {renderInstructorDetailsForm()}
        </div>

        {/* Footer - Kaydet Butonu */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end items-center gap-3">
            {saveSuccess && (
              <div className="flex items-center text-green-600">
                <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Değişiklikler kaydedildi</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || saveSuccess}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
                ${saveSuccess 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'
                }
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                shadow-sm transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </>
              ) : saveSuccess ? (
                <>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Kaydedildi!
                </>
              ) : (
                'Değişiklikleri Kaydet'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default InstructorProfileForm; 