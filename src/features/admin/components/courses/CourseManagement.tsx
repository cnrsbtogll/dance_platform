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
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import { motion } from 'framer-motion';
import Button from '../../../../common/components/ui/Button';
import CustomSelect from '../../../../common/components/ui/CustomSelect';

// Dans stilleri için options
const danceStyleOptions = [
  { label: 'Salsa', value: 'salsa' },
  { label: 'Bachata', value: 'bachata' },
  { label: 'Kizomba', value: 'kizomba' },
  { label: 'Tango', value: 'tango' }
];

// Seviye options
const levelOptions = [
  { label: 'Başlangıç', value: 'beginner' },
  { label: 'Orta', value: 'intermediate' },
  { label: 'İleri', value: 'advanced' }
];

// Durum options
const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'inactive' }
];

interface Course {
  id: string;
  name: string;
  description: string;
  instructor_id: string;
  school_id: string;
  danceStyle: string;
  level: string;
  capacity: number;
  schedule: string;
  duration: string;
  price: number;
  status: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

interface FormData {
  name: string;
  description: string;
  instructor_id: string;
  school_id: string;
  danceStyle: string;
  level: string;
  capacity: number;
  schedule: string;
  duration: string;
  price: number;
  status: 'active' | 'inactive';
}

function CourseManagement(): JSX.Element {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    instructor_id: '',
    school_id: '',
    danceStyle: '',
    level: 'beginner',
    capacity: 10,
    schedule: '',
    duration: '',
    price: 0,
    status: 'active'
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Kursları getir
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const coursesData: Course[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        coursesData.push({
          id: doc.id,
          ...doc.data()
        } as Course);
      });
      
      setCourses(coursesData);
    } catch (err) {
      console.error('Kurslar yüklenirken hata oluştu:', err);
      setError('Kurslar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Kurs düzenleme
  const editCourse = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      description: course.description,
      instructor_id: course.instructor_id,
      school_id: course.school_id,
      danceStyle: course.danceStyle,
      level: course.level,
      capacity: course.capacity,
      schedule: course.schedule,
      duration: course.duration,
      price: course.price,
      status: course.status
    });
    setEditMode(true);
  };

  // Yeni kurs ekleme
  const addNewCourse = () => {
    setSelectedCourse(null);
    setFormData({
      name: '',
      description: '',
      instructor_id: '',
      school_id: '',
      danceStyle: '',
      level: 'beginner',
      capacity: 10,
      schedule: '',
      duration: '',
      price: 0,
      status: 'active'
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

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (selectedCourse) {
        // Mevcut kursu güncelle
        const courseRef = doc(db, 'courses', selectedCourse.id);
        await updateDoc(courseRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        
        setCourses(prev => prev.map(course => 
          course.id === selectedCourse.id 
            ? { ...course, ...formData }
            : course
        ));
        
        setSuccess('Kurs başarıyla güncellendi.');
      } else {
        // Yeni kurs ekle
        const docRef = await addDoc(collection(db, 'courses'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        const newCourse: Course = {
          id: docRef.id,
          ...formData,
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

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <CustomSelect
                  label="Dans Stili"
                  value={formData.danceStyle}
                  onChange={(value) => setFormData(prev => ({ ...prev, danceStyle: value as string }))}
                  options={danceStyleOptions}
                  placeholder="Dans Stili Seçin"
                />
              </div>

              <div>
                <CustomSelect
                  label="Seviye"
                  value={formData.level}
                  onChange={(value) => setFormData(prev => ({ ...prev, level: value as string }))}
                  options={levelOptions}
                  placeholder="Seviye Seçin"
                />
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                  Kapasite*
                </label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
                  Ders Programı*
                </label>
                <input
                  type="text"
                  id="schedule"
                  name="schedule"
                  required
                  value={formData.schedule}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Örn: Pazartesi ve Çarşamba 19:00-20:30"
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                  Süre*
                </label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  required
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Örn: 8 Hafta"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Fiyat*
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
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

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
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
                        <div className="text-sm text-gray-500">{course.price} TL</div>
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
                        <div className="text-sm text-gray-900">{course.schedule}</div>
                        <div className="text-sm text-gray-500">{course.duration}</div>
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