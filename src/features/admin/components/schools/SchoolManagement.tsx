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
  setDoc,
  getDoc
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { db, auth } from '../../../../api/firebase/firebase';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ImageUploader from '../../../../common/components/ui/ImageUploader';
import Button from '../../../../common/components/ui/Button';
import CustomPhoneInput from '../../../../common/components/ui/CustomPhoneInput';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import { resizeImageFromBase64 } from '../../../../api/services/userService';
import { generateInitialsAvatar } from '../../../../common/utils/imageUtils';

// Tip tanımlamaları
interface Okul {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  contactEmail: string;
  contactPerson: string;
  contactPhone: string;
  website: string;
  establishedYear: string;
  danceStyles: string[];
  status: string;
  userId: string;
  gorsel?: string;
  silinmis?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface FormData {
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
  contactEmail: string;
  contactPerson: string;
  contactPhone: string;
  website: string;
  establishedYear: string;
  danceStyles: string[];
  gorsel?: string;
  password?: string;
}

function SchoolManagement(): JSX.Element {
  const [okullar, setOkullar] = useState<Okul[]>([]);
  const [duzenlemeModu, setDuzenlemeModu] = useState<boolean>(false);
  const [seciliOkul, setSeciliOkul] = useState<Okul | null>(null);
  const [aramaTerimi, setAramaTerimi] = useState<string>('');
  const [formVeri, setFormVeri] = useState<FormData>({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
    contactEmail: '',
    contactPerson: '',
    contactPhone: '',
    website: '',
    establishedYear: '',
    danceStyles: [],
    password: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Arama sonuçları
  const filtrelenmisOkullar = okullar
    .filter(okul => 
      // Sadece arama terimine göre filtrele
      okul.name?.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
      okul.city?.toLowerCase().includes(aramaTerimi.toLowerCase())
    );

  useEffect(() => {
    console.log('📊 Filtrelenmiş okul sayısı:', filtrelenmisOkullar.length);
    console.log('📊 Filtrelenmiş okullar:', filtrelenmisOkullar.map(okul => ({
      id: okul.id,
      name: okul.name,
      status: okul.status,
      city: okul.city,
      contactEmail: okul.contactEmail
    })));
  }, [filtrelenmisOkullar]);

  // Manuel kullanıcı rehber görünürlüğünü kontrol etmek için
  const [rehberGoster, setRehberGoster] = useState<boolean>(false);
  
  // Manuel kullanıcı oluşturma kılavuzu
  const renderManuelKullaniciKilavuzu = () => {
    // Sadece başarı mesajı, "kullanıcı hesabı oluşturulamadı" içeriyorsa görüntüle
    if (success && success.includes('kullanıcı hesabı oluşturulamadı')) {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 mt-4">
          {!rehberGoster ? (
            <div className="flex justify-between items-center">
              <p className="font-semibold">Kullanıcı hesabını manuel olarak oluşturmak için rehbere ihtiyacınız var mı?</p>
              <button 
                onClick={() => setRehberGoster(true)}
                className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700 transition-colors"
              >
                Rehberi Göster
              </button>
            </div>
          ) : (
            <>
              <h4 className="font-bold mb-2">Manuel Kullanıcı Hesabı Oluşturma Kılavuzu</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Firebase Authentication konsoluna gidin</li>
                <li>Yeni bir kullanıcı ekleyin ve okul için kullandığınız e-posta adresini girin</li>
                <li>Güçlü bir şifre oluşturun (en az 6 karakter)</li>
                <li>Firestore'da "users" koleksiyonuna şu bilgileri içeren yeni bir doküman ekleyin:
                  <ul className="list-disc pl-5 mt-1">
                    <li>id: Oluşturulan Firebase Auth kullanıcısının UID'si</li>
                    <li>displayName: Okul adı</li>
                    <li>email: Okul e-posta adresi</li>
                    <li>role: ["school"]</li>
                    <li>photoURL: Okul fotoğrafı URL'si (varsa)</li>
                    <li>phoneNumber: Okul telefon numarası (varsa)</li>
                    <li>schoolId: Yeni eklenen okulun ID'si</li>
                    <li>createdAt ve updatedAt: serverTimestamp()</li>
                  </ul>
                </li>
                <li>Firestore'da "schools" koleksiyonundaki okul belgesine yeni oluşturduğunuz kullanıcının uid'sini "userId" alanına ekleyin</li>
              </ol>
              <p className="mt-2 font-semibold">Bu adımları tamamladıktan sonra, okul yöneticisi oluşturduğunuz kullanıcı bilgileriyle sisteme giriş yapabilecektir.</p>
              <button 
                onClick={() => setRehberGoster(false)}
                className="mt-2 text-blue-700 underline hover:text-blue-900"
              >
                Rehberi Gizle
              </button>
            </>
          )}
        </div>
      );
    }
    return null;
  }

  // Firebase'den okulları getir
  const fetchOkullar = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Okullar verisi çekiliyor...');
      const okullarRef = collection(db, 'schools');
      console.log('📌 Koleksiyon referansı alındı:', okullarRef.path);
      
      const q = query(okullarRef);
      console.log('📌 Sorgu oluşturuldu - Tüm okullar için');
      
      const querySnapshot = await getDocs(q);
      console.log(`📌 Veri çekildi. Toplam döküman sayısı: ${querySnapshot.size}`);
      
      if (querySnapshot.empty) {
        console.log('⚠️ Koleksiyon boş veya erişilemiyor');
        setError('Henüz kayıtlı okul bulunmuyor veya verilere erişilemiyor.');
        setOkullar([]);
        return;
      }
      
      const okullarData: Okul[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        console.log(`📌 Ham okul verisi:`, data);
        
        // Eski format ile yeni format arasında dönüşüm yap
        const mappedData = {
          id: doc.id,
          name: data.name || data.ad || '', // Eski format: ad
          description: data.description || data.aciklama || '', // Eski format: aciklama
          address: data.address || '',
          city: data.city || data.konum || '', // Eski format: konum
          country: data.country || '',
          zipCode: data.zipCode || '',
          contactEmail: data.contactEmail || data.iletisim || '', // Eski format: iletisim
          contactPerson: data.contactPerson || '',
          contactPhone: data.contactPhone || data.telefon || '', // Eski format: telefon
          website: data.website || '',
          establishedYear: data.establishedYear || '',
          danceStyles: data.danceStyles || [],
          status: data.status || 'ACTIVE', // Varsayılan olarak aktif
          userId: data.userId || '',
          gorsel: data.gorsel || '',
          silinmis: data.silinmis || false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };

        console.log(`📌 Dönüştürülmüş okul verisi:`, {
          id: mappedData.id,
          name: mappedData.name,
          status: mappedData.status,
          city: mappedData.city,
          contactEmail: mappedData.contactEmail
        });
        
        okullarData.push(mappedData as Okul);
      });
      
      console.log(`✅ İşlenen okul sayısı: ${okullarData.length}`);
      console.log('📊 Okulların durumları:', okullarData.map(okul => ({
        id: okul.id,
        name: okul.name,
        status: okul.status,
        city: okul.city,
        contactEmail: okul.contactEmail
      })));
      
      setOkullar(okullarData);
    } catch (err: any) {
      console.error('❌ Okulları getirirken hata oluştu:', err);
      console.error('Hata detayı:', {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      setError(
        'Okullar yüklenirken bir hata oluştu. ' +
        'Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin. ' +
        'Sorun devam ederse sistem yöneticisiyle iletişime geçin.'
      );
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
      name: okul.name,
      description: okul.description || '',
      address: okul.address || '',
      city: okul.city || '',
      country: okul.country || '',
      zipCode: okul.zipCode || '',
      contactEmail: okul.contactEmail || '',
      contactPerson: okul.contactPerson || '',
      contactPhone: okul.contactPhone || '',
      website: okul.website || '',
      establishedYear: okul.establishedYear || '',
      danceStyles: okul.danceStyles || [],
      password: ''
    });
    setDuzenlemeModu(true);
  };

  // Yeni okul ekleme
  const yeniOkulEkle = (): void => {
    setSeciliOkul(null);
    setFormVeri({
      name: '',
      description: '',
      address: '',
      city: '',
      country: '',
      zipCode: '',
      contactEmail: '',
      contactPerson: '',
      contactPhone: '',
      website: '',
      establishedYear: '',
      danceStyles: [],
      password: ''
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

  // Fotoğraf değişikliği
  const handleImageChange = async (base64Image: string): Promise<void> => {
    try {
      setLoading(true);
      // Görüntü boyutunu küçültmek için resizeImageFromBase64 kullan
      const resizedImage = await resizeImageFromBase64(base64Image, 400, 400, 0.75);
      
      // Form state'ini güncelle
      setFormVeri(prev => ({
        ...prev,
        gorsel: resizedImage
      }));
      
      // Eğer mevcut bir okul düzenleniyorsa, doğrudan Firebase'e kaydet
      if (seciliOkul) {
        const okulRef = doc(db, 'schools', seciliOkul.id);
        
        // Okul dokümanının görsel alanını güncelle
        await updateDoc(okulRef, {
          gorsel: resizedImage,
          updatedAt: serverTimestamp()
        });
        
        // Okula ait kullanıcı varsa, onun photoURL'ini de güncelle
        const okulDoc = await getDoc(okulRef);
        if (okulDoc.exists() && okulDoc.data().userId) {
          const userId = okulDoc.data().userId;
          
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
        // Yeni okul ekleme durumunda sadece form state'i güncellenir
        setSuccess('Fotoğraf başarıyla yüklendi. Okul kaydedildiğinde fotoğraf da kaydedilecek.');
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

  // Form gönderimi
  const formGonder = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Görsel yoksa varsayılan avatar oluştur
    let gorselData = formVeri.gorsel;
    
    if (!gorselData || gorselData === '/assets/images/dance/okul_default.jpg') {
      gorselData = generateInitialsAvatar(formVeri.name, 'school');
    }
    
    // Form verisini güncelle
    const formData = {
      ...formVeri,
      gorsel: gorselData
    };
    
    // Görsel tipini kontrol etmemiz için log
    console.log('Görsel veri tipi:', typeof gorselData);
    console.log('Görsel veri uzunluğu:', gorselData ? gorselData.length : 0);
    console.log('Görsel veri başlangıç:', gorselData ? gorselData.substring(0, 30) + '...' : 'boş');
    
    try {
      if (seciliOkul) {
        // Mevcut okulu güncelle - görsel zaten yüklenmiş olabilir
        const okulRef = doc(db, 'schools', seciliOkul.id);
        
        // Tüm form verilerini güncelle, zaten yüklenen görsel varsa o korunacak
        await updateDoc(okulRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        
        // Şifre değişikliği varsa kullanıcıyı güncelle
        if (formData.password && formData.password.length >= 6) {
          // Okula ait kullanıcı ID'sini al
          const okulDoc = await getDoc(okulRef);
          if (okulDoc.exists() && okulDoc.data().userId) {
            const userId = okulDoc.data().userId;
            
            try {
              // Kullanıcı belgesini Firestore'dan al
              const userDoc = await getDoc(doc(db, 'users', userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Şifre sıfırlama e-postası gönder
                await sendPasswordResetEmail(auth, userData.email);
                
                setSuccess('Okul başarıyla güncellendi. Şifre değişikliği için şifre sıfırlama e-postası gönderildi. Lütfen e-posta kutusunu kontrol edin.');
              } else {
                setSuccess('Okul başarıyla güncellendi, ancak kullanıcı bilgileri bulunamadığı için şifre sıfırlama e-postası gönderilemedi.');
              }
            } catch (passwordError) {
              console.error('Şifre sıfırlama e-postası gönderilirken hata oluştu:', passwordError);
              setSuccess('Okul başarıyla güncellendi, ancak şifre sıfırlama e-postası gönderilemedi.');
            }
          } else {
            setSuccess('Okul başarıyla güncellendi. Okula ait kullanıcı bulunamadığı için şifre değişikliği yapılamadı.');
          }
        } else {
          setSuccess('Okul bilgileri başarıyla güncellendi. Fotoğraf daha önceden kaydedilmişti.');
        }
      } else {
        // Yeni okul ekle
        const yeniOkulRef = await addDoc(collection(db, 'schools'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Okul için kullanıcı hesabı oluştur
        // E-posta adresini okul iletişim adresinden al
        const okulEmail = formData.contactEmail;
        
        // E-posta formatını kontrol et
        if (!okulEmail || !okulEmail.includes('@')) {
          throw new Error('Okul için geçerli bir e-posta adresi gereklidir');
        }
        
        try {
          // Şifre belirle - kullanıcı tarafından girilmiş veya otomatik oluştur
          let kullaniciSifresi = formData.password;
          
          // Şifre girilmemişse otomatik oluştur
          if (!kullaniciSifresi || kullaniciSifresi.length < 6) {
            kullaniciSifresi = `${formData.name.replace(/\s+/g, '').toLowerCase()}${new Date().getFullYear()}`;
            console.log("Otomatik oluşturulan şifre:", kullaniciSifresi);
          }
          
          // Firebase Auth'da kullanıcı oluşturma denemeleri
          console.log("Kullanıcı oluşturma denemesi başlıyor - email:", okulEmail);
          
          try {
            // Firebase Auth'da kullanıcı oluştur
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              okulEmail,
              kullaniciSifresi
            );
            
            console.log("Firebase Auth kullanıcısı oluşturuldu, UID:", userCredential.user.uid);
            
            // Kullanıcı profil bilgilerini güncelleyelim
            await updateProfile(userCredential.user, {
              displayName: formData.name
            });
            
            console.log("Kullanıcı profili güncellendi");
            
            // Firestore'da kullanıcı belgesini oluştur
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              id: userCredential.user.uid,
              displayName: formData.name,
              email: okulEmail,
              phoneNumber: formData.contactPhone || '',
              role: ['school'],  // Okul rolü
              photoURL: formData.gorsel || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              schoolId: yeniOkulRef.id // Okulun ID'si
            });
            
            console.log("Firestore'da kullanıcı belgesi oluşturuldu");
            
            // Okul belgesine kullanıcı ID'sini ekle
            await updateDoc(doc(db, 'schools', yeniOkulRef.id), {
              userId: userCredential.user.uid
            });
            
            console.log("Okul belgesi kullanıcı ID'si ile güncellendi");
            
            setSuccess(
              `Yeni okul ve okul hesabı başarıyla oluşturuldu!\n\n` +
              `Okul Giriş Bilgileri:\n` +
              `E-posta: ${okulEmail}\n` + 
              (formData.password 
                ? 'Belirttiğiniz şifre ile giriş yapabilirsiniz.\n\n' 
                : `Geçici Şifre: ${kullaniciSifresi}\n\n` +
                  'ÖNEMLİ: Lütfen bu şifreyi not alın, daha sonra görüntüleyemeyeceksiniz.'
              )
            );
          } catch (authError: any) {
            // Auth hatalarını daha ayrıntılı işle
            console.error('Firebase Auth kullanıcı oluşturma hatası:', authError);
            
            // Hata mesajını analiz et
            let hataDetayi = '';
            if (authError.code) {
              switch(authError.code) {
                case 'auth/email-already-in-use':
                  hataDetayi = 'Bu e-posta adresi zaten kullanımda.';
                  break;
                case 'auth/invalid-email':
                  hataDetayi = 'Geçersiz e-posta formatı.';
                  break;
                case 'auth/operation-not-allowed':
                  hataDetayi = 'E-posta/şifre girişi Firebase projesinde etkin değil.';
                  break;
                case 'auth/weak-password':
                  hataDetayi = 'Şifre yeterince güçlü değil. En az 6 karakter olmalıdır.';
                  break;
                default:
                  hataDetayi = authError.message || 'Bilinmeyen hata';
              }
            }
            
            // Okul bilgisini korumak için devam et
            setSuccess(
              `Yeni okul eklendi ancak kullanıcı hesabı oluşturulamadı. Hata: ${hataDetayi}\n\n` +
              `Okul Bilgileri:\n` +
              `- ID: ${yeniOkulRef.id}\n` +
              `- Ad: ${formData.name}\n` +
              `- E-posta: ${okulEmail}\n\n` + 
              `Lütfen yönetici panelinden manuel olarak bir kullanıcı hesabı oluşturun.`
            );
          }
        } catch (err) {
          console.error('Okul kullanıcısı oluşturma sürecinde genel hata:', err);
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
        // Önce okul verisini al ve ilişkili kullanıcı ID'sini bul
        const okulRef = doc(db, 'schools', id);
        const okulDoc = await getDoc(okulRef);
        
        if (okulDoc.exists()) {
          const okulData = okulDoc.data();
          
          // Kullanıcı kaydını sil (varsa)
          if (okulData.userId) {
            try {
              // Kullanıcı belgesini Firestore'dan sil
              await deleteDoc(doc(db, 'users', okulData.userId));
              console.log(`İlişkili kullanıcı (${okulData.userId}) başarıyla silindi.`);
            } catch (userError) {
              console.error('İlişkili kullanıcı silinirken hata oluştu:', userError);
              // Kullanıcı silme hatası olsa da okul silme işlemine devam et
            }
          }
        }
        
        // Firebase'den okulu sil
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

  return (
    <div>
      {/* Başlık ve Yeni Ekle butonu */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Dans Okulu Yönetimi</h2>
        {!duzenlemeModu && (
          <Button
            onClick={yeniOkulEkle}
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Yükleniyor...' : 'Yeni Okul Ekle'}
          </Button>
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
      
      {/* Manuel kullanıcı kılavuzu */}
      {renderManuelKullaniciKilavuzu()}
      
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Okul Adı*
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formVeri.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir*
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formVeri.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta Adresi*
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  required
                  value={formVeri.contactEmail}
                  onChange={handleInputChange}
                  className={`w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${seciliOkul ? 'bg-gray-100' : ''}`}
                  placeholder="okul@ornek.com"
                  readOnly={seciliOkul !== null}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {seciliOkul 
                    ? 'E-posta adresi değiştirilemez.' 
                    : 'Bu e-posta adresi, okul için otomatik olarak oluşturulacak kullanıcı hesabı için kullanılacaktır.'}
                </p>
              </div>
              
              <div>
                <CustomPhoneInput
                  id="contactPhone"
                  name="contactPhone"
                  value={formVeri.contactPhone}
                  onChange={handleInputChange}
                  onValidation={(isValid, errorMessage) => {
                    if (!isValid && errorMessage) {
                      setFormErrors(prev => ({
                        ...prev,
                        contactPhone: errorMessage
                      }));
                    } else {
                      setFormErrors(prev => {
                        const updated = {...prev};
                        delete updated.contactPhone;
                        return updated;
                      });
                    }
                  }}
                  label="Telefon"
                  required={true}
                  error={formErrors.contactPhone}
                />
              </div>
              
              {/* Şifre alanı */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre {!seciliOkul && <span className="text-xs text-gray-500">(isteğe bağlı)</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formVeri.password}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={seciliOkul ? "Güncellenmeyecekse boş bırakın" : "Boş bırakılırsa otomatik oluşturulur"}
                  minLength={6}
                />
                {seciliOkul ? (
                  <p className="mt-1 text-xs text-gray-500">
                    Şifre değişikliği için en az 6 karakter uzunluğunda bir şifre belirleyin veya boş bırakın.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Belirtilmezse, okul adına göre otomatik bir şifre oluşturulacaktır.
                  </p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <CustomSelect
                  label="Dans Stilleri"
                  options={[
                    'Bale',
                    'Modern Dans',
                    'Hip Hop',
                    'Jazz',
                    'Latin Dansları',
                    'Salsa',
                    'Bachata',
                    'Tango',
                    'Zumba',
                    'Çağdaş Dans',
                    'Break Dans',
                    'Halk Dansları'
                  ]}
                  value={formVeri.danceStyles}
                  onChange={(value) => {
                    setFormVeri(prev => ({
                      ...prev,
                      danceStyles: Array.isArray(value) ? value : [value]
                    }));
                  }}
                  multiple={true}
                  placeholder="Dans stilleri seçin"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formVeri.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <ImageUploader
                  currentPhotoURL={formVeri.gorsel}
                  onImageChange={(base64Image: string | null) => {
                    if (base64Image !== null) {
                      handleImageChange(base64Image);
                    } else {
                      // Fotoğraf silindiğinde işlem
                      setFormVeri(prev => ({
                        ...prev,
                        gorsel: ''
                      }));
                    }
                  }}
                  title="Okul Fotoğrafı"
                  shape="square"
                  width={300}
                  height={200}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setDuzenlemeModu(false)}
                variant="secondary"
                disabled={loading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                loading={loading}
              >
                {seciliOkul ? 'Güncelle' : 'Ekle'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Okul adı veya şehir ara..."
              value={aramaTerimi}
              onChange={(e) => setAramaTerimi(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
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
                      Şehir
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İletişim
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
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
                            <div className="flex-shrink-0 h-10 w-10 relative bg-indigo-100 rounded-full overflow-hidden">
                              {okul.gorsel ? (
                                <img 
                                  className="h-10 w-10 rounded-full object-cover absolute inset-0" 
                                  src={okul.gorsel}
                                  alt={okul.name}
                                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    const target = e.currentTarget;
                                    target.onerror = null;
                                    target.src = generateInitialsAvatar(okul.name, 'school');
                                  }}
                                />
                              ) : (
                                <img 
                                  className="h-10 w-10 rounded-full object-cover" 
                                  src={generateInitialsAvatar(okul.name, 'school')}
                                  alt={okul.name}
                                />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{okul.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{okul.city}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{okul.contactPhone}</div>
                          <div className="text-sm text-gray-500">{okul.contactEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            !okul.status ? 'bg-yellow-100 text-yellow-800' :
                            okul.status.toUpperCase() === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : okul.status.toUpperCase() === 'INACTIVE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {!okul.status
                              ? 'Belirsiz'
                              : okul.status.toUpperCase() === 'ACTIVE'
                              ? 'Aktif' 
                              : okul.status.toUpperCase() === 'INACTIVE'
                              ? 'Pasif'
                              : 'Belirsiz'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => okulDuzenle(okul)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => okulSil(okul.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Sil
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
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