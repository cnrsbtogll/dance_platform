const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Konfigürasyon
const CONFIG = {
  DRY_RUN: true, // Güvenlik için önce true olarak çalıştırın
  BATCH_SIZE: 500, // Firestore batch limit
  COLLECTIONS: {
    INSTRUCTORS: 'instructors',
    SCHOOLS: 'schools',
    COURSES: 'courses'
  }
};

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

async function processInstructors() {
  console.log('\n📚 Eğitmenler işleniyor...');
  const instructorsSnapshot = await db.collection(CONFIG.COLLECTIONS.INSTRUCTORS).get();
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of instructorsSnapshot.docs) {
    try {
      const data = doc.data();
      const updates = {};
      stats.instructors.processed++;

      // Alan kontrolleri ve düzeltmeleri
      if (!data.displayName && (data.name || data.ad)) {
        updates.displayName = data.name || data.ad;
        console.log(`[Eğitmen] ${doc.id}: displayName güncelleniyor -> ${updates.displayName}`);
      }

      if (!data.status) {
        updates.status = 'active';
        console.log(`[Eğitmen] ${doc.id}: status 'active' olarak ayarlanıyor`);
      }

      if (!data.phoneNumber && (data.phone || data.telefon)) {
        updates.phoneNumber = data.phone || data.telefon;
        console.log(`[Eğitmen] ${doc.id}: phoneNumber güncelleniyor -> ${updates.phoneNumber}`);
      }

      if (Object.keys(updates).length > 0) {
        if (!CONFIG.DRY_RUN) {
          batch.update(doc.ref, updates);
          batchCount++;
          stats.instructors.updated++;

          if (batchCount >= CONFIG.BATCH_SIZE) {
            await batch.commit();
            console.log(`[Batch] ${batchCount} eğitmen güncellendi`);
            batchCount = 0;
          }
        } else {
          console.log(`[DRY RUN] ${doc.id} için yapılacak güncellemeler:`, updates);
        }
      }
    } catch (error) {
      console.error(`[Hata] Eğitmen ${doc.id} işlenirken hata:`, error);
      stats.instructors.errors++;
    }
  }

  if (!CONFIG.DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`[Batch] Son ${batchCount} eğitmen güncellendi`);
  }
}

async function processSchools() {
  console.log('\n🏫 Okullar işleniyor...');
  const schoolsSnapshot = await db.collection(CONFIG.COLLECTIONS.SCHOOLS).get();
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of schoolsSnapshot.docs) {
    try {
      const data = doc.data();
      const updates = {};
      stats.schools.processed++;

      // Alan kontrolleri ve düzeltmeleri
      if (!data.displayName && (data.name || data.ad)) {
        updates.displayName = data.name || data.ad;
        console.log(`[Okul] ${doc.id}: displayName güncelleniyor -> ${updates.displayName}`);
      }

      if (!data.status) {
        updates.status = 'active';
        console.log(`[Okul] ${doc.id}: status 'active' olarak ayarlanıyor`);
      }

      if (!data.phoneNumber && (data.phone || data.telefon)) {
        updates.phoneNumber = data.phone || data.telefon;
        console.log(`[Okul] ${doc.id}: phoneNumber güncelleniyor -> ${updates.phoneNumber}`);
      }

      if (!data.address && data.adres) {
        updates.address = data.adres;
        console.log(`[Okul] ${doc.id}: address güncelleniyor`);
      }

      if (Object.keys(updates).length > 0) {
        if (!CONFIG.DRY_RUN) {
          batch.update(doc.ref, updates);
          batchCount++;
          stats.schools.updated++;

          if (batchCount >= CONFIG.BATCH_SIZE) {
            await batch.commit();
            console.log(`[Batch] ${batchCount} okul güncellendi`);
            batchCount = 0;
          }
        } else {
          console.log(`[DRY RUN] ${doc.id} için yapılacak güncellemeler:`, updates);
        }
      }
    } catch (error) {
      console.error(`[Hata] Okul ${doc.id} işlenirken hata:`, error);
      stats.schools.errors++;
    }
  }

  if (!CONFIG.DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`[Batch] Son ${batchCount} okul güncellendi`);
  }
}

async function processCourses() {
  console.log('\n📝 Kurslar işleniyor...');
  const coursesSnapshot = await db.collection(CONFIG.COLLECTIONS.COURSES).get();
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of coursesSnapshot.docs) {
    try {
      const data = doc.data();
      const updates = {};
      stats.courses.processed++;

      // Eğitmen bilgilerini güncelle
      if (data.instructorId) {
        const instructorDoc = await db.collection(CONFIG.COLLECTIONS.INSTRUCTORS).doc(data.instructorId).get();
        if (instructorDoc.exists) {
          const instructorData = instructorDoc.data();
          updates.instructorName = instructorData.displayName || instructorData.name || instructorData.ad;
          updates.instructorPhone = instructorData.phoneNumber || instructorData.phone || instructorData.telefon;
          console.log(`[Kurs] ${doc.id}: Eğitmen bilgileri güncelleniyor`);
        }
      }

      // Okul bilgilerini güncelle
      if (data.schoolId) {
        const schoolDoc = await db.collection(CONFIG.COLLECTIONS.SCHOOLS).doc(data.schoolId).get();
        if (schoolDoc.exists) {
          const schoolData = schoolDoc.data();
          updates.schoolName = schoolData.displayName || schoolData.name || schoolData.ad;
          updates.schoolPhone = schoolData.phoneNumber || schoolData.phone || schoolData.telefon;
          updates.schoolAddress = schoolData.address || schoolData.adres;
          console.log(`[Kurs] ${doc.id}: Okul bilgileri güncelleniyor`);
        }
      }

      if (Object.keys(updates).length > 0) {
        if (!CONFIG.DRY_RUN) {
          batch.update(doc.ref, updates);
          batchCount++;
          stats.courses.updated++;

          if (batchCount >= CONFIG.BATCH_SIZE) {
            await batch.commit();
            console.log(`[Batch] ${batchCount} kurs güncellendi`);
            batchCount = 0;
          }
        } else {
          console.log(`[DRY RUN] ${doc.id} için yapılacak güncellemeler:`, updates);
        }
      }
    } catch (error) {
      console.error(`[Hata] Kurs ${doc.id} işlenirken hata:`, error);
      stats.courses.errors++;
    }
  }

  if (!CONFIG.DRY_RUN && batchCount > 0) {
    await batch.commit();
    console.log(`[Batch] Son ${batchCount} kurs güncellendi`);
  }
}

async function migrateData() {
  console.log(`
🚀 Veri düzenleme işlemi başlıyor...
${CONFIG.DRY_RUN ? '⚠️ DRY RUN MODU AÇIK - Gerçek değişiklik yapılmayacak' : '⚠️ GERÇEK GÜNCELLEME MODU - Değişiklikler kaydedilecek'}
`);

  try {
    await processInstructors();
    await processSchools();
    await processCourses();

    console.log('\n📊 İşlem İstatistikleri:');
    console.log('Eğitmenler:', stats.instructors);
    console.log('Okullar:', stats.schools);
    console.log('Kurslar:', stats.courses);

  } catch (error) {
    console.error('❌ Kritik hata:', error);
  } finally {
    process.exit();
  }
}

// Script'i çalıştır
migrateData(); 