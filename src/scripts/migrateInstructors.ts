import { db } from '../api/firebase/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch,
  deleteField,
  serverTimestamp 
} from 'firebase/firestore';

const migrateInstructors = async () => {
  try {
    const batch = writeBatch(db);
    const instructorsRef = collection(db, 'instructors');
    const snapshot = await getDocs(instructorsRef);
    
    console.log(`Found ${snapshot.size} instructors to migrate...`);
    let migratedCount = 0;

    for (const instructorDoc of snapshot.docs) {
      const data = instructorDoc.data();
      const updates: Record<string, any> = {};

      // Alan adlarını İngilizce'ye çevir
      if ('ad' in data) {
        updates.displayName = data.ad;
        updates['ad'] = deleteField();
      }

      if ('biyografi' in data) {
        updates.bio = data.biyografi;
        updates['biyografi'] = deleteField();
      }

      if ('gorsel' in data) {
        updates.photoURL = data.gorsel;
        updates['gorsel'] = deleteField();
      }

      if ('tecrube' in data) {
        updates.experience = data.tecrube;
        updates['tecrube'] = deleteField();
      }

      if ('okul_id' in data) {
        updates.schoolId = data.okul_id;
        updates['okul_id'] = deleteField();
      }

      // uzmanlık alanını array'e çevir
      if ('uzmanlık' in data) {
        // Virgülle ayrılmış string ise array'e çevir
        const specialties = data.uzmanlık.includes(',') 
          ? data.uzmanlık.split(',').map((s: string) => s.trim())
          : [data.uzmanlık];
          
        updates.specialties = specialties;
        updates['uzmanlık'] = deleteField();
      }

      // Eğer hiç specialty yoksa boş array ata
      if (!data.specialties && !data.uzmanlık) {
        updates.specialties = [];
      }

      // Timestamp'leri kontrol et
      if (!data.createdAt) {
        updates.createdAt = serverTimestamp();
      }
      if (!data.updatedAt) {
        updates.updatedAt = serverTimestamp();
      }

      // Status kontrolü
      if (!data.status) {
        updates.status = 'active';
      }

      // Eğer güncellenecek alan varsa batch'e ekle
      if (Object.keys(updates).length > 0) {
        const docRef = doc(instructorsRef, instructorDoc.id);
        batch.update(docRef, updates);
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      await batch.commit();
      console.log(`Successfully migrated ${migratedCount} instructors`);
    } else {
      console.log('No migrations needed');
    }

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Migration'ı çalıştırmak için bir komut dosyası
const runMigration = async () => {
  console.log('Starting instructor data migration...');
  try {
    await migrateInstructors();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Script doğrudan çalıştırıldığında migration'ı başlat
runMigration(); 