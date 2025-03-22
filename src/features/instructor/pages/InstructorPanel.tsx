import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { motion } from 'framer-motion';
import InstructorProfileForm from '../components/InstructorProfileForm';
import CourseManagement from '../../../features/shared/components/courses/CourseManagement';
import { query, where, orderBy, collection, getDocs } from 'firebase/firestore';
import { StudentManagement } from '../../../features/shared/components/students/StudentManagement';
import { db } from '../../../api/firebase/firebase';
import { ChatList } from '../../../features/chat/components/ChatList';

interface InstructorPanelProps {
  user: any; // TODO: Add proper type
}

interface Course {
  id: string;
  name: string;
  schedule: {
    day: string;
    time: string;
  }[];
}

function InstructorPanel({ user }: InstructorPanelProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'students' | 'schedule' | 'messages'>('profile');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcı bilgilerini logla
  console.log('InstructorPanel - user:', user);

  // Kursları getir
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;

      try {
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, where('instructorId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        const coursesData: Course[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          coursesData.push({
            id: doc.id,
            name: data.name,
            schedule: data.schedule || []
          });
        });
        
        setCourses(coursesData);
      } catch (err) {
        console.error('Kurslar yüklenirken hata:', err);
        setError('Kurslar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'schedule') {
      fetchCourses();
    }
  }, [activeTab, user?.id]);

  if (!user) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 inline-block relative bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Eğitmen Yönetim Paneli
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Kurslarınızı, öğrencilerinizi ve ders programınızı profesyonelce yönetin ve dans eğitimi deneyiminizi en üst düzeye çıkarın.
        </p>
      </motion.div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Tab Navigation - Mobile */}
        <div className="md:hidden border-b overflow-x-auto">
          <div className="flex whitespace-nowrap">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profil
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${
                activeTab === 'courses'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Kurslar
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${
                activeTab === 'students'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Öğrenciler
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${
                activeTab === 'schedule'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Program
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${
                activeTab === 'messages'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Mesajlar
            </button>
          </div>
        </div>

        {/* Tab Navigation - Desktop */}
        <div className="hidden md:block border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profilim
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'courses'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kurslarım
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'students'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Öğrencilerim
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'schedule'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ders Programım
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'messages'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mesajlarım
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'profile' && (
            <InstructorProfileForm user={user} />
          )}

          {activeTab === 'courses' && (
            <CourseManagement instructorId={user.id} />
          )}

          {activeTab === 'students' && (
            <StudentManagement isAdmin={false} />
          )}

          {activeTab === 'messages' && (
            <ChatList />
          )}

          {activeTab === 'schedule' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-semibold">Ders Programım</h2>
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Yatay kaydırarak tüm günleri görebilirsiniz
                </div>
              </div>

              {/* Mobil görünüm için seçici */}
              <div className="block sm:hidden mb-4">
                <select 
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  onChange={(e) => {
                    const element = document.getElementById(`day-${e.target.value}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                  }}
                >
                  {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Günler başlığı - Masaüstü */}
              <div className="hidden sm:grid grid-cols-7 gap-4 mb-6">
                {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => (
                  <div key={day} className="text-center font-medium text-gray-700 bg-gray-100 py-2 rounded">
                    {day}
                  </div>
                ))}
              </div>

              {/* Kurs listesi */}
              {courses.length > 0 ? (
                <div className="relative">
                  <div className="overflow-x-auto pb-4 sm:overflow-x-visible">
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 min-w-[768px] sm:min-w-0">
                      {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => (
                        <div 
                          key={day} 
                          id={`day-${day}`}
                          className="min-h-[100px] sm:min-h-[200px] border border-gray-200 rounded p-2"
                        >
                          {/* Mobil görünümde gün başlığı */}
                          <div className="block sm:hidden text-center font-medium text-gray-700 bg-gray-100 py-2 rounded mb-2">
                            {day}
                          </div>
                          
                          {courses
                            .filter(course => course.schedule.some(s => s.day === day))
                            .map(course => (
                              <div 
                                key={course.id} 
                                className="mb-2 p-2 bg-indigo-50 border border-indigo-100 rounded text-sm hover:bg-indigo-100 transition-colors duration-150"
                              >
                                <div className="font-medium text-indigo-700 truncate">{course.name}</div>
                                {course.schedule
                                  .filter(s => s.day === day)
                                  .map((schedule, index) => (
                                    <div key={index} className="text-gray-600 text-xs mt-1 flex items-center">
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {schedule.time}
                                    </div>
                                  ))}
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Kaydırma göstergesi - Sadece mobilde */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 sm:hidden">
                    <div className="bg-gradient-to-l from-white via-white/80 to-transparent w-8 h-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 text-sm sm:text-base">Henüz hiç kursunuz bulunmuyor.</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Yeni bir kurs eklemek için "Kurslarım" sekmesini kullanın.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <h2 className="font-semibold text-blue-800">Eğitmen İpuçları</h2>
        <ul className="mt-2 space-y-2 text-sm text-blue-700">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Düzenli olarak kurs içeriğinizi güncelleyerek öğrencilerinizin ilgisini canlı tutun.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Öğrencilerinizin ilerleme durumlarını takip ederek kişiselleştirilmiş geri bildirimler verin.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Ders programınızı önceden planlayarak öğrencilerinize duyurun.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Dans videolarınızı paylaşarak öğrencilerinizin ders dışında da çalışmalarını sağlayın.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Öğrencilerinizle düzenli iletişim kurarak motivasyonlarını yüksek tutun.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default InstructorPanel; 