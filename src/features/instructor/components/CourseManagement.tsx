import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { Course } from '../../../types';
import { toast } from 'react-hot-toast';
import CustomSelect from '../../../common/components/ui/CustomSelect';

interface CourseManagementProps {
  instructorId: string;
}

const CourseManagement: React.FC<CourseManagementProps> = ({ instructorId }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    danceStyle: '',
    level: 'beginner',
    capacity: 10,
    price: 0,
    location: '',
    schedule: [{
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00'
    }]
  });

  const danceStyles = [
    { value: 'salsa', label: 'Salsa' },
    { value: 'bachata', label: 'Bachata' },
    { value: 'kizomba', label: 'Kizomba' },
    { value: 'tango', label: 'Tango' },
    { value: 'vals', label: 'Vals' }
  ];

  const levelOptions = [
    { value: 'beginner', label: 'Başlangıç' },
    { value: 'intermediate', label: 'Orta' },
    { value: 'advanced', label: 'İleri' },
    { value: 'professional', label: 'Profesyonel' }
  ];

  useEffect(() => {
    fetchCourses();
  }, [instructorId]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'courses'),
        where('instructorId', '==', instructorId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Kurslar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseData = {
        ...formData,
        instructorId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingCourse) {
        // Update existing course
        await updateDoc(doc(db, 'courses', editingCourse.id), {
          ...courseData,
          createdAt: editingCourse.createdAt,
          updatedAt: new Date().toISOString()
        });
        toast.success('Kurs başarıyla güncellendi');
      } else {
        // Add new course
        await addDoc(collection(db, 'courses'), courseData);
        toast.success('Kurs başarıyla oluşturuldu');
      }

      // Reset form and refresh courses
      setFormData({
        title: '',
        description: '',
        danceStyle: '',
        level: 'beginner',
        capacity: 10,
        price: 0,
        location: '',
        schedule: [{
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00'
        }]
      });
      setShowAddForm(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Kurs kaydedilirken bir hata oluştu');
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      danceStyle: course.danceStyle,
      level: course.level,
      capacity: course.capacity,
      price: course.price,
      location: course.location,
      schedule: course.schedule
    });
    setShowAddForm(true);
  };

  const handleDelete = async (courseId: string) => {
    if (window.confirm('Bu kursu silmek istediğinizden emin misiniz?')) {
      try {
        await updateDoc(doc(db, 'courses', courseId), {
          isActive: false,
          updatedAt: new Date().toISOString()
        });
        toast.success('Kurs başarıyla silindi');
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        toast.error('Kurs silinirken bir hata oluştu');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      {!showAddForm ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Kurslarım</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Yeni Kurs Ekle
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz kurs eklenmemiş</h3>
              <p className="text-gray-500">Yeni bir kurs ekleyerek öğrencilerinizle buluşun.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{course.title}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{course.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      <span>Kapasite: {course.capacity} kişi</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>
                        {course.schedule.map((s, index) => (
                          <span key={index}>
                            {index > 0 && ', '}
                            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][s.dayOfWeek - 1]} {s.startTime}-{s.endTime}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span>{course.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {editingCourse ? 'Kurs Düzenle' : 'Yeni Kurs Ekle'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingCourse(null);
                setFormData({
                  title: '',
                  description: '',
                  danceStyle: '',
                  level: 'beginner',
                  capacity: 10,
                  price: 0,
                  location: '',
                  schedule: [{
                    dayOfWeek: 1,
                    startTime: '09:00',
                    endTime: '10:00'
                  }]
                });
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kurs Adı
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <CustomSelect
                  label="Dans Stili"
                  options={danceStyles}
                  value={formData.danceStyle}
                  onChange={(value) => setFormData({ ...formData, danceStyle: value as string })}
                  placeholder="Dans stili seçin"
                />
              </div>

              <div>
                <CustomSelect
                  label="Seviye"
                  options={levelOptions}
                  value={formData.level}
                  onChange={(value) => setFormData({ ...formData, level: value as string })}
                  placeholder="Seviye seçin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kapasite
                </label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fiyat (₺)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konum
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ders Programı
              </label>
              {formData.schedule.map((schedule, index) => (
                <div key={index} className="flex space-x-4 mb-4">
                  <div className="w-1/3">
                    <select
                      value={schedule.dayOfWeek}
                      onChange={(e) => {
                        const newSchedule = [...formData.schedule];
                        newSchedule[index].dayOfWeek = parseInt(e.target.value);
                        setFormData({ ...formData, schedule: newSchedule });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={1}>Pazartesi</option>
                      <option value={2}>Salı</option>
                      <option value={3}>Çarşamba</option>
                      <option value={4}>Perşembe</option>
                      <option value={5}>Cuma</option>
                      <option value={6}>Cumartesi</option>
                      <option value={7}>Pazar</option>
                    </select>
                  </div>
                  <div className="w-1/3">
                    <input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => {
                        const newSchedule = [...formData.schedule];
                        newSchedule[index].startTime = e.target.value;
                        setFormData({ ...formData, schedule: newSchedule });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="w-1/3">
                    <input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) => {
                        const newSchedule = [...formData.schedule];
                        newSchedule[index].endTime = e.target.value;
                        setFormData({ ...formData, schedule: newSchedule });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    schedule: [
                      ...formData.schedule,
                      { dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }
                    ]
                  })}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  + Yeni Zaman Ekle
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCourse(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {editingCourse ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CourseManagement; 