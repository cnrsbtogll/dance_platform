import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp, 
  DocumentData, 
  QueryDocumentSnapshot, 
  Timestamp,
  setDoc
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Tip tanımlamaları
interface Okul {
  id: string;
  ad: string;
  aciklama: string;
  konum: string;
  iletisim: string;
  telefon: string;
  gorsel: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface FormData {
  ad: string;
  aciklama: string;
  konum: string;
  iletisim: string;
  telefon: string;
  gorsel: string;
}

function SchoolManagement(): JSX.Element {
  const [okullar, setOkullar] = useState<Okul[]>([]);
  const [duzenlemeModu, setDuzenlemeModu] = useState<boolean>(false);
  const [seciliOkul, setSeciliOkul] = useState<Okul | null>(null);
  const [aramaTerimi, setAramaTerimi] = useState<string>('');
  const [formVeri, setFormVeri] = useState<FormData>({
    ad: '',
    aciklama: '',
    konum: '',
    iletisim: '',
    telefon: '',
    gorsel: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Firebase'den okulları getir
  const fetchOkullar = async () => {
    setLoading(true);
    setError(null);
    try {
      const okullarRef = collection(db, 'dansOkullari');
      const q = query(okullarRef, orderBy('ad'));
      const querySnapshot = await getDocs(q);
      
      const okullarData: Okul[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        okullarData.push({
          id: doc.id,
          ...doc.data()
        } as Okul);
      });
      
      setOkullar(okullarData);
    } catch (err) {
      console.error('Okulları getirirken hata oluştu:', err);
      setError('Okullar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede verileri çek
  useEffect(() => {
    fetchOkullar();
  }, []);

  // Okul düzenleme
  const okulDuzenle = (okul: Okul): void => {
    setSeciliOkul(okul);
    setFormVeri({
      ad: okul.ad,
      aciklama: okul.aciklama || '',
      konum: okul.konum || '',
      iletisim: okul.iletisim || '',
      telefon: okul.telefon || '',
      gorsel: okul.gorsel || ''
    });
    setDuzenlemeModu(true);
  };

  // Yeni okul ekleme
  const yeniOkulEkle = (): void => {
    setSeciliOkul(null);
    setFormVeri({
      ad: '',
      aciklama: '',
      konum: '',
      iletisim: '',
      telefon: '',
      gorsel: '/assets/images/dance/okul_default.jpg'
    });
    setDuzenlemeModu(true);
  };

  // Form alanı değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormVeri(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form gönderimi
  const formGonder = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (seciliOkul) {
        // Mevcut okulu güncelle
        const okulRef = doc(db, 'dansOkullari', seciliOkul.id);
        await updateDoc(okulRef, {
          ...formVeri,
          updatedAt: serverTimestamp()
        });
        
        setSuccess('Okul başarıyla güncellendi.');
      } else {
        // Yeni okul ekle
        const yeniOkulRef = await addDoc(collection(db, 'dansOkullari'), {
          ...formVeri,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Okul için kullanıcı hesabı oluştur
        // E-posta adresini okul iletişim adresinden al
        const okulEmail = formVeri.iletisim;
        
        // E-posta formatını kontrol et
        if (!okulEmail || !okulEmail.includes('@')) {
          throw new Error('Okul için geçerli bir e-posta adresi gereklidir');
        }
        
        try {
          // Geçici şifre oluştur - okul ismine göre basit bir şifre
          const geciciSifre = `${formVeri.ad.replace(/\s+/g, '').toLowerCase()}${new Date().getFullYear()}`;
          
          // Firebase Auth'da kullanıcı oluştur
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            okulEmail,
            geciciSifre
          );
          
          // Kullanıcı profil bilgilerini güncelleyelim
          await updateProfile(userCredential.user, {
            displayName: formVeri.ad,
            photoURL: formVeri.gorsel || null
          });
          
          // Firestore'da kullanıcı belgesini oluştur
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            id: userCredential.user.uid,
            displayName: formVeri.ad,
            email: okulEmail,
            phoneNumber: formVeri.telefon || '',
            role: ['school'],  // Okul rolü
            photoURL: formVeri.gorsel || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            schoolId: yeniOkulRef.id // Okulun ID'si
          });
          
          // Okul belgesine kullanıcı ID'sini ekle
          await updateDoc(doc(db, 'dansOkullari', yeniOkulRef.id), {
            userId: userCredential.user.uid
          });
          
          setSuccess(
            `Yeni okul ve okul hesabı başarıyla oluşturuldu!\n\n` +
            `Okul Giriş Bilgileri:\n` +
            `E-posta: ${okulEmail}\n` +
            `Geçici Şifre: ${geciciSifre}\n\n` +
            `ÖNEMLİ: Lütfen bu şifreyi not alın, daha sonra görüntüleyemeyeceksiniz.`
          );
        } catch (authError) {
          console.error('Okul kullanıcı hesabı oluşturulurken hata:', authError);
          setSuccess('Yeni okul eklendi ancak kullanıcı hesabı oluşturulamadı. Lütfen manuel olarak oluşturun.');
        }
      }
      
      // Okul listesini yenile
      fetchOkullar();
      
      // Formu kapat
      setDuzenlemeModu(false);
      setSeciliOkul(null);
    } catch (err) {
      console.error('Okul kaydederken hata oluştu:', err);
      setError('Okul kaydedilirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Okul silme
  const okulSil = async (id: string): Promise<void> => {
    if (window.confirm('Bu okulu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      try {
        // Firebase'den okulu sil
        const okulRef = doc(db, 'dansOkullari', id);
        await deleteDoc(okulRef);
        
        // UI'dan okulu kaldır
        setOkullar(prevOkullar => prevOkullar.filter(okul => okul.id !== id));
        setSuccess('Okul başarıyla silindi.');
      } catch (err) {
        console.error('Okul silinirken hata oluştu:', err);
        setError('Okul silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Arama sonuçları
  const filtrelenmisOkullar = okullar.filter(okul => 
    okul.ad.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    okul.konum?.toLowerCase().includes(aramaTerimi.toLowerCase())
  );

  return (
    <div>
      {/* Başlık ve Yeni Ekle butonu */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Dans Okulu Yönetimi</h2>
        {!duzenlemeModu && (
          <button 
            onClick={yeniOkulEkle}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Yükleniyor...' : 'Yeni Okul Ekle'}
          </button>
        )}
      </div>
      
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
      
      {/* Form veya Liste */}
      {duzenlemeModu ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">
            {seciliOkul ? 'Okul Düzenle' : 'Yeni Okul Ekle'}
          </h3>
          
          {!seciliOkul && (
            <p className="text-sm text-gray-600 mb-4">
              Yeni okul eklendiğinde, otomatik olarak "school" rolüne sahip bir kullanıcı hesabı oluşturulacaktır. 
              Bu hesap, okul yöneticileri tarafından kullanılabilir.
            </p>
          )}
          
          <form onSubmit={formGonder}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="ad" className="block text-sm font-medium text-gray-700 mb-1">
                  Okul Adı*
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
                <label htmlFor="konum" className="block text-sm font-medium text-gray-700 mb-1">
                  Konum*
                </label>
                <input
                  type="text"
                  id="konum"
                  name="konum"
                  required
                  value={formVeri.konum}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="iletisim" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta Adresi*
                </label>
                <input
                  type="email"
                  id="iletisim"
                  name="iletisim"
                  required
                  value={formVeri.iletisim}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="okul@ornek.com"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Bu e-posta adresi, okul için otomatik olarak oluşturulacak kullanıcı hesabı için kullanılacaktır.
                </p>
              </div>
              
              <div>
                <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  id="telefon"
                  name="telefon"
                  value={formVeri.telefon}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="aciklama" className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="aciklama"
                  name="aciklama"
                  rows={3}
                  value={formVeri.aciklama}
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
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDuzenlemeModu(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (seciliOkul ? 'Güncelle' : 'Ekle')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Okul adı veya konum ara..."
              value={aramaTerimi}
              onChange={(e) => setAramaTerimi(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {loading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
          
          {!loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Okul
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Konum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İletişim
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtrelenmisOkullar.length > 0 ? (
                    filtrelenmisOkullar.map((okul) => (
                      <motion.tr 
                        key={okul.id} 
                        className="hover:bg-gray-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={okul.gorsel}
                                alt={okul.ad}
                                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  target.src = 'https://via.placeholder.com/40?text=Okul';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{okul.ad}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{okul.konum}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{okul.telefon}</div>
                          <div className="text-sm text-gray-500">{okul.iletisim}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link 
                            to={`/admin/schools/${okul.id}`}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Detaylar
                          </Link>
                          <button 
                            onClick={() => okulDuzenle(okul)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Düzenle
                          </button>
                          <button 
                            onClick={() => okulSil(okul.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        {aramaTerimi ? 'Aramanıza uygun okul bulunamadı.' : 'Henüz hiç okul kaydı bulunmamaktadır.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SchoolManagement; 