import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClassList from './components/classes/ClassList';
import ClassDetails from './components/classes/ClassDetails';
import PartnerMatching from './components/partners/PartnerMatching';
import BadgeSystem from './components/progress/BadgeSystem';
import AdminPanel from './components/admin/AdminPanel';
import Navbar from './components/layout/Navbar';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import ProfileEditor from './components/profile/ProfileEditor';
import Home from './components/home/Home';
import useAuth from './hooks/useAuth';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

console.log('🔍 App bileşeni yükleniyor');
console.log('🔍 Firebase auth durumu:', auth ? 'Tanımlı' : 'Tanımsız', auth);

function App(): JSX.Element {
  console.log('🔍 App bileşeni render ediliyor');
  
  const { user, loading, error, isOffline } = useAuth();
  console.log('🔍 useAuth hook sonuçları:', { user: !!user, loading, error, isOffline });
  
  const isAuthenticated = !!user;
  const [firebaseInitError, setFirebaseInitError] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Profil fotoğrafının güncellendiğini log'la (debug için)
  useEffect(() => {
    if (user) {
      console.log('👤 Kullanıcı güncellendi:', { 
        photoURL: user.photoURL?.substring(0, 30) + '...',
        displayName: user.displayName
      });
      
      // Firebase Auth güncellemelerini dinle
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          console.log('🔄 Firebase Auth kullanıcı değişimi algılandı');
        }
      });
      
      return () => unsubscribe();
    }
  }, [user]);

  // Firebase hatalarını resetleme fonksiyonu
  const resetFirebaseErrors = useCallback(() => {
    console.log('🔄 Firebase hataları resetleniyor...');
    setFirebaseInitError(null);
    setResetTrigger(prev => prev + 1);
    window.location.reload();
  }, []);

  // Firebase hata mesajını daha kullanıcı dostu hale getir
  const getUserFriendlyErrorMessage = (errorMessage: string) => {
    console.log('🔍 Hata mesajı işleniyor:', errorMessage);
    
    if (errorMessage.includes('offline') || errorMessage.includes('unavailable')) {
      return 'İnternet bağlantınızı kontrol edin ve sayfayı yenileyin. Sunucuya bağlanılamıyor.';
    }
    
    if (errorMessage.includes('configuration-not-found')) {
      return 'Firebase yapılandırma hatası. Bu uygulama için Firebase projesi doğru şekilde yapılandırılmamış olabilir.';
    }
    
    if (errorMessage.includes('not initialized')) {
      return 'Firebase başlatılamadı. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.';
    }
    
    if (errorMessage.includes('Kullanıcı profili henüz oluşturulmamış')) {
      return errorMessage;
    }
    
    // Firebase servislerine bağlanılamama durumları için daha spesifik mesajlar
    if (errorMessage.includes('permission-denied')) {
      return 'Yetkilendirme hatası. Bu işlemi yapmak için gerekli yetkiye sahip değilsiniz.';
    }
    
    if (errorMessage.includes('PERMISSION_DENIED')) {
      return 'Erişim engellendi. Bu içeriğe erişmek için daha yüksek yetki gerekebilir.';
    }
    
    if (errorMessage.includes('quota-exceeded')) {
      return 'Firebase kota sınırı aşıldı. Kısa bir süre sonra tekrar deneyin.';
    }
    
    if (errorMessage.includes('network-request-failed')) {
      return 'Ağ isteği başarısız oldu. İnternet bağlantınızı kontrol edin.';
    }
    
    // Storage bucket ile ilgili hatalar için
    if (errorMessage.includes('storage/invalid-argument') || errorMessage.includes('storage/invalid-bucket')) {
      return 'Storage yapılandırma hatası. Uygulama yöneticisiyle iletişime geçin.';
    }
    
    console.error('⚠️ Bilinmeyen hata:', errorMessage);
    return 'Firebase servislerine bağlanırken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.';
  };
  
  // Uygulama sıkışmasını önlemek için timeout
  useEffect(() => {
    // 30 saniye sonra hala loading ise, zorla resetle
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Uygulama 30 saniyedir yükleniyor, zorla resetleniyor...');
        window.location.reload();
      }
    }, 30000);
    
    return () => clearTimeout(timeout);
  }, [loading, resetTrigger]);

  // Firebase hazır olduğunda tetiklenen olayı dinle
  useEffect(() => {
    console.log('🔍 firebaseReady event listener useEffect çalıştı');
    
    const handleFirebaseReady = (e: Event) => {
      const customEvent = e as CustomEvent<{success: boolean, error?: string}>;
      console.log('🔍 Firebase ready event alındı:', customEvent.detail);
      
      if (!customEvent.detail.success && customEvent.detail.error) {
        console.error('❌ Firebase başlatma hatası:', customEvent.detail.error);
        setFirebaseInitError(customEvent.detail.error);
      } else {
        console.log('✅ Firebase başarıyla başlatıldı');
        // Firebase başarıyla başlatıldı, hata varsa temizle
        setFirebaseInitError(null);
      }
    };
    
    // Olay dinleyicisini ekle
    document.addEventListener('firebaseReady', handleFirebaseReady);
    
    return () => {
      console.log('🔍 firebaseReady event listener temizleniyor');
      // Temizleme
      document.removeEventListener('firebaseReady', handleFirebaseReady);
    };
  }, []);

  useEffect(() => {
    console.log('🔍 Firebase başlatma kontrol useEffect çalıştı');
    
    // Firebase başlatma hatalarını yakalamak için
    try {
      console.log('🔍 Firebase auth nesnesini kontrol ediliyor...');
      // Auth nesnesinin hazır olup olmadığını kontrol et
      if (!auth) {
        console.error('❌ Firebase auth nesnesi tanımlanmamış');
        throw new Error('Firebase auth is not initialized');
      }
      
      console.log('🔍 Firebase auth.app özelliği kontrol ediliyor...', auth);
      
      // app özelliğinin ve name özelliğinin varlığını kontrol et
      if (auth.app && typeof auth.app.name === 'string') {
        console.log('✅ Firebase auth başarıyla başlatıldı:', auth.app.name);
      } else {
        console.warn('⚠️ Firebase auth başlatıldı, ancak app.name mevcut değil');
      }
      
      // Firebase config'i kontrol et
      console.log('🔍 Firebase config modülü import ediliyor...');
      import('./config/firebase').then(module => {
        const app = module.default;
        console.log('🔍 Firebase app modülü yüklendi:', app);
        
        if (!app || Object.keys(app).length === 0) {
          console.error('❌ Firebase app nesnesi boş veya düzgün başlatılmamış');
          setFirebaseInitError('Firebase uygulaması başlatılamadı. Lütfen yapılandırmayı kontrol edin.');
        } else {
          console.log('✅ Firebase app tam olarak başlatıldı');
          // Hata varsa temizle
          setFirebaseInitError(null);
        }
      }).catch(err => {
        console.error('❌ Firebase config importu hatası:', err);
        console.error('Hata stack:', err.stack);
        setFirebaseInitError('Firebase yapılandırması yüklenemedi: ' + err.message);
      });
    } catch (err: any) {
      console.error('❌ Firebase başlatma hatası:', err);
      console.error('Hata stack:', err.stack);
      setFirebaseInitError(err instanceof Error ? err.message : 'Firebase başlatılamadı');
    }
  }, [resetTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  // Ciddi hata durumunda göster
  if (firebaseInitError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Firebase Bağlantı Hatası</h2>
          <p className="text-gray-700 mb-4">
            {getUserFriendlyErrorMessage(firebaseInitError)}
          </p>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono overflow-auto">
            {firebaseInitError}
          </div>
          <div className="mt-6 flex flex-col space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
            >
              Sayfayı Yenile
            </button>
            <button 
              onClick={resetFirebaseErrors} 
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Firebase Bağlantısını Sıfırla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isOffline && (
          <div className="bg-yellow-500 text-white text-center py-2 px-4 fixed top-0 left-0 w-full z-50">
            ⚠️ Çevrimdışı moddasınız. İnternet bağlantınızı kontrol edin.
          </div>
        )}
        
        {error && !isOffline && (
          <div className="bg-orange-500 text-white text-center py-2 px-4 fixed top-0 left-0 w-full z-50">
            ⚠️ {getUserFriendlyErrorMessage(error)}
          </div>
        )}
        
        <Navbar isAuthenticated={isAuthenticated} user={user} />
        
        <main className={`pt-20 pb-10 ${(isOffline || (error && !isOffline)) ? 'mt-8' : ''}`}>
          <Routes>
            <Route path="/" element={<Home isAuthenticated={isAuthenticated} user={user} />} />
            <Route path="/classes" element={<ClassList />} />
            <Route path="/class/:id" element={<ClassDetails />} />
            <Route path="/partners" element={<PartnerMatching />} />
            <Route path="/progress" element={<BadgeSystem />} />
            <Route 
              path="/admin" 
              element={
                isAuthenticated ? <AdminPanel /> : <Navigate to="/signin" />
              } 
            />
            <Route 
              path="/profile" 
              element={
                isAuthenticated ? <ProfileEditor user={user} /> : <Navigate to="/signin" />
              } 
            />
            <Route path="/signin" element={isAuthenticated ? <Navigate to="/" /> : <SignIn />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <SignUp />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <footer className="bg-gray-800 text-white py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-xl font-bold mb-4">Dans Platformu</h2>
                <p className="text-gray-300 max-w-md">
                  Türkiye'nin en kapsamlı dans platformu. Dans kursları, eğitmenler ve dans partnerleri için tek adres.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Bağlantılar</h3>
                <ul className="space-y-2">
                  <li><a href="/classes" className="text-gray-300 hover:text-white">Dans Kursu Bul</a></li>
                  <li><a href="/partners" className="text-gray-300 hover:text-white">Partner Bul</a></li>
                  <li><a href="/progress" className="text-gray-300 hover:text-white">İlerleme</a></li>
                  {isAuthenticated && (
                    <li><a href="/profile" className="text-gray-300 hover:text-white">Profilim</a></li>
                  )}
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">İletişim</h3>
                <p className="text-gray-300">info@dansplatformu.com</p>
                <p className="text-gray-300">+90 212 555 1234</p>
                <div className="flex space-x-4 mt-4">
                  <a href="#" className="text-gray-300 hover:text-white">
                    <span className="sr-only">Facebook</span>
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white">
                    <span className="sr-only">Instagram</span>
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a href="#" className="text-gray-300 hover:text-white">
                    <span className="sr-only">Twitter</span>
                    <i className="fab fa-twitter"></i>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-700 text-gray-400 text-sm text-center">
              &copy; {new Date().getFullYear()} Dans Platformu. Tüm hakları saklıdır.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;