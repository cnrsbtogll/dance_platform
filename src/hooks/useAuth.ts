import { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp, enableNetwork, disableNetwork, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  setUser: (user: User) => void;
}

// Yeniden deneme mekanizması için yardımcı fonksiyon
const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000,
  onError?: (error: any, attempt: number) => void
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (onError) onError(error, attempt + 1);
      
      if (attempt < retries - 1) {
        console.log(`Retry attempt ${attempt + 1}/${retries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Her denemede gecikmeyi artır (exponential backoff)
        delay *= 1.5;
      }
    }
  }
  
  throw lastError;
};

export const useAuth = (): AuthState => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isOffline: false,
    setUser: () => {}
  });

  console.log('🔍 useAuth hook başlatılıyor');
  
  // İşlem durumunu takip eden ref
  const isAuthProcessingRef = useRef(false);
  const userProfileCreatedRef = useRef(false);

  // Firebase bağlantı durumunu kontrol et
  useEffect(() => {
    console.log('🔍 Firebase bağlantı kontrol useEffect çalıştı');
    
    const checkFirebaseConnection = async () => {
      console.log('🔍 Firebase bağlantısı kontrol ediliyor...');
      
      // Firestore nesnesini kontrol et
      if (!db || Object.keys(db).length === 0) {
        console.error('❌ Firestore nesnesi boş veya başlatılmamış');
        setState(prev => ({ 
          ...prev, 
          isOffline: false, 
          error: 'Firebase Firestore başlatılmamış. Lütfen sayfayı yenileyin.' 
        }));
        return;
      }
      
      try {
        console.log('🔍 Firestore koleksiyon testi başlatılıyor...');
        // Firestore koleksiyonlarını listeleyerek bağlantı testi yap
        await retry(
          async () => {
            console.log('🔍 Collection referansı alınıyor: users');
            const testQuery = collection(db, 'users');
            console.log('🔍 getDocs çağrılıyor...');
            await getDocs(testQuery);
            console.log('✅ getDocs başarılı');
          },
          3,
          1000,
          (error, attempt) => {
            console.error(`❌ Bağlantı testi denemesi ${attempt} başarısız:`, error);
            console.error('Hata kodu:', error.code);
            console.error('Hata mesajı:', error.message);
          }
        );
        
        console.log('✅ Firebase bağlantı testi başarılı');
        setState(prev => ({ ...prev, isOffline: false, error: null }));
      } catch (error: any) {
        console.error('❌ Firebase bağlantı testi başarısız (tüm denemeler sonrası):', error);
        console.error('Hata kodu:', error.code);
        console.error('Hata mesajı:', error.message);
        console.error('Hata stack:', error.stack);
        
        // Bağlantı hatalarını daha detaylı sınıflandır
        if (error.code === 'unavailable' || 
            error.code === 'failed-precondition' || 
            error.message?.includes('client is offline')) {
          console.log('⚠️ Offline durum tespit edildi');
          setState(prev => ({ 
            ...prev, 
            isOffline: true, 
            error: 'Firebase bağlantı hatası. İnternet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.' 
          }));
        } else if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
          console.log('⚠️ Yetki hatası tespit edildi');
          setState(prev => ({
            ...prev,
            isOffline: false,
            error: 'Firebase erişim hatası. Bu verilere erişmek için yetkiniz bulunmuyor.'
          }));
        } else if (error.code === 'resource-exhausted') {
          console.log('⚠️ Kota sınırı aşıldı');
          setState(prev => ({
            ...prev,
            isOffline: false,
            error: 'Firebase kota sınırı aşıldı. Kısa bir süre sonra tekrar deneyin.'
          }));
        } else {
          console.log('⚠️ Bilinmeyen Firebase hatası');
          setState(prev => ({
            ...prev,
            isOffline: false,
            error: `Firebase bağlantı hatası: ${error.message || 'Bilinmeyen bir hata oluştu'}`
          }));
        }
      }
    };

    checkFirebaseConnection();
    
    // Periyodik olarak bağlantı durumunu kontrol et
    console.log('🔍 Periyodik bağlantı kontrolü başlatılıyor (60 saniye)');
    const connectionCheckInterval = setInterval(checkFirebaseConnection, 60000); // Her 1 dakikada bir
    
    return () => {
      console.log('🔍 Firebase bağlantı kontrol useEffect temizleniyor');
      clearInterval(connectionCheckInterval);
    };
  }, []);

  // Network durumunu izleme
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Network is online, enabling Firestore');
      enableNetwork(db).catch(err => console.error('Failed to enable network:', err));
      setState(prev => ({ ...prev, isOffline: false, error: null }));
    };

    const handleOffline = () => {
      console.log('🔴 Network is offline, disabling Firestore');
      disableNetwork(db).catch(err => console.error('Failed to disable network:', err));
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // İlk yükleme durumunu kontrol et
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth durumunu izleme
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
        
        // Halihazırda işleniyor ise çık
        if (isAuthProcessingRef.current) {
          console.log('⚠️ Auth state change is already being processed, skipping...');
          return;
        }
        
        isAuthProcessingRef.current = true;
        
        try {
          if (firebaseUser) {
            // Offline durumunu kontrol et
            if (!navigator.onLine) {
              console.log('Cannot fetch user data: Device is offline');
              setState(prevState => ({
                ...prevState,
                user: {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || '',
                  photoURL: firebaseUser.photoURL || '',
                  role: 'student', // Varsayılan rol
                  createdAt: new Date(),
                } as User,
                loading: false,
                error: null,
                isOffline: true
              }));
              isAuthProcessingRef.current = false;
              return;
            }

            try {
              console.log(`Fetching user data for UID: ${firebaseUser.uid}`);
              
              // Firestore'dan kullanıcı verilerini çek - yeniden deneme mekanizması ile
              const fetchUserData = async () => {
                return await getDoc(doc(db, 'users', firebaseUser.uid));
              };
              
              const userDoc = await retry(
                fetchUserData,
                2, // Daha az deneme
                800, // Daha kısa ilk gecikme
                (error, attempt) => console.log(`User data fetch attempt ${attempt} failed:`, error)
              );
              
              if (userDoc.exists()) {
                console.log('User document found in Firestore');
                const userData = userDoc.data() as Omit<User, 'createdAt'> & { createdAt: Timestamp };
                
                // Kullanıcı verilerini ayarla
                setState(prevState => ({
                  ...prevState,
                  user: {
                    ...userData,
                    id: firebaseUser.uid,
                    createdAt: userData.createdAt.toDate(),
                    // Auth verilerinden eksik bilgileri tamamla
                    displayName: userData.displayName || firebaseUser.displayName || '',
                    email: userData.email || firebaseUser.email || '',
                    photoURL: userData.photoURL || firebaseUser.photoURL || ''
                  } as User,
                  loading: false,
                  error: null,
                  isOffline: false
                }));
              } else {
                // Kullanıcı profili daha önce oluşturulmuş mu kontrol et
                if (userProfileCreatedRef.current) {
                  console.log('⚠️ User profile creation already attempted, skipping...');
                  setState(prevState => ({
                    ...prevState,
                    user: {
                      id: firebaseUser.uid,
                      email: firebaseUser.email || '',
                      displayName: firebaseUser.displayName || '',
                      photoURL: firebaseUser.photoURL || '',
                      role: 'student', // Varsayılan rol
                      createdAt: new Date(),
                    } as User,
                    loading: false,
                    error: null,
                    isOffline: false
                  }));
                  isAuthProcessingRef.current = false;
                  return;
                }
                
                console.log('User document NOT found in Firestore, creating new profile');
                userProfileCreatedRef.current = true; // Profil oluşturma girişimini işaretle
                
                try {
                  // Yeni kullanıcı belgesi oluştur
                  const newUserData = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || '',
                    photoURL: firebaseUser.photoURL || '',
                    role: 'student', // Varsayılan rol
                    createdAt: new Date()
                  };
                  
                  // Firestore'a kaydet
                  await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
                  console.log('✅ User profile created successfully');
                  
                  // Kullanıcı durumunu güncelle - hata olmadan
                  setState(prevState => ({
                    ...prevState,
                    user: newUserData as User,
                    loading: false,
                    error: null,
                    isOffline: false
                  }));
                } catch (createError: any) {
                  console.error('❌ Error creating user profile:', createError);
                  
                  // Firestore'da kullanıcı verisi yoksa, sadece Firebase Authentication'dan gelen temel bilgileri kullan
                  setState(prevState => ({
                    ...prevState,
                    user: {
                      id: firebaseUser.uid,
                      email: firebaseUser.email || '',
                      displayName: firebaseUser.displayName || '',
                      photoURL: firebaseUser.photoURL || '',
                      role: 'student', // Varsayılan rol
                      createdAt: new Date(),
                    } as User,
                    loading: false,
                    error: `Kullanıcı profili oluşturulamadı: ${createError.message || 'Bilinmeyen hata'}`,
                    isOffline: false
                  }));
                }
              }
            } catch (error: any) {
              console.error('Error fetching user document:', error);
              console.error('Error code:', error.code);
              console.error('Error message:', error.message);
              
              let errorMessage = 'Kullanıcı verileri çekilemedi.';
              let isOfflineStatus = false;
              
              // Hata türüne göre özel mesajlar
              if (error.code === 'unavailable' || error.message?.includes('offline')) {
                errorMessage += ' Çevrimdışı modda çalışıyor olabilirsiniz.';
                isOfflineStatus = true;
              } else if (error.code === 'permission-denied' || error.code === 'PERMISSION_DENIED') {
                errorMessage += ' Kullanıcı verilerine erişim izniniz bulunmuyor.';
              } else if (error.code === 'not-found') {
                errorMessage += ' Kullanıcı profili bulunamadı.';
              } else if (error.code === 'resource-exhausted') {
                errorMessage += ' Kota sınırına ulaşıldı, daha sonra tekrar deneyin.';
              }
              
              // Firestore erişim hatası - Authentication verilerini kullan
              setState(prevState => ({
                ...prevState,
                user: {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || '',
                  photoURL: firebaseUser.photoURL || '',
                  role: 'student',
                  createdAt: new Date(),
                } as User,
                loading: false,
                error: errorMessage,
                isOffline: isOfflineStatus
              }));
            }
          } else {
            // Kullanıcı giriş yapmamış
            setState(prevState => ({
              ...prevState,
              user: null,
              loading: false,
              error: null,
              isOffline: !navigator.onLine
            }));
          }
        } catch (err: any) {
          console.error('Error processing auth state change:', err);
          
          // Hata mesajını daha net hale getir
          let errorMessage = 'Kimlik doğrulama işlemi sırasında bir hata oluştu';
          if (err.code === 'auth/invalid-credential') {
            errorMessage = 'Geçersiz kimlik bilgileri. Lütfen tekrar giriş yapın.';
          } else if (err.code === 'auth/network-request-failed') {
            errorMessage = 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.';
          } else if (err.code) {
            errorMessage += `: ${err.code}`;
          }
          
          setState(prevState => ({
            ...prevState,
            user: null,
            loading: false,
            error: errorMessage,
            isOffline: !navigator.onLine
          }));
        } finally {
          // İşlem durumunu sıfırla
          isAuthProcessingRef.current = false;
        }
      });
      
      // Temizleme fonksiyonu
      return () => {
        console.log('Cleaning up auth state listener');
        unsubscribe();
      };
    } catch (error: any) {
      console.error('Error setting up auth state listener:', error);
      
      // Hata mesajını daha net hale getir
      let errorMessage = 'Firebase auth başlatılamadı';
      if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Geçersiz Firebase API anahtarı';
      } else if (error.code === 'auth/invalid-project-id') {
        errorMessage = 'Geçersiz Firebase proje kimliği';
      } else if (error.code) {
        errorMessage += `: ${error.code}`;
      }
      
      setState(prevState => ({
        ...prevState,
        user: null,
        loading: false,
        error: errorMessage,
        isOffline: !navigator.onLine
      }));
      
      // Boş temizleme fonksiyonu döndür
      return () => {};
    }
  }, []);

  // Kullanıcı güncelleme fonksiyonu
  const setUser = useCallback((updatedUser: User) => {
    setState(prevState => ({
      ...prevState,
      user: updatedUser
    }));
    
    // Firestore'daki kullanıcı bilgilerini de güncelle
    if (updatedUser.id) {
      const userDocRef = doc(db, 'users', updatedUser.id);
      updateDoc(userDocRef, {
        photoURL: updatedUser.photoURL,
        updatedAt: Timestamp.now()
      }).catch(error => {
        console.error('Error updating user in Firestore:', error);
      });
    }
  }, []);

  // useEffect içerisinde setState çağrılarını güncelleyelim
  useEffect(() => {
    // ... existing code ...

    return () => {
      // Temizleme işlemleri
    };
  }, [setUser]); // setUser'ı dependency olarak ekleyelim

  // setUser fonksiyonunu state içine ekleyelim
  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      setUser
    }));
  }, [setUser]);

  return state;
};

export default useAuth; 