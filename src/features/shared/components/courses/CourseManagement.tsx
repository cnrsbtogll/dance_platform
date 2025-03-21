import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot,
  limit,
  where
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import { auth } from '../../../../api/firebase/firebase';
import { motion } from 'framer-motion';
import Button from '../../../../common/components/ui/Button';
import CustomSelect from '../../../../common/components/ui/CustomSelect';

// Dans stilleri için interface
interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

// Seviye options
const levelOptions = [
  { label: 'Başlangıç', value: 'beginner' },
  { label: 'Orta', value: 'intermediate' },
  { label: 'İleri', value: 'advanced' },
  { label: 'Profesyonel', value: 'professional' }
];

// Para birimi options
const currencyOptions = [
  { label: 'TL', value: 'TRY' },
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' }
];

// Şehir options
const cityOptions = [
  { label: 'İstanbul', value: 'İstanbul' },
  { label: 'Ankara', value: 'Ankara' },
  { label: 'İzmir', value: 'İzmir' },
  { label: 'Bursa', value: 'Bursa' }
];

// Gün options
const dayOptions = [
  { label: 'Pazartesi', value: 'Pazartesi' },
  { label: 'Salı', value: 'Salı' },
  { label: 'Çarşamba', value: 'Çarşamba' },
  { label: 'Perşembe', value: 'Perşembe' },
  { label: 'Cuma', value: 'Cuma' },
  { label: 'Cumartesi', value: 'Cumartesi' },
  { label: 'Pazar', value: 'Pazar' }
];

// Durum options
const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'inactive' }
];

interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

interface Schedule {
  day: string;
  time: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  instructorId: string;
  instructorName: string;
  schoolId: string;
  schoolName: string;
  danceStyle: string;
  level: string;
  maxParticipants: number;
  currentParticipants: number;
  schedule: Schedule[];
  duration: number;
  date: any;
  price: number;
  currency: string;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
  recurring: boolean;
  location: Location;
  imageUrl: string;
  highlights: string[];
  tags: string[];
}

interface FormData {
  name: string;
  description: string;
  instructorId: string;
  instructorName: string;
  schoolId: string;
  schoolName: string;
  danceStyle: string;
  level: string;
  maxParticipants: number;
  currentParticipants: number;
  schedule: Schedule[];
  duration: number;
  date: any;
  price: number;
  currency: string;
  status: 'active' | 'inactive';
  recurring: boolean;
  location: Location;
  imageUrl: string;
  highlights: string[];
  tags: string[];
}

interface CourseManagementProps {
  instructorId?: string;
  schoolId?: string;
  isAdmin?: boolean;
}

function CourseManagement({ instructorId, schoolId, isAdmin = false }: CourseManagementProps): JSX.Element {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [danceStyles, setDanceStyles] = useState<{ label: string; value: string; }[]>([]);
  const [loadingStyles, setLoadingStyles] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    instructorId: '',
    instructorName: 'Bilinmeyen Eğitmen',
    schoolId: '',
    schoolName: 'Bilinmeyen Okul',
    danceStyle: '',
    level: 'beginner',
    maxParticipants: 10,
    currentParticipants: 0,
    schedule: [],
    duration: 90,
    date: null,
    price: 0,
    currency: 'TRY',
    status: 'active',
    recurring: true,
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      latitude: 0,
      longitude: 0
    },
    imageUrl: '',
    highlights: [],
    tags: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dans stillerini getir
  const fetchDanceStyles = async () => {
    try {
      const stylesRef = collection(db, 'danceStyles');
      const q = query(stylesRef, orderBy('label'));
      const querySnapshot = await getDocs(q);
      
      const styles = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          label: data.label || data.name || '',
          value: data.value || doc.id
        };
      });
      
      setDanceStyles(styles);
    } catch (error) {
      console.error('Dans stilleri yüklenirken hata:', error);
      // Hata durumunda varsayılan stiller
      setDanceStyles([
        { label: 'Salsa', value: 'salsa' },
        { label: 'Bachata', value: 'bachata' },
        { label: 'Kizomba', value: 'kizomba' },
        { label: 'Tango', value: 'tango' },
        { label: 'Vals', value: 'vals' }
      ]);
    } finally {
      setLoadingStyles(false);
    }
  };

  // Test verisi ekleme fonksiyonu
  const addTestData = async () => {
    try {
      const testCourse = {
        name: 'Test Vals Kursu',
        description: 'Vals dansına giriş yapacağınız bu kursta, dansın temel prensiplerini öğreneceksiniz.',
        instructorId: 'test-instructor',
        instructorName: 'Bilinmeyen Eğitmen',
        schoolId: 'test-school',
        schoolName: 'Bilinmeyen Okul',
        danceStyle: 'vals',
        level: 'beginner',
        maxParticipants: 15,
        currentParticipants: 0,
        schedule: [
          { day: 'Pazartesi', time: '19:00' },
          { day: 'Çarşamba', time: '19:00' }
        ],
        duration: 90,
        date: serverTimestamp(),
        price: 350,
        currency: 'TRY',
        status: 'active',
        recurring: true,
        location: {
          address: '',
          city: 'İstanbul',
          state: '',
          zipCode: '',
          latitude: 41.0082,
          longitude: 28.9784
        },
        imageUrl: '/assets/images/dance/kurs1.jpg',
        highlights: [
          '90 dakika süren dersler',
          'Temel seviyeye uygun',
          'Deneyimli eğitmenler eşliğinde'
        ],
        tags: ['vals', 'beginner', '90 dakika'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Test verisi ekleniyor...');
      const docRef = await addDoc(collection(db, 'courses'), testCourse);
      console.log('Test verisi eklendi, ID:', docRef.id);
      
      return docRef.id;
    } catch (err) {
      console.error('Test verisi eklenirken hata:', err);
      throw err;
    }
  };

  // Kursları getir
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      // Firebase bağlantısını ve auth durumunu kontrol et
      if (!db) {
        console.error('Firebase db objesi:', db);
        throw new Error('Firebase bağlantısı başlatılmamış');
      }

      // Auth durumunu kontrol et
      const currentUser = auth.currentUser;
      console.log('Mevcut kullanıcı:', currentUser?.uid);

      if (!currentUser) {
        throw new Error('Oturum açmanız gerekiyor');
      }

      console.log('Firebase bağlantısı başarılı, kurslar getiriliyor...');
      
      try {
        const coursesRef = collection(db, 'courses');
        console.log('Courses koleksiyonu referansı alındı:', coursesRef);
        
        // Query oluştur
        let q = query(coursesRef, orderBy('createdAt', 'desc'));
        
        // Eğer instructor veya school ID varsa, filtreleme ekle
        if (instructorId) {
          q = query(coursesRef, 
            where('instructorId', '==', instructorId),
            orderBy('createdAt', 'desc')
          );
        } else if (schoolId) {
          q = query(coursesRef, 
            where('schoolId', '==', schoolId),
            orderBy('createdAt', 'desc')
          );
        }

        console.log('Ana query oluşturuldu:', q);
        
        console.log('Veriler çekiliyor...');
        try {
          const querySnapshot = await Promise.race([
            getDocs(q),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Veri çekme zaman aşımına uğradı')), 10000)
            )
          ]) as QuerySnapshot<DocumentData>;
          
          console.log('Query tamamlandı, sonuçlar:', {
            empty: querySnapshot.empty,
            size: querySnapshot.size,
            metadata: querySnapshot.metadata,
            docs: querySnapshot.docs.map(doc => doc.id)
          });
          
          if (querySnapshot.empty) {
            console.log('Henüz kurs kaydı bulunmuyor');
            setCourses([]);
            return;
          }

          const coursesData: Course[] = [];
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            try {
              const processedCourse = processQueryData(doc);
              console.log(`Kurs işlendi (ID: ${doc.id}):`, processedCourse);
              coursesData.push(processedCourse);
            } catch (docError) {
              console.error(`Kurs dökümanı işlenirken hata (ID: ${doc.id}):`, docError);
            }
          });
          
          console.log('Tüm kurslar işlendi:', {
            totalCount: coursesData.length,
            courses: coursesData
          });
          
          setCourses(coursesData);
        } catch (queryError: any) {
          console.error('Query işlemi sırasında hata:', {
            code: queryError.code,
            message: queryError.message,
            name: queryError.name
          });
          
          if (queryError.code === 'permission-denied') {
            throw new Error('Kurs verilerine erişim izniniz yok. Yönetici ile iletişime geçin.');
          }
          throw queryError;
        }
      } catch (queryError) {
        console.error('Query işlemi sırasında hata:', queryError);
        throw queryError;
      }
    } catch (err) {
      console.error('Kurslar yüklenirken hata detayı:', {
        error: err,
        message: err instanceof Error ? err.message : 'Bilinmeyen hata',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Kurslar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        await Promise.all([
          fetchCourses(),
          fetchDanceStyles()
        ]);
      } catch (err) {
        if (isMounted) {
          console.error('Veriler yüklenirken hata:', err);
          setError('Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Kurs düzenleme
  const editCourse = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      description: course.description,
      instructorId: course.instructorId,
      instructorName: course.instructorName,
      schoolId: course.schoolId,
      schoolName: course.schoolName,
      danceStyle: course.danceStyle,
      level: course.level,
      maxParticipants: course.maxParticipants,
      currentParticipants: course.currentParticipants,
      schedule: course.schedule,
      duration: course.duration,
      date: course.date,
      price: course.price,
      currency: course.currency,
      status: course.status,
      recurring: course.recurring,
      location: course.location,
      imageUrl: course.imageUrl,
      highlights: course.highlights,
      tags: course.tags
    });
    setEditMode(true);
  };

  // Yeni kurs ekleme
  const addNewCourse = () => {
    setSelectedCourse(null);
    setFormData({
      name: '',
      description: '',
      instructorId: '',
      instructorName: 'Bilinmeyen Eğitmen',
      schoolId: '',
      schoolName: 'Bilinmeyen Okul',
      danceStyle: '',
      level: 'beginner',
      maxParticipants: 10,
      currentParticipants: 0,
      schedule: [],
      duration: 90,
      date: null,
      price: 0,
      currency: 'TRY',
      status: 'active',
      recurring: true,
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        latitude: 0,
        longitude: 0
      },
      imageUrl: '',
      highlights: [],
      tags: []
    });
    setEditMode(true);
  };

  // Form alanı değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  // Firebase için veriyi temizleyen yardımcı fonksiyon
  const cleanDataForFirebase = (data: any) => {
    const cleanData = { ...data };
    
    // Undefined değerleri kaldır
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    // Eğer recurring true değilse date alanını kaldır
    if (!cleanData.recurring) {
      delete cleanData.date;
    }

    // Timestamp alanlarını koru
    const { createdAt, updatedAt, ...restData } = cleanData;
    
    return restData;
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const courseData = {
        ...formData,
        instructorId: instructorId || formData.instructorId,
        schoolId: schoolId || formData.schoolId,
        recurring: formData.recurring || false, // Varsayılan olarak false
        currentParticipants: formData.currentParticipants || 0, // Varsayılan olarak 0
        status: formData.status || 'active' // Varsayılan olarak active
      };

      // Firebase için veriyi temizle
      const cleanedData = cleanDataForFirebase(courseData);

      if (selectedCourse) {
        // Mevcut kursu güncelle
        const courseRef = doc(db, 'courses', selectedCourse.id);
        await updateDoc(courseRef, {
          ...cleanedData,
          updatedAt: serverTimestamp()
        });
        
        setCourses(prev => prev.map(course => 
          course.id === selectedCourse.id 
            ? { ...course, ...courseData }
            : course
        ));
        
        setSuccess('Kurs başarıyla güncellendi.');
      } else {
        // Yeni kurs ekle
        const docRef = await addDoc(collection(db, 'courses'), {
          ...cleanedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        const newCourse: Course = {
          id: docRef.id,
          ...courseData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        setCourses(prev => [newCourse, ...prev]);
        setSuccess('Yeni kurs başarıyla eklendi.');
      }
      
      setEditMode(false);
      setSelectedCourse(null);
    } catch (err) {
      console.error('Kurs kaydedilirken hata oluştu:', err);
      setError('Kurs kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Kurs silme
  const deleteCourse = async (id: string) => {
    if (window.confirm('Bu kursu silmek istediğinizden emin misiniz?')) {
      setLoading(true);
      setError(null);
      try {
        await deleteDoc(doc(db, 'courses', id));
        setCourses(prev => prev.filter(course => course.id !== id));
        setSuccess('Kurs başarıyla silindi.');
      } catch (err) {
        console.error('Kurs silinirken hata oluştu:', err);
        setError('Kurs silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filtrelenmiş kurslar
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Veri işleme fonksiyonunu güncelle
  const processQueryData = (doc: QueryDocumentSnapshot<DocumentData>): Course => {
    const courseData = doc.data();
    return {
      id: doc.id,
      name: courseData.name || '',
      description: courseData.description || '',
      instructorId: courseData.instructorId || '',
      instructorName: courseData.instructorName || 'Bilinmeyen Eğitmen',
      schoolId: courseData.schoolId || '',
      schoolName: courseData.schoolName || 'Bilinmeyen Okul',
      danceStyle: courseData.danceStyle || '',
      level: courseData.level || 'beginner',
      maxParticipants: courseData.maxParticipants || 0,
      currentParticipants: courseData.currentParticipants || 0,
      schedule: courseData.schedule || [],
      duration: courseData.duration || 90,
      date: courseData.date,
      price: courseData.price || 0,
      currency: courseData.currency || 'TRY',
      status: courseData.status || 'inactive',
      recurring: courseData.recurring || false,
      location: courseData.location || {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        latitude: 0,
        longitude: 0
      },
      imageUrl: courseData.imageUrl || '',
      highlights: courseData.highlights || [],
      tags: courseData.tags || [],
      createdAt: courseData.createdAt,
      updatedAt: courseData.updatedAt
    };
  };

  return (
    <div>
      {/* Başlık ve Yeni Ekle butonu */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Kurs Yönetimi</h2>
        {!editMode && (
          <Button
            onClick={addNewCourse}
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Yükleniyor...' : 'Yeni Kurs Ekle'}
          </Button>
        )}
      </div>

      {/* Hata ve Başarı Mesajları */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p>{success}</p>
        </div>
      )}

      {editMode ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {selectedCourse ? 'Kurs Düzenle' : 'Yeni Kurs Ekle'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temel Bilgiler */}
              <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Temel Bilgiler</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Kurs Adı*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Kurs adını girin"
                    />
                  </div>

                  <div>
                    {loadingStyles ? (
                      <div className="p-2 flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                        <span className="text-sm text-gray-600">Dans stilleri yükleniyor...</span>
                      </div>
                    ) : (
                      <CustomSelect
                        label="Dans Stili*"
                        value={formData.danceStyle}
                        onChange={(value) => setFormData(prev => ({ ...prev, danceStyle: value as string }))}
                        options={danceStyles}
                        placeholder="Dans Stili Seçin"
                      />
                    )}
                  </div>

                  <div>
                    <CustomSelect
                      label="Seviye*"
                      value={formData.level}
                      onChange={(value) => setFormData(prev => ({ ...prev, level: value as string }))}
                      options={levelOptions}
                      placeholder="Seviye Seçin"
                    />
                  </div>

                  <div>
                    <CustomSelect
                      label="Durum"
                      value={formData.status}
                      onChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
                      options={statusOptions}
                      placeholder="Durum Seçin"
                    />
                  </div>
                </div>
              </div>

              {/* Program Detayları */}
              <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Program Detayları</h4>
                <div className="space-y-4">
                  {/* Mevcut program listesi */}
                  {formData.schedule.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <CustomSelect
                          label="Gün"
                          value={item.day}
                          onChange={(value) => {
                            const newSchedule = [...formData.schedule];
                            newSchedule[index].day = value as string;
                            setFormData(prev => ({ ...prev, schedule: newSchedule }));
                          }}
                          options={dayOptions}
                          placeholder="Gün Seçin"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Saat
                        </label>
                        <input
                          type="time"
                          value={item.time}
                          onChange={(e) => {
                            const newSchedule = [...formData.schedule];
                            newSchedule[index].time = e.target.value;
                            setFormData(prev => ({ ...prev, schedule: newSchedule }));
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            const newSchedule = formData.schedule.filter((_, i) => i !== index);
                            setFormData(prev => ({ ...prev, schedule: newSchedule }));
                          }}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Yeni gün/saat ekle butonu */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        schedule: [...prev.schedule, { day: '', time: '' }]
                      }));
                    }}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    + Yeni Gün/Saat Ekle
                  </button>

                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                      Süre (Dakika)*
                    </label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      required
                      min="30"
                      max="180"
                      step="15"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
                      Maksimum Katılımcı*
                    </label>
                    <input
                      type="number"
                      id="maxParticipants"
                      name="maxParticipants"
                      required
                      min="1"
                      max="50"
                      value={formData.maxParticipants}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fiyatlandırma */}
              <div className="col-span-2 md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Fiyatlandırma</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Fiyat*
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        id="price"
                        name="price"
                        required
                        min="0"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <CustomSelect
                        label=""
                        value={formData.currency}
                        onChange={(value) => setFormData(prev => ({ ...prev, currency: value as string }))}
                        options={currencyOptions}
                        placeholder="Para Birimi"
                        className="w-32"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lokasyon */}
              <div className="col-span-2 md:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Lokasyon</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Şehir*
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.location.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, city: e.target.value }
                      }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Şehir girin"
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Adres
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.location.address}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, address: e.target.value }
                      }))}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Açıklama */}
              <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Açıklama</h4>
                <div>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Kurs açıklamasını girin"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setEditMode(false)}
                variant="secondary"
                disabled={loading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (selectedCourse ? 'Güncelle' : 'Ekle')}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Kurs adı veya açıklama ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kurs Adı
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dans Stili
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seviye
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Program
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <motion.tr 
                      key={course.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">{course.price} {course.currency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{course.danceStyle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {course.level === 'beginner' ? 'Başlangıç' :
                           course.level === 'intermediate' ? 'Orta' : 'İleri'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {course.schedule.map((item, index) => (
                            <div key={index}>
                              {item.day}: {item.time}
                            </div>
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">{course.duration} dakika</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          course.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {course.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => editCourse(course)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Sil
                        </button>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? 'Aramanıza uygun kurs bulunamadı.' : 'Henüz hiç kurs kaydı bulunmuyor.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default CourseManagement; 