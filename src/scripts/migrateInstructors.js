import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch,
  deleteField,
  serverTimestamp 
} from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const migrateInstructors = async () => {
  try {
    const instructorsRef = collection(db, 'instructors');
    const snapshot = await getDocs(instructorsRef);
    
    console.log(`Found ${snapshot.size} instructors to migrate...`);
    
    // Mevcut verileri logla
    snapshot.docs.forEach(doc => {
      console.log('Current instructor data:', {
        id: doc.id,
        data: doc.data()
      });
    });
    
    let migratedCount = 0;

    // Her bir eğitmen için ayrı işlem yapalım
    for (const instructorDoc of snapshot.docs) {
      try {
        const data = instructorDoc.data();
        const updates = {};
        let hasUpdates = false;

        // Alan adlarını İngilizce'ye çevir
        if ('ad' in data) {
          updates.displayName = data.ad;
          updates['ad'] = deleteField();
          hasUpdates = true;
        }

        if ('biyografi' in data) {
          updates.bio = data.biyografi;
          updates['biyografi'] = deleteField();
          hasUpdates = true;
        }

        if ('gorsel' in data) {
          updates.photoURL = data.gorsel;
          updates['gorsel'] = deleteField();
          hasUpdates = true;
        }

        if ('tecrube' in data) {
          updates.experience = data.tecrube;
          updates['tecrube'] = deleteField();
          hasUpdates = true;
        }

        if ('okul_id' in data) {
          updates.schoolId = data.okul_id;
          updates['okul_id'] = deleteField();
          hasUpdates = true;
        }

        // uzmanlık alanını array'e çevir
        if ('uzmanlık' in data) {
          // Virgülle ayrılmış string ise array'e çevir
          const specialties = data.uzmanlık.includes(',') 
            ? data.uzmanlık.split(',').map(s => s.trim())
            : [data.uzmanlık];
            
          updates.specialties = specialties;
          updates['uzmanlık'] = deleteField();
          hasUpdates = true;
        }

        // Eğer hiç specialty yoksa boş array ata
        if (!data.specialties && !data.uzmanlık) {
          updates.specialties = [];
          hasUpdates = true;
        }

        // Timestamp'leri kontrol et
        if (!data.createdAt) {
          updates.createdAt = serverTimestamp();
          hasUpdates = true;
        }
        if (!data.updatedAt) {
          updates.updatedAt = serverTimestamp();
          hasUpdates = true;
        }

        // Status kontrolü
        if (!data.status) {
          updates.status = 'active';
          hasUpdates = true;
        }

        // Eğer güncellenecek alan varsa, doğrudan güncelle
        if (hasUpdates) {
          console.log(`Updating instructor ${instructorDoc.id}...`);
          console.log('Updates:', JSON.stringify(updates, null, 2));
          
          await updateDoc(doc(instructorsRef, instructorDoc.id), updates);
          migratedCount++;
          
          console.log(`Successfully updated instructor ${instructorDoc.id}`);
        } else {
          console.log(`No updates needed for instructor ${instructorDoc.id}`);
        }
      } catch (error) {
        console.error(`Error updating instructor ${instructorDoc.id}:`, error);
        // Bir eğitmenin güncellenmesi başarısız olsa bile diğerlerine devam et
        continue;
      }
    }

    console.log(`Successfully migrated ${migratedCount} instructors`);

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

// Migration'ı çalıştırmak için bir komut dosyası
const runMigration = async () => {
  console.log('Starting instructor data migration...');
  try {
    await migrateInstructors();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Script'i çalıştır
runMigration(); 