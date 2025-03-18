// seedDanceCourses.js - Firebase'e örnek dans kursları ekleyen script
import { db } from '../api/firebase/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc,
  serverTimestamp,
  query,
  limit
} from 'firebase/firestore';

// Koleksiyon adları
const COURSES_COLLECTION = 'courses';
const INSTRUCTORS_COLLECTION = 'instructors';
const SCHOOLS_COLLECTION = 'schools';

// Kurs seviyeleri
const LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'];

// Dans stilleri
const DANCE_STYLES = ['salsa', 'bachata', 'kizomba', 'tango', 'vals'];

// Kurs süreleri (dakika)
const DURATIONS = [45, 60, 75, 90, 120];

// Kurs fiyatları
const PRICES = [150, 200, 250, 300, 350, 400, 450, 500];

// Kurs isimleri için kalıplar
const COURSE_NAME_TEMPLATES = [
  "{dance} Dersi - {level} Seviye",
  "{dance} {level}",
  "{level} {dance}",
  "{dance} Dans Kursu - {level}",
  "{dance} Özel Ders - {level} Seviye",
  "Profesyonel {dance}",
  "{dance} Teknik & Stil",
  "{dance} Figürleri",
  "Sosyal {dance} Atölyesi",
  "{level} Seviye {dance} Kursu"
];

// Örnek açıklamalar
const COURSE_DESCRIPTIONS = [
  "Bu {dance} kursumuzda, temel adımlar ve duruş tekniklerinden başlayarak, müziğe uyum, akıcı hareketler ve partner ile dans etme tekniklerini öğreneceksiniz. {level} seviyeye uygun yapılandırılmış eğitim programımız, dans deneyiminizi zenginleştirecek.",
  "{level} seviye {dance} kursumuz, dans becerilerinizi bir üst seviyeye taşımak için tasarlandı. Eğitmenlerimizle birlikte, {dance} dansının ritmik yapısını keşfedecek, doğru teknikler ve figürlerle dans etmeyi öğreneceksiniz.",
  "{dance} dansına giriş yapacağınız bu kursta, dansın temel prensiplerini, müzik ile uyumu ve dans etiğini öğreneceksiniz. {level} seviyeye uygun içeriğimizle, kısa sürede dans pistinde kendinizi göstermeye başlayabilirsiniz.",
  "Profesyonel eğitmenlerimizle {dance} dansının inceliklerini keşfedeceğiniz bu kursta, {level} seviyeye uygun koreografiler, teknikler ve stil çalışmaları yapacaksınız. Kurs sonunda, sosyal dans ortamlarında kendinize güvenle dans edebileceksiniz.",
  "Bu {dance} kursunda, {level} seviyeye uygun figür ve kombinasyonları öğrenecek, müziğe uyum becerilerinizi geliştireceksiniz. Deneyimli eğitmenlerimiz, her adımda yanınızda olacak ve dans yolculuğunuza rehberlik edecek."
];

// Tarih oluşturan yardımcı fonksiyon
const getRandomFutureDate = () => {
  const now = new Date();
  // Bugünden itibaren 1-60 gün sonrası
  const randomDays = Math.floor(Math.random() * 60) + 1;
  const futureDate = new Date(now.getTime() + (randomDays * 24 * 60 * 60 * 1000));
  return futureDate;
};

// Türkçe seviye isimlerini alma
const getTurkishLevelName = (level) => {
  const levelMap = {
    'beginner': 'Başlangıç',
    'intermediate': 'Orta',
    'advanced': 'İleri',
    'professional': 'Profesyonel'
  };
  return levelMap[level] || level;
};

// Türkçe dans stili isimlerini alma
const getTurkishDanceStyleName = (style) => {
  // Dans stillerinin Türkçe isimleri genelde aynı, bazıları için özel durum
  const styleMap = {
    'salsa': 'Salsa',
    'bachata': 'Bachata',
    'kizomba': 'Kizomba',
    'tango': 'Tango',
    'vals': 'Vals'
  };
  return styleMap[style] || style;
};

// Örnek kurs adı oluşturma
const generateCourseName = (danceStyle, level) => {
  const template = COURSE_NAME_TEMPLATES[Math.floor(Math.random() * COURSE_NAME_TEMPLATES.length)];
  const turkishLevel = getTurkishLevelName(level);
  const turkishDance = getTurkishDanceStyleName(danceStyle);
  
  return template
    .replace('{dance}', turkishDance)
    .replace('{level}', turkishLevel);
};

// Örnek kurs açıklaması oluşturma
const generateCourseDescription = (danceStyle, level) => {
  const description = COURSE_DESCRIPTIONS[Math.floor(Math.random() * COURSE_DESCRIPTIONS.length)];
  const turkishLevel = getTurkishLevelName(level);
  const turkishDance = getTurkishDanceStyleName(danceStyle);
  
  return description
    .replace(/{dance}/g, turkishDance)
    .replace(/{level}/g, turkishLevel);
};

// Rastgele haftanın günlerini seçme
const getRandomDaysOfWeek = () => {
  const daysOfWeek = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const numberOfDays = Math.floor(Math.random() * 3) + 1; // 1-3 gün
  const selectedDays = [];
  
  while (selectedDays.length < numberOfDays) {
    const randomDay = daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)];
    if (!selectedDays.includes(randomDay)) {
      selectedDays.push(randomDay);
    }
  }
  
  return selectedDays;
};

// Rastgele saat oluşturma (16:00 - 21:00 arası)
const getRandomTime = () => {
  const hour = Math.floor(Math.random() * 6) + 16; // 16-21 arası
  const minute = [0, 30][Math.floor(Math.random() * 2)]; // 00 veya 30
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Rastgele görsel URL'si oluşturma
const getRandomImageUrl = (danceStyle) => {
  // Örnek: dans stiline göre özel görseller
  return `/assets/images/dance/class${Math.floor(Math.random() * 4) + 1}.jpg`;
};

// Ana seed fonksiyonu
async function seedDanceCourses(count = 20) {
  try {
    console.log(`🌱 "${COURSES_COLLECTION}" koleksiyonuna ${count} adet örnek dans kursu ekleniyor...`);
    
    // Önce mevcut eğitmenleri ve okulları çekelim
    const instructorsQuery = query(collection(db, INSTRUCTORS_COLLECTION), limit(10));
    const instructorsSnapshot = await getDocs(instructorsQuery);
    
    const schoolsQuery = query(collection(db, SCHOOLS_COLLECTION), limit(10));
    const schoolsSnapshot = await getDocs(schoolsQuery);
    
    // Eğitmen ve okul dizileri oluştur
    const instructors = [];
    const schools = [];
    
    instructorsSnapshot.forEach(doc => {
      instructors.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    schoolsSnapshot.forEach(doc => {
      schools.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Eğitmen veya okul yoksa uyarı ver
    if (instructors.length === 0 || schools.length === 0) {
      console.warn(`⚠️ Yeterli eğitmen (${instructors.length}) veya okul (${schools.length}) bulunamadı.`);
      if (instructors.length === 0 && schools.length === 0) {
        console.error('❌ Hem eğitmen hem de okul bulunamadığından kurslar oluşturulamıyor!');
        return { success: false, message: 'Örnek kurslar oluşturulamadı. Önce eğitmen ve okul eklemelisiniz.' };
      }
    }
    
    // Eklenen kursları saymak için değişken
    let coursesAdded = 0;
    
    // Belirtilen sayıda kurs oluştur
    for (let i = 0; i < count; i++) {
      // Dans stili seç (ağırlıklı olarak salsa, bachata ve kizomba)
      let danceStyleIndex;
      const styleRandom = Math.random();
      if (styleRandom < 0.3) {
        danceStyleIndex = 0; // salsa
      } else if (styleRandom < 0.6) {
        danceStyleIndex = 1; // bachata
      } else if (styleRandom < 0.8) {
        danceStyleIndex = 2; // kizomba
      } else if (styleRandom < 0.9) {
        danceStyleIndex = 3; // tango
      } else {
        danceStyleIndex = 4; // vals
      }
      const danceStyle = DANCE_STYLES[danceStyleIndex];
      
      // Diğer rastgele özellikler
      const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
      const duration = DURATIONS[Math.floor(Math.random() * DURATIONS.length)];
      const price = PRICES[Math.floor(Math.random() * PRICES.length)];
      
      // Rastgele eğitmen ve okul seç (eğer varsa)
      const randomInstructor = instructors.length > 0 ? 
        instructors[Math.floor(Math.random() * instructors.length)] : null;
      
      const randomSchool = schools.length > 0 ? 
        schools[Math.floor(Math.random() * schools.length)] : null;
      
      // Kurs adı ve açıklaması
      const name = generateCourseName(danceStyle, level);
      const description = generateCourseDescription(danceStyle, level);
      
      // Kurs verisi
      const courseData = {
        name,
        description,
        danceStyle,
        level,
        duration,
        price,
        currency: 'TRY',
        maxParticipants: Math.floor(Math.random() * 16) + 5, // 5-20 kişi
        currentParticipants: Math.floor(Math.random() * 5), // 0-4 kişi (başlangıç için)
        recurring: Math.random() > 0.3, // %70 ihtimalle haftalık tekrarlanan kurs
        daysOfWeek: getRandomDaysOfWeek(),
        time: getRandomTime(),
        date: getRandomFutureDate(),
        imageUrl: getRandomImageUrl(danceStyle),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tags: [danceStyle, level, `${duration} dakika`],
        highlights: [
          `${duration} dakika süren dersler`,
          `${getTurkishLevelName(level)} seviyeye uygun`,
          'Deneyimli eğitmenler eşliğinde'
        ]
      };
      
      // Eğitmen bilgilerini ekle (varsa)
      if (randomInstructor) {
        courseData.instructorId = randomInstructor.id;
        courseData.instructorName = randomInstructor.user?.displayName || 'Bilinmeyen Eğitmen';
      }
      
      // Okul bilgilerini ekle (varsa)
      if (randomSchool) {
        courseData.schoolId = randomSchool.id;
        courseData.schoolName = randomSchool.name || 'Bilinmeyen Okul';
        
        // Okul lokasyonu ekle
        courseData.location = {
          address: randomSchool.address?.street || '',
          city: randomSchool.address?.city || randomSchool.konum || 'İstanbul',
          state: '',
          zipCode: randomSchool.address?.zipCode || '',
          latitude: randomSchool.address?.latitude || 41.0082,
          longitude: randomSchool.address?.longitude || 28.9784
        };
      } else {
        // Varsayılan lokasyon (İstanbul)
        courseData.location = {
          address: 'Örnek Adres',
          city: 'İstanbul',
          state: '',
          zipCode: '',
          latitude: 41.0082,
          longitude: 28.9784
        };
      }
      
      // Kursu Firebase'e ekle
      await addDoc(collection(db, COURSES_COLLECTION), courseData);
      coursesAdded++;
    }
    
    console.log(`✅ Toplam ${coursesAdded} adet örnek dans kursu başarıyla eklendi.`);
    return { success: true, message: `Toplam ${coursesAdded} adet örnek dans kursu başarıyla eklendi.` };
    
  } catch (error) {
    console.error('❌ Örnek dans kursları eklenirken hata oluştu:', error);
    return { success: false, message: `Hata: ${error.message || 'Bilinmeyen hata'}` };
  }
}

export default seedDanceCourses; 