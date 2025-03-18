import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Türler
export interface Achievement {
  id: string;
  name: string;
  description: string;
  danceStyle: string;
  level?: string;
  iconUrl: string;
  requiredClasses?: number;
  points: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Progress {
  userId: string;
  courseId: string;
  completedLessons: number;
  totalLessons: number;
  lastAttendance: Date;
  startDate: Date;
  achievements: string[];
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Attendance {
  userId: string;
  courseId: string;
  date: Date;
  status: 'attended' | 'late' | 'missed';
  notes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface UserProgressSummary {
  completedCourses: number;
  completedLessons: number;
  totalDanceHours: number;
  earnedAchievements: Achievement[];
  progressPercentage: number;
  level: number;
  points: number;
  nextLevelPoints: number;
  courseProgress: {
    courseId: string;
    courseName: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
  }[];
  recentAttendance: {
    courseId: string;
    courseName: string;
    date: Date;
    status: 'attended' | 'late' | 'missed';
  }[];
}

// Başarı rozetlerini getir
export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const achievementsQuery = query(
      collection(db, 'achievements'),
      orderBy('points', 'asc')
    );
    
    const achievementsSnapshot = await getDocs(achievementsQuery);
    const achievements: Achievement[] = [];
    
    achievementsSnapshot.forEach((doc) => {
      const data = doc.data();
      achievements.push({
        id: doc.id,
        ...data
      } as Achievement);
    });
    
    return achievements;
  } catch (error) {
    console.error('Başarı rozetleri getirilirken hata:', error);
    throw error;
  }
};

// Kullanıcının kazandığı rozetleri getir
export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  try {
    // Kullanıcının tüm ilerleme kayıtlarını getir
    const progressQuery = query(
      collection(db, 'progress'),
      where('userId', '==', userId)
    );
    
    const progressSnapshot = await getDocs(progressQuery);
    
    // Tüm kazanılmış rozet ID'lerini topla
    const earnedAchievementIds = new Set<string>();
    
    progressSnapshot.forEach((doc) => {
      const data = doc.data() as Progress;
      if (data.achievements && data.achievements.length > 0) {
        data.achievements.forEach(achievementId => {
          earnedAchievementIds.add(achievementId);
        });
      }
    });
    
    // Rozet ID'leri yoksa boş dizi döndür
    if (earnedAchievementIds.size === 0) {
      return [];
    }
    
    // Kazanılan rozetlerin detaylarını getir
    const achievements: Achievement[] = [];
    
    for (const achievementId of earnedAchievementIds) {
      const achievementDoc = await getDoc(doc(db, 'achievements', achievementId));
      
      if (achievementDoc.exists()) {
        const data = achievementDoc.data();
        achievements.push({
          id: achievementDoc.id,
          ...data
        } as Achievement);
      }
    }
    
    return achievements;
  } catch (error) {
    console.error('Kullanıcı rozetleri getirilirken hata:', error);
    throw error;
  }
};

// Kullanıcının tüm ilerleme kayıtlarını getir
export const getUserProgress = async (userId: string): Promise<Progress[]> => {
  try {
    const progressQuery = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      orderBy('startDate', 'desc')
    );
    
    const progressSnapshot = await getDocs(progressQuery);
    const progressData: Progress[] = [];
    
    progressSnapshot.forEach((doc) => {
      const data = doc.data();
      // Firestore Timestamp'ı JavaScript Date'e dönüştür
      progressData.push({
        ...data,
        lastAttendance: data.lastAttendance?.toDate() || new Date(),
        startDate: data.startDate?.toDate() || new Date()
      } as Progress);
    });
    
    return progressData;
  } catch (error) {
    console.error('Kullanıcı ilerleme kayıtları getirilirken hata:', error);
    throw error;
  }
};

// Kullanıcının devam durumunu getir
export const getUserAttendance = async (userId: string, limit = 10): Promise<Attendance[]> => {
  try {
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      firestoreLimit(limit)
    );
    
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const attendanceData: Attendance[] = [];
    
    attendanceSnapshot.forEach((doc) => {
      const data = doc.data();
      // Firestore Timestamp'ı JavaScript Date'e dönüştür
      attendanceData.push({
        ...data,
        date: data.date?.toDate() || new Date()
      } as Attendance);
    });
    
    return attendanceData;
  } catch (error) {
    console.error('Kullanıcı devam kayıtları getirilirken hata:', error);
    throw error;
  }
};

// Kullanıcının ilerleme özetini getir
export const getUserProgressSummary = async (userId: string): Promise<UserProgressSummary> => {
  try {
    if (!userId) {
      console.error('getUserProgressSummary için geçerli bir userId gerekli');
      throw new Error('Geçerli bir kullanıcı kimliği bulunamadı');
    }
    
    console.log('İlerleme özeti alınıyor, userId:', userId);
    
    // Kullanıcının ilerleme kayıtlarını al
    const userProgress = await getUserProgress(userId);
    console.log('Kullanıcı ilerleme kayıtları:', userProgress.length || 0);
    
    // Kullanıcının kazandığı rozetleri al
    const userAchievements = await getUserAchievements(userId);
    console.log('Kullanıcı rozetleri:', userAchievements.length || 0);
    
    // Kullanıcının devam durumunu al
    const userAttendance = await getUserAttendance(userId, 5);
    console.log('Kullanıcı katılımları:', userAttendance.length || 0);
    
    // Kurs detaylarını almak için yardımcı fonksiyon - hata durumunda varsayılan adla ilerle
    const getCourseDetails = async (courseId: string) => {
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          return courseDoc.data();
        }
        return { name: `Kurs #${courseId.slice(0, 5)}...` };
      } catch (error) {
        console.error(`Kurs detayları getirilirken hata (${courseId}):`, error);
        return { name: `Kurs #${courseId.slice(0, 5)}...` };
      }
    };
    
    // Kurslardaki ilerleme bilgilerini oluştur
    const courseProgressPromises = userProgress.map(async (progress) => {
      try {
        const courseDetails = await getCourseDetails(progress.courseId);
        return {
          courseId: progress.courseId,
          courseName: courseDetails.name || `Kurs #${progress.courseId.slice(0, 5)}...`,
          progress: (progress.completedLessons / progress.totalLessons) * 100,
          completedLessons: progress.completedLessons,
          totalLessons: progress.totalLessons
        };
      } catch (error) {
        console.error(`Kurs ilerlemesi oluşturulurken hata (${progress.courseId}):`, error);
        return {
          courseId: progress.courseId,
          courseName: `Kurs #${progress.courseId.slice(0, 5)}...`,
          progress: 0,
          completedLessons: 0,
          totalLessons: 0
        };
      }
    });
    
    // Promise.all hatalarını yakalamak için güvenli bir şekilde işle
    let courseProgress: Array<{
      courseId: string;
      courseName: string;
      progress: number;
      completedLessons: number;
      totalLessons: number;
    }> = [];
    
    try {
      courseProgress = await Promise.all(courseProgressPromises);
    } catch (error) {
      console.error('Kurs ilerlemeleri alınırken hata:', error);
      // Hata durumunda boş dizi ile devam et
    }
    
    // Son katılımları detayları ile getir
    const recentAttendancePromises = userAttendance.map(async (attendance) => {
      try {
        const courseDetails = await getCourseDetails(attendance.courseId);
        return {
          courseId: attendance.courseId,
          courseName: courseDetails.name || `Kurs #${attendance.courseId.slice(0, 5)}...`,
          date: attendance.date,
          status: attendance.status
        };
      } catch (error) {
        console.error(`Katılım detayı oluşturulurken hata (${attendance.courseId}):`, error);
        return {
          courseId: attendance.courseId,
          courseName: `Kurs #${attendance.courseId.slice(0, 5)}...`,
          date: attendance.date,
          status: attendance.status
        };
      }
    });
    
    // Promise.all hatalarını yakalamak için güvenli bir şekilde işle
    let recentAttendance: Array<{
      courseId: string;
      courseName: string;
      date: Date;
      status: 'attended' | 'late' | 'missed';
    }> = [];
    
    try {
      recentAttendance = await Promise.all(recentAttendancePromises);
    } catch (error) {
      console.error('Katılım detayları alınırken hata:', error);
      // Hata durumunda boş dizi ile devam et
    }
    
    // Toplam dans süresini hesapla (tahmini, ders başına 1 saat olarak)
    const totalLessons = userProgress.reduce((total, progress) => total + progress.completedLessons, 0);
    const totalDanceHours = totalLessons; // Her ders 1 saat kabul ediliyor
    
    // Toplam puanları hesapla
    const totalPoints = userAchievements.reduce((total, achievement) => total + achievement.points, 0);
    
    // Seviyeyi hesapla (her 100 puan için 1 seviye)
    const level = Math.max(1, Math.floor(totalPoints / 100));
    
    // Bir sonraki seviye için gereken puanlar
    const nextLevelPoints = (level + 1) * 100;
    
    // İlerleme yüzdesini hesapla
    const progressPercentage = (totalPoints % 100);
    
    // Tamamlanan kursları say (ilerleme %100 olanlar)
    const completedCourses = courseProgress.filter(course => course.progress === 100).length;
    
    // Sonuç
    const result: UserProgressSummary = {
      completedCourses,
      completedLessons: totalLessons,
      totalDanceHours,
      earnedAchievements: userAchievements,
      progressPercentage,
      level,
      points: totalPoints,
      nextLevelPoints,
      courseProgress,
      recentAttendance
    };
    
    console.log('İlerleme özeti başarıyla oluşturuldu');
    return result;
  } catch (error) {
    console.error('Kullanıcı ilerleme özeti getirilirken hata:', error);
    // Hata durumunda boş bir özet döndür, böylece UI hiç veri yok gibi işlem yapabilir
    return {
      completedCourses: 0,
      completedLessons: 0,
      totalDanceHours: 0,
      earnedAchievements: [],
      progressPercentage: 0,
      level: 1,
      points: 0,
      nextLevelPoints: 100,
      courseProgress: [],
      recentAttendance: []
    };
  }
}; 