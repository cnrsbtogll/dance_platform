import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { DanceClass, DanceStyle, DanceLevel } from '../types';

// Koleksiyon adı
const CLASSES_COLLECTION = 'danceClasses';

/**
 * Yeni bir dans dersi oluşturur
 */
export const createDanceClass = async (danceClassData: Omit<DanceClass, 'id'>): Promise<string> => {
  try {
    // Gerekli alanların kontrolü
    if (!danceClassData.name || !danceClassData.instructorId || !danceClassData.danceStyle) {
      throw new Error('Ders adı, eğitmen ID ve dans stili zorunludur');
    }

    // undefined değerli alanları temizle
    const cleanData = Object.fromEntries(
      Object.entries(danceClassData).filter(([_, value]) => value !== undefined)
    );

    // Firestore'a eklenecek veri
    const classData = {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      currentParticipants: danceClassData.currentParticipants || 0,
    };

    // Yeni döküman oluştur
    const docRef = await addDoc(collection(db, CLASSES_COLLECTION), classData);
    console.log('Yeni dans dersi oluşturuldu:', docRef.id);
    
    // Oluşturulan ID'yi ekleyerek güncelle
    await updateDoc(docRef, { id: docRef.id });
    
    return docRef.id;
  } catch (error) {
    console.error('Dans dersi oluşturulurken hata:', error);
    throw error;
  }
};

/**
 * Belirli bir dans dersini ID'ye göre getirir
 */
export const getDanceClassById = async (classId: string): Promise<DanceClass | null> => {
  try {
    const classDocRef = doc(db, CLASSES_COLLECTION, classId);
    const classSnapshot = await getDoc(classDocRef);
    
    if (!classSnapshot.exists()) {
      return null;
    }
    
    return classSnapshot.data() as DanceClass;
  } catch (error) {
    console.error('Dans dersi getirilirken hata:', error);
    throw error;
  }
};

/**
 * Tüm dans derslerini getirir
 */
export const getAllDanceClasses = async (): Promise<DanceClass[]> => {
  try {
    const classesQuery = query(
      collection(db, CLASSES_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    
    const classesSnapshot = await getDocs(classesQuery);
    const classes: DanceClass[] = [];
    
    classesSnapshot.forEach((doc) => {
      const data = doc.data();
      classes.push(data as DanceClass);
    });
    
    return classes;
  } catch (error) {
    console.error('Dans dersleri getirilirken hata:', error);
    throw error;
  }
};

/**
 * Bir okulun tüm derslerini getirir
 */
export const getSchoolDanceClasses = async (schoolId: string): Promise<DanceClass[]> => {
  try {
    const classesQuery = query(
      collection(db, CLASSES_COLLECTION),
      where('schoolId', '==', schoolId),
      orderBy('createdAt', 'desc')
    );
    
    const classesSnapshot = await getDocs(classesQuery);
    const classes: DanceClass[] = [];
    
    classesSnapshot.forEach((doc) => {
      const data = doc.data();
      classes.push(data as DanceClass);
    });
    
    return classes;
  } catch (error) {
    console.error('Okul dersleri getirilirken hata:', error);
    throw error;
  }
};

/**
 * Bir eğitmenin tüm derslerini getirir
 */
export const getInstructorDanceClasses = async (instructorId: string): Promise<DanceClass[]> => {
  try {
    console.log('getInstructorDanceClasses çağrıldı, instructorId:', instructorId);
    
    const classesQuery = query(
      collection(db, CLASSES_COLLECTION),
      where('instructorId', '==', instructorId)
    );
    
    console.log('Query oluşturuldu:', CLASSES_COLLECTION, 'instructorId ==', instructorId);
    
    const classesSnapshot = await getDocs(classesQuery);
    console.log('Query sonucu:', classesSnapshot.size, 'belge bulundu');
    
    const classes: DanceClass[] = [];
    
    classesSnapshot.forEach((docSnapshot) => {
      // Firestore belgesi kimliğini ve verilerini al
      const id = docSnapshot.id;
      const data = docSnapshot.data();
      
      // Timestamp dönüşümü için düzeltme
      const classData = {
        id,
        ...data,
        // Firestore timestamp'i JavaScript Date nesnesine dönüştür
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date(),
        date: data.date ? new Date(data.date.seconds * 1000) : new Date(),
      } as DanceClass;
      
      console.log('İşlenmiş ders verisi:', id, classData);
      classes.push(classData);
    });
    
    console.log('Toplam dersler:', classes.length);
    return classes;
  } catch (error) {
    console.error('Eğitmen dersleri getirilirken hata:', error);
    throw error;
  }
};

/**
 * Dans dersini günceller
 */
export const updateDanceClass = async (
  classId: string, 
  updateData: Partial<DanceClass>
): Promise<void> => {
  try {
    const classDocRef = doc(db, CLASSES_COLLECTION, classId);
    
    // Güncellenecek veri
    const updatePayload = {
      ...updateData,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(classDocRef, updatePayload);
    console.log('Dans dersi güncellendi:', classId);
  } catch (error) {
    console.error('Dans dersi güncellenirken hata:', error);
    throw error;
  }
};

/**
 * Dans dersine katılımcı ekler
 */
export const addParticipantToClass = async (
  classId: string, 
  userId: string
): Promise<void> => {
  try {
    // Dersi getir
    const classData = await getDanceClassById(classId);
    if (!classData) {
      throw new Error('Ders bulunamadı');
    }
    
    // Kapasite kontrolü
    if (classData.currentParticipants >= classData.maxParticipants) {
      throw new Error('Ders kapasitesi dolu');
    }
    
    // Katılımcılar koleksiyonunu güncelle
    const participantDocRef = doc(db, `${CLASSES_COLLECTION}/${classId}/participants`, userId);
    await setDoc(participantDocRef, {
      userId,
      joinedAt: serverTimestamp()
    });
    
    // Ders belgesindeki katılımcı sayısını güncelle
    const classDocRef = doc(db, CLASSES_COLLECTION, classId);
    await updateDoc(classDocRef, {
      currentParticipants: (classData.currentParticipants || 0) + 1,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Derse katılımcı eklenirken hata:', error);
    throw error;
  }
};

/**
 * Dans dersinden katılımcı çıkarır
 */
export const removeParticipantFromClass = async (
  classId: string, 
  userId: string
): Promise<void> => {
  try {
    // Katılımcıyı sil
    const participantDocRef = doc(db, `${CLASSES_COLLECTION}/${classId}/participants`, userId);
    await deleteDoc(participantDocRef);
    
    // Dersi getir
    const classData = await getDanceClassById(classId);
    if (!classData) {
      throw new Error('Ders bulunamadı');
    }
    
    // Ders belgesindeki katılımcı sayısını güncelle
    const classDocRef = doc(db, CLASSES_COLLECTION, classId);
    await updateDoc(classDocRef, {
      currentParticipants: Math.max((classData.currentParticipants || 1) - 1, 0),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Dersten katılımcı çıkarılırken hata:', error);
    throw error;
  }
};

/**
 * Dans dersini siler
 */
export const deleteDanceClass = async (classId: string): Promise<void> => {
  try {
    const classDocRef = doc(db, CLASSES_COLLECTION, classId);
    await deleteDoc(classDocRef);
    console.log('Dans dersi silindi:', classId);
  } catch (error) {
    console.error('Dans dersi silinirken hata:', error);
    throw error;
  }
}; 