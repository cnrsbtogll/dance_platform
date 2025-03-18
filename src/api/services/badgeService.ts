import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Achievement } from './progressService';

// Rozet koşulları ile ilgili tipler
interface BadgeRequirement {
  requiredAction: string;
  requiredCount?: number;
  danceType?: string;
}

/**
 * Belirli bir kullanıcının aktivitelerini kontrol ederek
 * rozet kazanma kriterlerini karşılayıp karşılamadığını belirler
 * @param userId Kullanıcı ID
 * @returns Kazanılan yeni rozetler array'i
 */
export const checkAndAwardBadges = async (userId: string): Promise<Achievement[]> => {
  try {
    // Kullanıcının şimdiye kadar kazandığı rozetleri al
    const userProgressDoc = await getDoc(doc(db, 'user_progress', userId));
    const earnedAchievements: string[] = userProgressDoc.exists() ? 
      userProgressDoc.data().earnedAchievements || [] : [];
      
    // Tüm rozet tanımlarını getir
    const achievementsQuery = query(collection(db, 'achievements'));
    const achievementsSnapshot = await getDocs(achievementsQuery);
    const allBadges: Achievement[] = [];
    achievementsSnapshot.forEach(doc => {
      const badge = { id: doc.id, ...doc.data() } as Achievement;
      allBadges.push(badge);
    });
    
    // Kullanıcının henüz kazanmadığı rozetleri filtrele
    const notEarnedBadges = allBadges.filter(badge => 
      !earnedAchievements.includes(badge.id)
    );
    
    if (notEarnedBadges.length === 0) {
      console.log('Kullanıcı tüm rozetleri kazanmış');
      return [];
    }
    
    // Kullanıcının platform aktivitelerini getir
    const activitiesQuery = query(
      collection(db, 'platform_activities'), 
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const activitiesSnapshot = await getDocs(activitiesQuery);
    
    // Aktivite tiplerini ve sayılarını hesapla
    const activityCounts: Record<string, number> = {};
    const activities: any[] = [];
    
    activitiesSnapshot.forEach(doc => {
      const activity = doc.data();
      activities.push(activity);
      
      // Aktivite sayılarını güncelle
      const type = activity.type;
      activityCounts[type] = (activityCounts[type] || 0) + 1;
    });
    
    // Dans stillerini sayma
    const dancesViewed = new Set<string>();
    activities.forEach(activity => {
      if (activity.type === 'view_course' && activity.details?.courseType) {
        dancesViewed.add(activity.details.courseType);
      }
    });
    
    // Kullanıcının kurs aktivitelerini getir (ders tamamlamalar için)
    const progressQuery = query(
      collection(db, 'progress'),
      where('userId', '==', userId)
    );
    const progressSnapshot = await getDocs(progressQuery);
    const completedLessons: Record<string, boolean> = {};
    
    progressSnapshot.forEach(doc => {
      const progress = doc.data();
      if (progress.courseId && progress.completedLessons > 0) {
        // Kurs detaylarını alıp dans tipini belirleme işlemi yapmak gerekirdi
        // Ancak basit tutmak için courseId'den ayıklıyoruz
        const courseId = progress.courseId;
        const danceType = courseId.includes('salsa') ? 'salsa' : 
                         courseId.includes('bachata') ? 'bachata' : 
                         courseId.includes('kizomba') ? 'kizomba' : 'other';
        
        completedLessons[danceType] = true;
      }
    });
    
    // Kullanıcının ek platform istatistiklerini getir
    let platformStats = {};
    if (userProgressDoc.exists() && userProgressDoc.data().platformStats) {
      platformStats = userProgressDoc.data().platformStats;
    }
    
    // Yeni kazanılan rozetleri belirle
    const newlyEarnedBadges: Achievement[] = [];
    
    for (const badge of notEarnedBadges) {
      const requirement = badge as unknown as BadgeRequirement;
      
      if (requirementMet(requirement, activityCounts, dancesViewed, completedLessons, platformStats)) {
        newlyEarnedBadges.push(badge);
      }
    }
    
    // Yeni kazanılan rozetler varsa kullanıcı bilgilerini güncelle
    if (newlyEarnedBadges.length > 0) {
      const newBadgeIds = newlyEarnedBadges.map(badge => badge.id);
      const updatedEarnedAchievements = [...earnedAchievements, ...newBadgeIds];
      
      // Toplam puan hesapla
      const additionalPoints = newlyEarnedBadges.reduce((total, badge) => total + (badge.points || 0), 0);
      const currentPoints = userProgressDoc.exists() ? userProgressDoc.data().points || 0 : 0;
      const newPoints = currentPoints + additionalPoints;
      
      // Seviye yükseltme kontrolü
      let level = userProgressDoc.exists() ? userProgressDoc.data().level || 1 : 1;
      const nextLevelPoints = 300; // Basit tutmak için sabit değer
      
      if (newPoints >= nextLevelPoints && level < 3) {
        level += 1;
      }
      
      // Kullanıcı progress dokümanını güncelle
      await updateDoc(doc(db, 'user_progress', userId), {
        earnedAchievements: updatedEarnedAchievements,
        points: newPoints,
        level: level,
        updatedAt: serverTimestamp()
      });
      
      // Bildirim kaydı oluştur
      for (const badge of newlyEarnedBadges) {
        await addDoc(collection(db, 'notifications'), {
          userId,
          type: 'badge_earned',
          title: 'Yeni Rozet Kazandınız!',
          message: `Tebrikler! "${badge.name}" rozetini kazandınız.`,
          details: {
            badgeId: badge.id,
            badgeName: badge.name,
            badgeUrl: badge.iconUrl,
            points: badge.points
          },
          read: false,
          createdAt: serverTimestamp()
        });
      }
    }
    
    return newlyEarnedBadges;
  } catch (error) {
    console.error('Rozet kontrol işlemi sırasında hata:', error);
    throw error;
  }
};

/**
 * Belirli rozet gereksinimlerinin karşılanıp karşılanmadığını kontrol eder
 */
const requirementMet = (
  requirement: BadgeRequirement, 
  activityCounts: Record<string, number>,
  dancesViewed: Set<string>,
  completedLessons: Record<string, boolean>,
  platformStats: any
): boolean => {
  const { requiredAction, requiredCount = 1, danceType } = requirement;
  
  switch (requiredAction) {
    case 'signup':
      return true; // Kullanıcı zaten kayıtlı olduğu için
      
    case 'complete_profile':
      return activityCounts['complete_profile'] > 0;
      
    case 'view_courses':
      return (activityCounts['view_course'] || 0) >= requiredCount;
      
    case 'view_instructors':
      return (activityCounts['view_instructor'] || 0) >= requiredCount;
      
    case 'view_schools':
      return (activityCounts['view_school'] || 0) >= requiredCount;
      
    case 'search_partners':
      return (activityCounts['search_partners'] || 0) >= requiredCount;
      
    case 'send_partner_request':
      return (activityCounts['send_partner_request'] || 0) >= requiredCount;
      
    case 'plan_dance_event':
      return (activityCounts['plan_dance_event'] || 0) >= requiredCount;
      
    case 'active_days':
      return platformStats.totalLogins >= requiredCount;
      
    case 'regular_visits':
      return platformStats.totalLogins >= requiredCount;
      
    case 'complete_first_lesson':
      // Dans tipine göre ders tamamlama kontrolü
      if (danceType) {
        return completedLessons[danceType] === true;
      }
      return Object.keys(completedLessons).length > 0;
      
    case 'explore_dance_styles':
      return dancesViewed.size >= requiredCount;
      
    case 'share_platform':
      return platformStats.referrals && platformStats.referrals > 0;
      
    case 'register_event':
      return activityCounts['register_event'] > 0;
      
    default:
      return false;
  }
};

/**
 * Kullanıcının platform aktivitesini kayıt eder
 * @param userId Kullanıcı ID
 * @param activityType Aktivite tipi
 * @param details Aktivite detayları
 */
export const logUserActivity = async (
  userId: string,
  activityType: string,
  details: any = {}
): Promise<void> => {
  try {
    const activityData = {
      userId,
      type: activityType,
      date: new Date(),
      details,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Aktiviteyi kaydet
    await addDoc(collection(db, 'platform_activities'), activityData);
    
    // Rozetleri kontrol et
    await checkAndAwardBadges(userId);
  } catch (error) {
    console.error('Kullanıcı aktivitesi kaydedilirken hata:', error);
    throw error;
  }
};

/**
 * Tüm kullanıcıların rozetlerini kontrol eder ve gerekirse yeni rozetler atar
 * Bu fonksiyon periyodik olarak çalıştırılabilir (örn. günlük)
 */
export const checkAllUsersBadges = async (): Promise<void> => {
  try {
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      await checkAndAwardBadges(userId);
    }
  } catch (error) {
    console.error('Tüm kullanıcıların rozetleri kontrol edilirken hata:', error);
    throw error;
  }
}; 