import React, { useState, useEffect } from 'react';
// import { dansOkullari } from '../../data/dansVerileri'; // Artık buna ihtiyacımız yok
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  setDoc 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification 
} from 'firebase/auth';
import { db, auth } from '../../../../api/firebase/firebase';
import { motion } from 'framer-motion';
import ImageUploader from '../../../../common/components/ui/ImageUploader';
import { resizeImageFromBase64 } from '../../../../api/services/userService';
import { generateInitialsAvatar } from '../../../../common/utils/imageUtils';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../common/components/ui/CustomPhoneInput';

// Tip tanımlamaları
interface Egitmen {
  id: string;
  ad: string;
  uzmanlık: string;
  tecrube: string;
  biyografi: string;
  okul_id: string; // Firestore'dan gelen okul ID'leri string olacak
  gorsel: string;
  userId?: string | null; // null olabilir
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  createdBy?: string | null; // null olabilir
  createdAt?: any;
  updatedAt?: any;
}

interface Okul {
  id: string; // Firestore document ID'si string olacak
  ad: string;
  konum: string;
  aciklama: string;
  iletisim: string;
  telefon: string;
  gorsel: string;
}

// Dans stilleri için interface
interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

// Form verisi için tip tanımı
interface FormData {
  ad: string;
  uzmanlık: string;
  tecrube: string;
  biyografi: string;
  okul_id: string;
  gorsel: string;
  email: string;
  phoneNumber: string;
  password: string;
}

function InstructorManagement(): JSX.Element {
  const [egitmenler, setEgitmenler] = useState<Egitmen[]>([]);
  const [dansOkullari, setDansOkullari] = useState<Okul[]>([]); // Okulları depolamak için state ekliyoruz
  const [duzenlemeModu, setDuzenlemeModu] = useState<boolean>(false);
  const [seciliEgitmen, setSeciliEgitmen] = useState<Egitmen | null>(null);
  const [aramaTerimi, setAramaTerimi] = useState<string>('');
  const [formVeri, setFormVeri] = useState<FormData>({
    ad: '',
    uzmanlık: '',
    tecrube: '',
    biyografi: '',
    okul_id: '',
    gorsel: '',
    email: '',
    phoneNumber: '',
    password: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  // Dans stillerini Firebase'den çek
  useEffect(() => {
    const fetchDanceStyles = async () => {
      setLoadingStyles(true);
      try {
        const danceStylesRef = collection(db, 'danceStyles');
        const q = query(danceStylesRef, orderBy('label'));
        const querySnapshot = await getDocs(q);
        
        const styles: DanceStyle[] = [];
        querySnapshot.forEach((doc) => {
          styles.push({
            id: doc.id,
            ...doc.data()
          } as DanceStyle);
        });
        
        if (styles.length === 0) {
          // Eğer Firestore'da stil yoksa varsayılan stilleri kullan
          setDanceStyles([
            { id: 'default-1', label: 'Salsa', value: 'salsa' },
            { id: 'default-2', label: 'Bachata', value: 'bachata' },
            { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
            { id: 'default-4', label: 'Tango', value: 'tango' },
            { id: 'default-5', label: 'Vals', value: 'vals' }
          ]);
        } else {
          setDanceStyles(styles);
        }
      } catch (err) {
        console.error('Dans stilleri getirilirken hata oluştu:', err);
        // Hata durumunda varsayılan stillere geri dön
        setDanceStyles([
          { id: 'default-1', label: 'Salsa', value: 'salsa' },
          { id: 'default-2', label: 'Bachata', value: 'bachata' },
          { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
          { id: 'default-4', label: 'Tango', value: 'tango' },
          { id: 'default-5', label: 'Vals', value: 'vals' }
        ]);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchDanceStyles();
  }, []);

  // Kullanıcının süper admin olup olmadığını kontrol et
  useEffect(() => {
    const checkIfSuperAdmin = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          let roles = userData.role || [];
          
          if (!Array.isArray(roles)) {
            roles = [roles];
          }
          
          setIsSuperAdmin(roles.includes('admin'));
        }
      } catch (err) {
        console.error('Süper admin kontrolü yapılırken hata oluştu:', err);
      }
    };
    
    checkIfSuperAdmin();
  }, []);

  // İlk yüklemede verileri çek
  useEffect(() => {
    console.log('useEffect tetiklendi');
    fetchInstructors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInstructors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('1. Eğitmenler getiriliyor...');
      const instructorsRef = collection(db, 'instructors');
      
      const querySnapshot = await getDocs(instructorsRef);
      console.log('3. Veriler alındı, döküman sayısı:', querySnapshot.size);
      
      // Tüm dökümanları logla
      console.log('Firestore\'daki tüm dökümanlar:');
      querySnapshot.forEach((doc) => {
        console.log('Döküman ID:', doc.id);
        console.log('Döküman verisi:', JSON.stringify(doc.data(), null, 2));
      });

      const instructorsData: Egitmen[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Her dökümanı detaylı logla
        console.log('4. Döküman işleniyor:', {
          id: doc.id,
          ad: data.displayName || data.ad || 'İsimsiz Eğitmen',
          uzmanlık: (data.specialties && data.specialties[0]) || data.uzmanlık || 'Belirtilmemiş',
          okul_id: data.okul_id || data.schoolId || '',
          email: data.email,
          userId: data.userId,
          createdAt: data.createdAt,
          tümVeri: data
        });

        // Eksik alanları varsayılan değerlerle doldur
        const instructorData = {
          id: doc.id,
          ad: data.displayName || data.ad || 'İsimsiz Eğitmen',
          uzmanlık: (data.specialties && data.specialties[0]) || data.uzmanlık || 'Belirtilmemiş',
          tecrube: data.experience || data.tecrube || 'Belirtilmemiş',
          biyografi: data.bio || data.biyografi || '',
          okul_id: data.okul_id || data.schoolId || '',
          gorsel: data.photoURL || data.gorsel || '/assets/images/dance/egitmen_default.jpg',
          userId: data.userId || null,
          email: data.email || '',
          displayName: data.displayName || data.ad || 'İsimsiz Eğitmen',
          phoneNumber: data.phoneNumber || '',
          createdBy: data.createdBy || null,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null
        };

        instructorsData.push(instructorData);
      });
      
      // Client-side sıralama
      instructorsData.sort((a, b) => {
        return a.ad.localeCompare(b.ad, 'tr');
      });
      
      console.log('5. Toplam işlenen eğitmen:', instructorsData.length);
      console.log('6. Tüm eğitmenler:', instructorsData.map(e => ({ 
        id: e.id, 
        ad: e.ad,
        email: e.email,
        okul: e.okul_id 
      })));
      
      setEgitmenler(instructorsData);
      setLoading(false);
    } catch (error: any) {
      console.error('7. Hata oluştu:', {
        error,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        code: error.code,
        details: error.details,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError('Eğitmenler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setLoading(false);
    }
  };

  // Dans okullarını Firestore'dan çek
  useEffect(() => {
    const fetchDansOkullari = async () => {
      try {
        console.log('Dans okulları getiriliyor...');
        const okullarRef = collection(db, 'schools');
        const q = query(okullarRef, orderBy('ad'));
        const querySnapshot = await getDocs(q);
        
        console.log('Dans okulları snapshot alındı, sayı:', querySnapshot.size);
        
        const okullarData: Okul[] = [];
        querySnapshot.forEach((doc) => {
          console.log('Okul işleniyor, ID:', doc.id);
          okullarData.push({
            id: doc.id,
            ...doc.data()
          } as Okul);
        });
        
        console.log('İşlenen toplam okul sayısı:', okullarData.length);
        setDansOkullari(okullarData);
      } catch (err) {
        console.error('Dans okulları yüklenirken detaylı hata:', {
          error: err,
          errorMessage: err instanceof Error ? err.message : 'Bilinmeyen hata',
          errorStack: err instanceof Error ? err.stack : undefined
        });
        setError('Dans okulları yüklenirken bir hata oluştu.');
      }
    };
    
    fetchDansOkullari();
  }, []);

  // Eğitmen düzenleme
  const egitmenDuzenle = (egitmen: Egitmen): void => {
    setSeciliEgitmen(egitmen);
    setFormVeri({
      ad: egitmen.ad,
      uzmanlık: egitmen.uzmanlık,
      tecrube: egitmen.tecrube,
      biyografi: egitmen.biyografi,
      okul_id: egitmen.okul_id,
      gorsel: egitmen.gorsel,
      email: egitmen.email || '',
      phoneNumber: egitmen.phoneNumber || '',
      password: ''
    });
    setDuzenlemeModu(true);
  };

  // Yeni eğitmen ekleme
  const yeniEgitmenEkle = (): void => {
    setSeciliEgitmen(null);
    setFormVeri({
      ad: '',
      uzmanlık: '',
      tecrube: '',
      biyografi: '',
      okul_id: '',
      gorsel: '/assets/images/dance/egitmen_default.jpg',
      email: '',
      phoneNumber: '',
      password: ''
    });
    setDuzenlemeModu(true);
  };

  // Form alanı değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormVeri(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormVeri(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Fotoğraf değişikliği
  const handleImageChange = async (base64Image: string | null): Promise<void> => {
    try {
      setLoading(true);
      
      // Eğer fotoğraf silindiyse
      if (base64Image === null) {
        setFormVeri(prev => ({
          ...prev,
          gorsel: '/assets/images/dance/egitmen_default.jpg'
        }));
        setLoading(false);
        return;
      }
      
      // Görüntü boyutunu küçültmek için resizeImageFromBase64 kullan
      const resizedImage = await resizeImageFromBase64(base64Image, 400, 400, 0.75);
      
      // Form state'ini güncelle
      setFormVeri(prev => ({
        ...prev,
        gorsel: resizedImage
      }));
      
      // Eğer mevcut bir eğitmen düzenleniyorsa, doğrudan Firebase'e kaydet
      if (seciliEgitmen) {
        const egitmenRef = doc(db, 'instructors', seciliEgitmen.id);
        
        // Eğitmen dokümanının görsel alanını güncelle
        await updateDoc(egitmenRef, {
          gorsel: resizedImage,
          updatedAt: serverTimestamp()
        });
        
        // Eğitmene ait kullanıcı varsa, onun photoURL'ini de güncelle
        const egitmenDoc = await getDoc(egitmenRef);
        if (egitmenDoc.exists() && egitmenDoc.data().userId) {
          const userId = egitmenDoc.data().userId;
          
          try {
            // Kullanıcı belgesini güncelle
            await updateDoc(doc(db, 'users', userId), {
              photoURL: resizedImage,
              updatedAt: serverTimestamp()
            });
            
            console.log('Kullanıcı fotoğrafı da güncellendi');
          } catch (userError) {
            console.error('Kullanıcı fotoğrafı güncellenirken hata:', userError);
          }
        }
        
        setSuccess('Fotoğraf başarıyla yüklendi ve kaydedildi.');
      } else {
        // Yeni eğitmen ekleme durumunda sadece form state'i güncellenir
        setSuccess('Fotoğraf başarıyla yüklendi. Eğitmen kaydedildiğinde fotoğraf da kaydedilecek.');
      }
      
      // 3 saniye sonra başarı mesajını temizle
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Fotoğraf yüklenirken hata oluştu:', error);
      setError('Fotoğraf yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // CustomSelect için handleSelectChange fonksiyonu
  const handleSelectChange = (fieldName: keyof FormData) => (selectedValue: string | string[]) => {
    if (typeof selectedValue === 'string') {
      setFormVeri(prev => ({
        ...prev,
        [fieldName]: selectedValue
      }));
    }
  };

  // Form gönderimi
  const formGonder = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Görsel yoksa varsayılan avatar oluştur
    let gorselData = formVeri.gorsel;
    
    if (!gorselData) {
      gorselData = generateInitialsAvatar(formVeri.ad, 'instructor');
    }
    
    // Form verisini güncelle
    const formData = {
      ...formVeri,
      gorsel: gorselData
    };
    
    // parseInt'a gerek yok çünkü okul_id artık string
    const okul_id = formData.okul_id;
    
    try {
      if (seciliEgitmen) {
        // Mevcut eğitmeni güncelle - görsel zaten yüklenmiş olabilir
        const egitmenRef = doc(db, 'instructors', seciliEgitmen.id);
        
        await updateDoc(egitmenRef, {
          ad: formData.ad,
          uzmanlık: formData.uzmanlık,
          tecrube: formData.tecrube,
          biyografi: formData.biyografi,
          okul_id: okul_id,
          gorsel: formData.gorsel,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          updatedAt: serverTimestamp()
        });
        
        // State'i güncelle
        const guncellenenEgitmenler = egitmenler.map(egitmen => 
          egitmen.id === seciliEgitmen.id ? { 
            ...egitmen, 
            ad: formData.ad,
            uzmanlık: formData.uzmanlık,
            tecrube: formData.tecrube,
            biyografi: formData.biyografi,
            okul_id: okul_id,
            gorsel: formData.gorsel,
            email: formData.email,
            phoneNumber: formData.phoneNumber
          } : egitmen
        );
        setEgitmenler(guncellenenEgitmenler);
        setSuccess('Eğitmen bilgileri başarıyla güncellendi. Fotoğraf daha önceden işlenmiş ve kaydedilmişti.');
        
      } else {
        // Kullanıcı hesabı oluşturma kısmı (her zaman yapılacak)
        let userId = '';
        let geciciSifre = '';
        
        if (!formData.email) {
          throw new Error('Eğitmen hesabı oluşturmak için geçerli bir e-posta adresi gereklidir.');
        }
        
        // Email'in zaten kullanılıp kullanılmadığını kontrol et
        const usersRef = collection(db, 'users');
        const emailQuery = query(usersRef, where('email', '==', formData.email));
        const emailQuerySnapshot = await getDocs(emailQuery);
        
        if (!emailQuerySnapshot.empty) {
          throw new Error('Bu e-posta adresi zaten kullanılıyor.');
        }
        
        // Geçici şifre oluştur - eğitmen ismine göre basit bir şifre
        geciciSifre = formData.password || `${formData.ad.replace(/\s+/g, '').toLowerCase()}${new Date().getFullYear()}`;
        
        // Firebase Auth ile yeni kullanıcı oluştur
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          geciciSifre
        );
        
        userId = userCredential.user.uid;
        
        // Kullanıcı profilini güncelle
        await updateProfile(userCredential.user, {
          displayName: formData.ad
        });
        
        // E-posta doğrulama gönder
        await sendEmailVerification(userCredential.user);
        
        // Firestore'da users koleksiyonuna yeni kullanıcı ekle
        await setDoc(doc(db, 'users', userId), {
          id: userId,
          email: formData.email,
          displayName: formData.ad,
          phoneNumber: formData.phoneNumber || '',
          role: ['instructor'], // Eğitmen rolü ekle
          level: 'advanced', // Eğitmenler için varsayılan seviye 
          photoURL: formData.gorsel || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          schoolId: okul_id // Eğitmenin bağlı olduğu okul
        });
        
        // Yeni eğitmen ekle
        const newInstructorData = {
          ad: formData.ad,
          uzmanlık: formData.uzmanlık,
          tecrube: formData.tecrube,
          biyografi: formData.biyografi,
          okul_id: okul_id,
          gorsel: formData.gorsel,
          email: formData.email || '',
          phoneNumber: formData.phoneNumber || '',
          userId: userId || null, // Eğer kullanıcı oluşturulduysa, userId'yi kaydet
          createdBy: auth.currentUser?.uid || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'instructors'), newInstructorData);
        
        // State'i güncelle
        const yeniEgitmen: Egitmen = {
          id: docRef.id,
          ...newInstructorData,
          okul_id: okul_id // Tip hatası için açıkça string olarak belirtiyoruz
        };
        
        setEgitmenler([yeniEgitmen, ...egitmenler]);
        
        // Başarı mesajı
        setSuccess(
          `Yeni eğitmen ve hesabı başarıyla oluşturuldu!\n\n` +
          `Eğitmen Giriş Bilgileri:\n` +
          `E-posta: ${formData.email}\n` +
          `Geçici Şifre: ${geciciSifre}\n\n` +
          `ÖNEMLİ: Lütfen bu şifreyi not alın, daha sonra görüntüleyemeyeceksiniz.`
        );
      }
      
      // Formu kapat
      setDuzenlemeModu(false);
      setSeciliEgitmen(null);
      
    } catch (err: any) {
      console.error('Eğitmen kaydedilirken hata oluştu:', err);
      setError('Eğitmen kaydedilirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Eğitmen silme
  const egitmenSil = async (id: string): Promise<void> => {
    if (window.confirm('Bu eğitmeni silmek istediğinizden emin misiniz?')) {
      setLoading(true);
      setError(null);
      try {
        // Firestore'dan sil
        await deleteDoc(doc(db, 'instructors', id));
        
        // State'i güncelle
        const filtrelenmisEgitmenler = egitmenler.filter(egitmen => egitmen.id !== id);
        setEgitmenler(filtrelenmisEgitmenler);
        setSuccess('Eğitmen başarıyla silindi.');
      } catch (err) {
        console.error('Eğitmen silinirken hata oluştu:', err);
        setError('Eğitmen silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Okul adını ID'ye göre getir
  const getOkulAdi = (okul_id: string): string => {
    const okul = dansOkullari.find(okul => okul.id === okul_id);
    return okul ? okul.ad : 'Bilinmeyen Okul';
  };
  
  // Filtrelenmiş eğitmenler
  const filtrelenmisEgitmenler = egitmenler.filter(egitmen => 
    egitmen.ad.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    getOkulAdi(egitmen.okul_id).toLowerCase().includes(aramaTerimi.toLowerCase())
  );

  if (loading && egitmenler.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Hata ve Başarı Mesajları */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 whitespace-pre-line" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Eğitmen Yönetimi</h2>
        {!duzenlemeModu && (
          <button 
            onClick={yeniEgitmenEkle}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Yükleniyor...' : 'Yeni Eğitmen Ekle'}
          </button>
        )}
      </div>
      
      {duzenlemeModu ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {seciliEgitmen ? 'Eğitmen Düzenle' : 'Yeni Eğitmen Ekle'}
          </h3>
          
          <form onSubmit={formGonder}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="ad" className="block text-sm font-medium text-gray-700 mb-1">
                  Eğitmen Adı*
                </label>
                <input
                  type="text"
                  id="ad"
                  name="ad"
                  required
                  value={formVeri.ad}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <CustomSelect
                  label="Uzmanlık Alanı"
                  value={formVeri.uzmanlık}
                  onChange={handleSelectChange('uzmanlık')}
                  options={danceStyles.map(style => ({
                    value: style.value,
                    label: style.label
                  }))}
                  placeholder="Dans Stili Seçin"
                  error={loadingStyles ? "Dans stilleri yükleniyor..." : undefined}
                />
              </div>
              
              <div>
                <label htmlFor="tecrube" className="block text-sm font-medium text-gray-700 mb-1">
                  Tecrübe
                </label>
                <input
                  type="text"
                  id="tecrube"
                  name="tecrube"
                  value={formVeri.tecrube}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Örn: 5 yıl"
                />
              </div>
              
              <div>
                <CustomSelect
                  label="Çalıştığı Okul"
                  value={formVeri.okul_id}
                  onChange={handleSelectChange('okul_id')}
                  options={dansOkullari.map(okul => ({
                    value: okul.id,
                    label: okul.ad
                  }))}
                  placeholder="Okul Seçin"
                  error={dansOkullari.length === 0 ? "Henüz hiç dans okulu bulunmamaktadır. Önce dans okulu eklemelisiniz." : undefined}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required={!seciliEgitmen}
                  value={formVeri.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                {!seciliEgitmen && (
                  <p className="mt-1 text-xs text-gray-500">
                    Eğitmen için otomatik olarak bir kullanıcı hesabı oluşturulacaktır.
                  </p>
                )}
              </div>
              
              <div>
                <CustomPhoneInput
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formVeri.phoneNumber}
                  onChange={handleInputChange}
                  label="Telefon"
                />
              </div>
              
              {!seciliEgitmen && (
                <div className="md:col-span-2">
                  <div className="mt-3">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Şifre
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formVeri.password}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="Boş bırakırsanız otomatik şifre oluşturulur"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Şifre belirtilmezse, eğitmenin adına göre otomatik bir şifre oluşturulacaktır.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label htmlFor="biyografi" className="block text-sm font-medium text-gray-700 mb-1">
                  Biyografi
                </label>
                <textarea
                  id="biyografi"
                  name="biyografi"
                  rows={4}
                  value={formVeri.biyografi}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="gorsel" className="block text-sm font-medium text-gray-700 mb-1">
                  Eğitmen Fotoğrafı
                </label>
                <ImageUploader
                  currentPhotoURL={formVeri.gorsel}
                  onImageChange={(base64Image) => handleImageChange(base64Image)}
                  title="Eğitmen Fotoğrafı"
                  shape="circle"
                  width={200}
                  height={200}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDuzenlemeModu(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (seciliEgitmen ? 'Güncelle' : 'Ekle')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Eğitmen adı veya uzmanlık ara..."
              value={aramaTerimi}
              onChange={(e) => setAramaTerimi(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {loading && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eğitmen
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uzmanlık
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Okul
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tecrübe
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtrelenmisEgitmenler.length > 0 ? (
                  filtrelenmisEgitmenler.map((egitmen) => (
                    <motion.tr 
                      key={egitmen.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative bg-blue-100 rounded-full overflow-hidden">
                            {egitmen.gorsel ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover absolute inset-0" 
                                src={egitmen.gorsel}
                                alt={egitmen.ad}
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  // Hata durumunda baş harf avatarını göster
                                  target.src = generateInitialsAvatar(egitmen.ad, 'instructor');
                                }}
                              />
                            ) : (
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={generateInitialsAvatar(egitmen.ad, 'instructor')}
                                alt={egitmen.ad}
                              />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{egitmen.ad}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {danceStyles.find(style => style.value === egitmen.uzmanlık)?.label || egitmen.uzmanlık}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getOkulAdi(egitmen.okul_id)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{egitmen.tecrube}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => egitmenDuzenle(egitmen)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => egitmenSil(egitmen.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      {aramaTerimi ? 'Aramanıza uygun eğitmen bulunamadı.' : 'Henüz hiç eğitmen kaydı bulunmuyor.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default InstructorManagement; 