// migrateSchools.js - dansOkullari koleksiyonundan verileri schools koleksiyonuna taşıyan script
import { db } from '../api/firebase/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  query
} from 'firebase/firestore';

// Koleksiyon adları
const SOURCE_COLLECTION = 'dansOkullari';
const TARGET_COLLECTION = 'schools';

// Ana migrasyon fonksiyonu
async function migrateSchools() {
  try {
    console.log(`📦 "${SOURCE_COLLECTION}" koleksiyonundan "${TARGET_COLLECTION}" koleksiyonuna veri taşıma başlatılıyor...`);
    
    // Source koleksiyondan tüm belgeleri çek
    const sourceQuery = query(collection(db, SOURCE_COLLECTION));
    const sourceSnapshot = await getDocs(sourceQuery);
    
    // Belge sayısını kontrol et
    if (sourceSnapshot.empty) {
      console.log(`⚠️ "${SOURCE_COLLECTION}" koleksiyonunda belge bulunamadı.`);
      return;
    }
    
    console.log(`✅ "${SOURCE_COLLECTION}" koleksiyonunda ${sourceSnapshot.size} belge bulundu.`);
    
    // Firestore batch kullanarak toplu işlem yap (500 belge sınırı var)
    let batch = writeBatch(db);
    let documentsProcessed = 0;
    let batchCount = 1;
    
    for (const sourceDoc of sourceSnapshot.docs) {
      const sourceData = sourceDoc.data();
      const docId = sourceDoc.id;
      
      // Hedef koleksiyonda aynı ID ile belge oluştur
      const targetDocRef = doc(db, TARGET_COLLECTION, docId);
      batch.set(targetDocRef, sourceData);
      
      documentsProcessed++;
      
      // Her 500 belgede bir batch işlemini tamamla (Firestore sınırı)
      if (documentsProcessed % 500 === 0) {
        console.log(`🔄 Batch ${batchCount} işlemi tamamlanıyor (${documentsProcessed} belge)...`);
        await batch.commit();
        batch = writeBatch(db);
        batchCount++;
      }
    }
    
    // Kalan belgeleri işle
    if (documentsProcessed % 500 !== 0) {
      console.log(`🔄 Son batch işlemi tamamlanıyor (toplam ${documentsProcessed} belge)...`);
      await batch.commit();
    }
    
    console.log(`✅ Migrasyon tamamlandı. Toplam ${documentsProcessed} belge "${TARGET_COLLECTION}" koleksiyonuna taşındı.`);
    
  } catch (error) {
    console.error('❌ Migrasyon sırasında hata oluştu:', error);
  }
}

// Migrasyon fonksiyonunu çalıştır
migrateSchools()
  .then(() => console.log('✨ İşlem tamamlandı'))
  .catch(err => console.error('❌ Beklenmeyen hata:', err));

export default migrateSchools; 