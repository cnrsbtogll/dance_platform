import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./service-account-key.json');

// Konfigürasyon
const CONFIG = {
  DRY_RUN: false, // Gerçek değişiklikleri uygula
  BATCH_SIZE: 500, // Firestore batch limit
  COLLECTIONS: {
    INSTRUCTORS: 'instructors',
    SCHOOLS: 'schools',
    COURSES: 'courses'
  }
};

// Firebase'i başlat
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Değişiklikleri takip etmek için sayaçlar
const stats = {
  instructors: { processed: 0, updated: 0, errors: 0 },
  schools: { processed: 0, updated: 0, errors: 0 },
  courses: { processed: 0, updated: 0, errors: 0 }
};

async function processInstructors(db) {
  console.log('\n📚 Eğitmenler işleniyor...');
  const stats = { processed: 0, updated: 0, errors: 0 };
  const instructorsRef = db.collection('instructors');
  const instructorsSnapshot = await instructorsRef.get();
  
  for (const doc of instructorsSnapshot.docs) {
    try {
      stats.processed++;
      const data = doc.data();
      const updates = {};
      
      // displayName alanını güncelle
      if (!data.displayName && (data.name || data.ad)) {
        updates.displayName = data.name || data.ad;
        console.log(`[Eğitmen] ${doc.id}: displayName güncelleniyor -> ${updates.displayName}`);
      }
      
      // status alanını güncelle
      if (!data.status) {
        updates.status = 'active';
        console.log(`[Eğitmen] ${doc.id}: status 'active' olarak ayarlanıyor`);
      }
      
      if (Object.keys(updates).length > 0) {
        if (!CONFIG.DRY_RUN) {
          await doc.ref.update(updates);
        }
        stats.updated++;
      }
    } catch (error) {
      console.log(`[Hata] Eğitmen ${doc.id} işlenirken hata:`, error);
      stats.errors++;
    }
  }
  
  return stats;
}

async function processSchools(db) {
  console.log('\n🏫 Okullar işleniyor...');
  const stats = { processed: 0, updated: 0, errors: 0 };
  const schoolsRef = db.collection('schools');
  const schoolsSnapshot = await schoolsRef.get();
  
  for (const doc of schoolsSnapshot.docs) {
    try {
      stats.processed++;
      const data = doc.data();
      const updates = {};
      
      // displayName alanını güncelle
      if (!data.displayName && (data.name || data.ad)) {
        updates.displayName = data.name || data.ad;
        console.log(`[Okul] ${doc.id}: displayName güncelleniyor -> ${updates.displayName}`);
      }
      
      // phoneNumber alanını güncelle
      if (!data.phoneNumber && (data.phone || data.telefon)) {
        updates.phoneNumber = data.phone || data.telefon;
        console.log(`[Okul] ${doc.id}: phoneNumber güncelleniyor -> ${updates.phoneNumber}`);
      }
      
      if (Object.keys(updates).length > 0) {
        if (!CONFIG.DRY_RUN) {
          await doc.ref.update(updates);
        }
        stats.updated++;
      }
    } catch (error) {
      console.log(`[Hata] Okul ${doc.id} işlenirken hata:`, error);
      stats.errors++;
    }
  }
  
  return stats;
}

async function processCourses(db) {
  console.log('\n📝 Kurslar işleniyor...');
  const stats = { processed: 0, updated: 0, errors: 0 };
  const coursesRef = db.collection('courses');
  const coursesSnapshot = await coursesRef.get();
  
  for (const courseDoc of coursesSnapshot.docs) {
    stats.processed++;
    const courseData = courseDoc.data();
    
    try {
      const updateData = {};
      
      // Eğitmen bilgilerini güncelle
      if (courseData.instructorId) {
        console.log(`[Kurs] ${courseDoc.id}: Eğitmen bilgileri güncelleniyor`);
        const instructorDoc = await db.collection('instructors').doc(courseData.instructorId).get();
        if (instructorDoc.exists) {
          const instructorData = instructorDoc.data();
          if (instructorData.displayName) {
            updateData.instructorName = instructorData.displayName;
          }
          if (instructorData.phoneNumber) {
            updateData.instructorPhone = instructorData.phoneNumber;
          }
        }
      }
      
      // Okul bilgilerini güncelle
      if (courseData.schoolId) {
        console.log(`[Kurs] ${courseDoc.id}: Okul bilgileri güncelleniyor`);
        const schoolDoc = await db.collection('schools').doc(courseData.schoolId).get();
        if (schoolDoc.exists) {
          const schoolData = schoolDoc.data();
          if (schoolData.displayName) {
            updateData.schoolName = schoolData.displayName;
          }
          if (schoolData.phoneNumber) {
            updateData.schoolPhone = schoolData.phoneNumber;
          }
          if (schoolData.address) {
            updateData.schoolAddress = schoolData.address;
          }
        }
      }
      
      // Sadece değişiklik varsa güncelle
      if (Object.keys(updateData).length > 0) {
        if (!CONFIG.DRY_RUN) {
          await courseDoc.ref.update(updateData);
        }
        stats.updated++;
      }
    } catch (error) {
      console.log(`[Hata] Kurs ${courseDoc.id} işlenirken hata:`, error);
      stats.errors++;
    }
  }
  
  return stats;
}

async function migrateData() {
  console.log('\n🚀 Veri düzenleme işlemi başlıyor...');
  if (CONFIG.DRY_RUN) {
    console.log('⚠️ KURU ÇALIŞMA MODU - Değişiklikler kaydedilmeyecek\n');
  } else {
    console.log('⚠️ GERÇEK GÜNCELLEME MODU - Değişiklikler kaydedilecek\n');
  }
  
  const instructorStats = await processInstructors(db);
  const schoolStats = await processSchools(db);
  const courseStats = await processCourses(db);
  
  console.log('\n📊 İşlem İstatistikleri:');
  console.log('Eğitmenler:', instructorStats);
  console.log('Okullar:', schoolStats);
  console.log('Kurslar:', courseStats);
}

// Script'i çalıştır
migrateData(); 
migrateData(); 