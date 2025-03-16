// src/config/firebase.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  enableIndexedDbPersistence, 
  connectFirestoreEmulator, 
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

console.log('🔍 Firebase modülleri import edildi');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3mNduattg3QdSTllXYhKvHLyq6z0sftQ",
  authDomain: "danceplatform-7924a.firebaseapp.com",
  projectId: "danceplatform-7924a",
  storageBucket: "danceplatform-7924a.appspot.com",
  messagingSenderId: "326218239384",
  appId: "1:326218239384:web:b9b5ec59d55fe57f2eafed",
  measurementId: "G-N608ZBSD7X"
};

console.log('🔍 Firebase yapılandırması yüklendi:', { 
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket
});

// Firebase yapılandırmasını doğrula
const validateFirebaseConfig = () => {
  console.log('🔍 Firebase yapılandırması doğrulanıyor...');
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('❌ Firebase yapılandırması eksik alanlar:', missingFields);
    throw new Error(`Firebase yapılandırması eksik: ${missingFields.join(', ')}`);
  }
  
  // Storage bucket formatını kontrol et
  if (!firebaseConfig.storageBucket.includes('.appspot.com')) {
    console.warn('⚠️ Storage bucket formatı hatalı olabilir:', firebaseConfig.storageBucket);
  }
  
  // API anahtarı formatını kontrol et
  if (!/^AIza[a-zA-Z0-9_-]{35}$/.test(firebaseConfig.apiKey)) {
    console.warn('⚠️ API anahtarı formatı hatalı olabilir');
  }
  
  console.log('✅ Firebase yapılandırması doğrulandı');
  return true;
};

console.log('🔍 Firebase başlatılıyor...');

// Initialize Firebase and services
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  // Yapılandırmayı doğrula
  validateFirebaseConfig();
  
  // Firebase'i başlat
  console.log('🔍 initializeApp çağrılıyor...');
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app başlatıldı:', app.name);
  
  console.log('🔍 getAuth çağrılıyor...');
  auth = getAuth(app);
  console.log('✅ Firebase auth başlatıldı');
  
  // Firestore başlatma - daha modern yapılandırma ile
  console.log('🔍 initializeFirestore çağrılıyor... (modern yapılandırma)');
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      })
    });
    console.log('✅ Firestore başlatıldı (modern yapılandırma ile)');
  } catch (firestoreInitError: any) {
    console.warn('⚠️ Modern Firestore yapılandırması başarısız, alternatif yöntem deneniyor:', firestoreInitError);
    console.log('🔍 getFirestore çağrılıyor... (alternatif yöntem)');
    db = getFirestore(app);
    console.log('✅ Firestore başlatıldı (alternatif yöntem)');
  }
  
  console.log('🔍 getStorage çağrılıyor...');
  storage = getStorage(app);
  console.log('✅ Firebase Storage başlatıldı');

  // Geliştirme ortamını tespit et ve emülatörleri ayarla
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isDevMode = process.env.NODE_ENV === 'development';
  
  console.log('🔍 Geliştirme ortamı:', { isDevMode, isLocalhost });
  
  if (isDevMode && isLocalhost && false) { // Emülatör kullanmak için false -> true yapın
    console.log('🔍 Firebase emülatörleri kullanılıyor');
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  }

  // FirebaseRdy olayını oluştur
  console.log('🔍 Firebase başlatma süreci tamamlandı, firebaseReady event gönderiliyor');
  
  // Bir süre bekleyerek diğer işlemlerin tamamlanmasına izin ver
  setTimeout(() => {
    document.dispatchEvent(new CustomEvent('firebaseReady', { detail: { success: true }}));
    console.log('✅ firebaseReady event başarıyla gönderildi');
  }, 100);
  
} catch (error: any) {
  console.error('❌ Firebase başlatma hatası:', error);
  // Tüm hataları konsola yazdır - debugging için faydalı
  console.error('❌ Hata detayları:', error);
  console.error('❌ Hata kodu:', error.code);
  console.error('❌ Hata mesajı:', error.message);
  console.error('❌ Hata stack:', error.stack);
  
  // Daha yararlı hata mesajları
  let errorMessage = 'Firebase başlatılamadı';
  if (error.code === 'app/duplicate-app') {
    errorMessage = 'Firebase uygulaması zaten başlatılmış';
  } else if (error.code === 'app/invalid-app-name') {
    errorMessage = 'Geçersiz Firebase uygulama adı';
  } else if (error.code === 'auth/configuration-not-found') {
    errorMessage = 'Firebase yapılandırması bulunamadı';
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  console.error('❌ Firebase başlatma hatası açıklaması:', errorMessage);
  
  // Hata olayını tetikle - timeout ile
  setTimeout(() => {
    document.dispatchEvent(new CustomEvent('firebaseReady', { 
      detail: { success: false, error: errorMessage }
    }));
    console.log('⚠️ firebaseReady error event gönderildi');
  }, 100);
  
  // Default boş nesneler (tip kontrolünü geçirmek için)
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
  
  console.warn('⚠️ Firebase servisleri boş nesneler olarak ayarlandı (fallback)');
}

console.log('🔍 Firebase servisleri export ediliyor');
// Export the initialized services
export { auth, db, storage };
export default app;