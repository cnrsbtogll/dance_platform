import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { DanceSchool } from '../../types';

// Koleksiyon adı
const SCHOOLS_COLLECTION = 'schools';

/**
 * Tüm dans okullarını getirir
 */
export const getAllDanceSchools = async (): Promise<DanceSchool[]> => {
  try {
    const schoolsQuery = query(
      collection(db, SCHOOLS_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    
    const schoolsSnapshot = await getDocs(schoolsQuery);
    const schools: DanceSchool[] = [];
    
    schoolsSnapshot.forEach((doc) => {
      const data = doc.data();
      schools.push({
        id: doc.id,
        ...data
      } as DanceSchool);
    });
    
    return schools;
  } catch (error) {
    console.error('Dans okulları getirilirken hata:', error);
    throw error;
  }
};

/**
 * Dans okulu ID'ye göre getirir
 */
export const getDanceSchoolById = async (schoolId: string): Promise<DanceSchool | null> => {
  try {
    const schoolDocRef = doc(db, SCHOOLS_COLLECTION, schoolId);
    const schoolSnapshot = await getDoc(schoolDocRef);
    
    if (!schoolSnapshot.exists()) {
      return null;
    }
    
    return {
      id: schoolSnapshot.id,
      ...schoolSnapshot.data()
    } as DanceSchool;
  } catch (error) {
    console.error('Dans okulu getirilirken hata:', error);
    throw error;
  }
};

/**
 * Featured dans okullarını getirir (en çok kursu olan veya öne çıkarılan)
 */
export const getFeaturedDanceSchools = async (count: number = 4): Promise<DanceSchool[]> => {
  try {
    // Şimdilik basitçe son eklenen okulları getiriyoruz,
    // daha sonra öne çıkan okullar için bir alan eklenebilir (isFeatured gibi)
    const schoolsQuery = query(
      collection(db, SCHOOLS_COLLECTION), 
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    
    const schoolsSnapshot = await getDocs(schoolsQuery);
    const schools: DanceSchool[] = [];
    
    schoolsSnapshot.forEach((doc) => {
      const data = doc.data();
      schools.push({
        id: doc.id,
        ...data
      } as DanceSchool);
    });
    
    return schools;
  } catch (error) {
    console.error('Öne çıkan dans okulları getirilirken hata:', error);
    throw error;
  }
}; 