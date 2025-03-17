import React, { useState, useEffect } from 'react';
import { dansOkullari } from '../../data/dansVerileri';
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
import { db, auth } from '../../config/firebase';
import { motion } from 'framer-motion';

// Tip tanımlamaları
interface Egitmen {
  id: string;
  ad: string;
  uzmanlık: string;
  tecrube: string;
  biyografi: string;
  okul_id: number;
  gorsel: string;
  userId?: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface Okul {
  id: number;
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

interface FormData {
  ad: string;
  uzmanlık: string;
  tecrube: string;
  biyografi: string;
  okul_id: number | string;
  gorsel: string;
  email?: string;
  phoneNumber?: string;
  password?: string; // Super admin için yeni alan
  createAccount?: boolean; // Kullanıcı hesabı oluşturmak için
}

function InstructorManagement(): JSX.Element {
  const [egitmenler, setEgitmenler] = useState<Egitmen[]>([]);
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
    password: '',
    createAccount: false
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
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Firestore'dan eğitmenleri çek
      const instructorsRef = collection(db, 'instructors');
      const q = query(instructorsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const instructorsData: Egitmen[] = [];
      querySnapshot.forEach((doc) => {
        instructorsData.push({
          id: doc.id,
          ...doc.data()
        } as Egitmen);
      });
      
      setEgitmenler(instructorsData);
      setLoading(false);
    } catch (err) {
      console.error('Eğitmenler getirilirken hata oluştu:', err);
      setError('Eğitmenler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setLoading(false);
    }
  };

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
      password: '',
      createAccount: false
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
      password: '',
      createAccount: isSuperAdmin // Süper admin ise varsayılan olarak hesap oluşturma aktif
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

  // Form gönderimi
  const formGonder = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const okul_id = typeof formVeri.okul_id === 'string' 
      ? parseInt(formVeri.okul_id) 
      : formVeri.okul_id;
    
    try {
      if (seciliEgitmen) {
        // Mevcut eğitmeni güncelle
        const egitmenRef = doc(db, 'instructors', seciliEgitmen.id);
        
        await updateDoc(egitmenRef, {
          ad: formVeri.ad,
          uzmanlık: formVeri.uzmanlık,
          tecrube: formVeri.tecrube,
          biyografi: formVeri.biyografi,
          okul_id: okul_id,
          gorsel: formVeri.gorsel,
          email: formVeri.email,
          phoneNumber: formVeri.phoneNumber,
          updatedAt: serverTimestamp()
        });
        
        // State'i güncelle
        const guncellenenEgitmenler = egitmenler.map(egitmen => 
          egitmen.id === seciliEgitmen.id ? { 
            ...egitmen, 
            ad: formVeri.ad,
            uzmanlık: formVeri.uzmanlık,
            tecrube: formVeri.tecrube,
            biyografi: formVeri.biyografi,
            okul_id: okul_id,
            gorsel: formVeri.gorsel,
            email: formVeri.email,
            phoneNumber: formVeri.phoneNumber
          } : egitmen
        );
        setEgitmenler(guncellenenEgitmenler);
        setSuccess('Eğitmen bilgileri başarıyla güncellendi.');
        
      } else {
        // Süper admin ve kullanıcı hesabı oluşturma seçeneği işaretliyse
        let userId = '';
        
        if (isSuperAdmin && formVeri.createAccount && formVeri.email && formVeri.password) {
          // Email'in zaten kullanılıp kullanılmadığını kontrol et
          const usersRef = collection(db, 'users');
          const emailQuery = query(usersRef, where('email', '==', formVeri.email));
          const emailQuerySnapshot = await getDocs(emailQuery);
          
          if (!emailQuerySnapshot.empty) {
            throw new Error('Bu e-posta adresi zaten kullanılıyor.');
          }
          
          // Firebase Auth ile yeni kullanıcı oluştur
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formVeri.email, 
            formVeri.password
          );
          
          userId = userCredential.user.uid;
          
          // Kullanıcı profilini güncelle
          await updateProfile(userCredential.user, {
            displayName: formVeri.ad
          });
          
          // E-posta doğrulama gönder
          await sendEmailVerification(userCredential.user);
          
          // Firestore'da users koleksiyonuna yeni kullanıcı ekle
          await setDoc(doc(db, 'users', userId), {
            id: userId,
            email: formVeri.email,
            displayName: formVeri.ad,
            phoneNumber: formVeri.phoneNumber || '',
            role: ['instructor'], // Eğitmen rolü ekle
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        // Yeni eğitmen ekle
        const newInstructorData = {
          ad: formVeri.ad,
          uzmanlık: formVeri.uzmanlık,
          tecrube: formVeri.tecrube,
          biyografi: formVeri.biyografi,
          okul_id: okul_id,
          gorsel: formVeri.gorsel,
          email: formVeri.email || '',
          phoneNumber: formVeri.phoneNumber || '',
          userId: userId || null, // Eğer kullanıcı oluşturulduysa, userId'yi kaydet
          createdBy: auth.currentUser?.uid || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'instructors'), newInstructorData);
        
        // State'i güncelle
        const yeniEgitmen: Egitmen = {
          id: docRef.id,
          ...newInstructorData
        } as Egitmen;
        
        setEgitmenler([yeniEgitmen, ...egitmenler]);
        setSuccess('Yeni eğitmen başarıyla eklendi' + (userId ? ' ve kullanıcı hesabı oluşturuldu.' : '.'));
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

  // Arama sonuçları
  const filtrelenmisEgitmenler = egitmenler.filter(egitmen => 
    egitmen.ad.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    egitmen.uzmanlık.toLowerCase().includes(aramaTerimi.toLowerCase())
  );

  // Okul adını ID'ye göre getir
  const getOkulAdi = (okul_id: number): string => {
    const okul = dansOkullari.find(okul => okul.id === okul_id);
    return okul ? okul.ad : 'Bilinmeyen Okul';
  };

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
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
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
                <label htmlFor="uzmanlık" className="block text-sm font-medium text-gray-700 mb-1">
                  Uzmanlık Alanı*
                </label>
                <select
                  id="uzmanlık"
                  name="uzmanlık"
                  required
                  value={formVeri.uzmanlık}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Dans Stili Seçin</option>
                  {danceStyles.map(style => (
                    <option key={style.id} value={style.value}>{style.label}</option>
                  ))}
                </select>
                {loadingStyles && (
                  <div className="text-xs text-gray-500 mt-1">Dans stilleri yükleniyor...</div>
                )}
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
                <label htmlFor="okul_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Çalıştığı Okul*
                </label>
                <select
                  id="okul_id"
                  name="okul_id"
                  required
                  value={formVeri.okul_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Okul Seçin</option>
                  {dansOkullari.map(okul => (
                    <option key={okul.id} value={okul.id}>{okul.ad}</option>
                  ))}
                </select>
              </div>
              
              {/* Süper Admin ise e-posta ve telefon alanları */}
              {isSuperAdmin && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta {!seciliEgitmen && formVeri.createAccount && '*'}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required={!seciliEgitmen && formVeri.createAccount}
                      value={formVeri.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="text"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formVeri.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Kullanıcı hesabı oluşturma seçeneği */}
                  {!seciliEgitmen && (
                    <div className="md:col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="createAccount"
                          name="createAccount"
                          checked={formVeri.createAccount}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label htmlFor="createAccount" className="ml-2 block text-sm text-gray-700">
                          Eğitmen için kullanıcı hesabı oluştur
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Bu seçeneği işaretlerseniz, eğitmen için otomatik olarak kullanıcı hesabı oluşturulacak ve eğitmen rolü atanacaktır.
                      </p>
                    </div>
                  )}
                  
                  {/* Şifre alanı - hesap oluşturma işaretliyse */}
                  {!seciliEgitmen && formVeri.createAccount && (
                    <div className="md:col-span-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Şifre*
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        value={formVeri.password}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        minLength={6}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Şifre en az 6 karakter uzunluğunda olmalıdır.
                      </p>
                    </div>
                  )}
                </>
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
                  Fotoğraf URL'si
                </label>
                <input
                  type="text"
                  id="gorsel"
                  name="gorsel"
                  value={formVeri.gorsel}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="https://ornek.com/foto.jpg"
                />
                
                {formVeri.gorsel && (
                  <div className="mt-2">
                    <img 
                      src={formVeri.gorsel} 
                      alt="Önizleme" 
                      className="h-20 w-20 object-cover rounded-md"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).src = "/assets/images/dance/egitmen_default.jpg";
                      }} 
                    />
                  </div>
                )}
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
                  {isSuperAdmin && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                  )}
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
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={egitmen.gorsel}
                              alt={egitmen.ad}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/assets/images/dance/egitmen_default.jpg";
                              }}
                            />
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
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {egitmen.userId ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Hesap Var
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Hesap Yok
                            </span>
                          )}
                        </td>
                      )}
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
                    <td colSpan={isSuperAdmin ? 6 : 5} className="px-6 py-4 text-center text-sm text-gray-500">
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