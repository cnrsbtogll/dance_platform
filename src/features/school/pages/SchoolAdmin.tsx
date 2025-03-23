import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { StudentManagement } from '../components';
import InstructorManagement from '../components/InstructorManagement';
import CourseManagement from '../../../features/shared/components/courses/CourseManagement';
import AttendanceManagement from '../components/AttendanceManagement';
import ProgressTracking from '../components/ProgressTracking';
import BadgeSystem from '../components/BadgeSystem';
import SchoolSettings from '../components/SchoolSettings';
import CustomSelect from '../../../common/components/ui/CustomSelect';
import { ChatList } from '../../../features/chat/components/ChatList';
import { User } from '../../../types';

interface Course {
  id: string;
  name: string;
  schedule: {
    day: string;
    time: string;
  }[];
}

interface SchoolInfo {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  description?: string;
  [key: string]: any;
}

const SchoolAdmin: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'students' | 'instructors' | 'schedule' | 'messages' | 'settings'>('profile');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  // Debug logs for school info
  useEffect(() => {
    if (schoolInfo && activeTab === 'students') {
      console.log('SchoolAdmin - Using school info:', {
        schoolInfoId: schoolInfo.id,
        currentUserId: currentUser?.uid,
        schoolInfo: schoolInfo
      });
    }
  }, [schoolInfo, activeTab, currentUser?.uid]);

  // Fetch school information
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoading(true);
        
        // Fetch user document to get school ID
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          setError('Kullanıcı bilgileri bulunamadı.');
          setLoading(false);
          return;
        }
        
        const userData = userDoc.data();
        const userRole = userData.role;
        
        // Safely check if the user has the school role
        const isSchool = userRole 
          ? (Array.isArray(userRole) 
              ? userRole.includes('school') 
              : userRole === 'school')
          : false;
            
        if (!isSchool) {
          setError('Bu sayfaya erişim yetkiniz bulunmamaktadır. Yalnızca dans okulu hesapları için erişilebilir.');
          setLoading(false);
          return;
        }
        
        // If this is the user's school account
        if (userData.schoolId) {
          const schoolRef = doc(db, 'schools', userData.schoolId);
          const schoolDoc = await getDoc(schoolRef);
          
          if (schoolDoc.exists()) {
            const schoolData = schoolDoc.data();
            setSchoolInfo({
              id: schoolDoc.id,
              displayName: schoolData.displayName || 'İsimsiz Okul',
              ...schoolData
            });
          }
        } else {
          // If the user doc itself is for a school
          setSchoolInfo({
            id: userDoc.id,
            displayName: userData.displayName || 'İsimsiz Okul',
            ...userData
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Okul bilgileri yüklenirken hata:', err);
        setError('Okul bilgileri yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };
    
    fetchSchoolInfo();
  }, [currentUser]);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!schoolInfo?.id) return;

      try {
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, where('schoolId', '==', schoolInfo.id));
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
      }
    };

    if (activeTab === 'schedule') {
      fetchCourses();
    }
  }, [activeTab, schoolInfo?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Hata</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
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
          Dans Okulu Yönetim Paneli
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Kurslarınızı, öğrencilerinizi, eğitmenlerinizi ve ders programınızı profesyonelce yönetin.
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Okul Profili
            </button>
            <button
              onClick={() => setActiveTab('instructors')}
              className={`py-3 px-4 text-center font-medium text-sm border-b-2 flex items-center ${
                activeTab === 'instructors'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Eğitmenler
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
              Okul Profili
            </button>
            <button
              onClick={() => setActiveTab('instructors')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'instructors'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Eğitmenler
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'courses'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kurslar
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'students'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Öğrenciler
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'schedule'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Program
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'messages'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mesajlar
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ayarlar
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'profile' && schoolInfo && (
            <SchoolSettings schoolInfo={schoolInfo} />
          )}

          {activeTab === 'instructors' && schoolInfo && (
            <InstructorManagement schoolInfo={schoolInfo} />
          )}

          {activeTab === 'courses' && schoolInfo && (
            <CourseManagement 
              schoolId={schoolInfo.id}
              isAdmin={false}
            />
          )}

          {activeTab === 'students' && schoolInfo && (
            <div>
              <StudentManagement 
                schoolInfo={schoolInfo}
              />
            </div>
          )}

          {activeTab === 'messages' && (
            <ChatList />
          )}

          {activeTab === 'settings' && schoolInfo && (
            <SchoolSettings schoolInfo={schoolInfo} />
          )}

          {activeTab === 'schedule' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Ders Programı</h2>
                  <p className="text-sm text-gray-600 mt-1">Okulunuzun haftalık ders programını görüntüleyin</p>
                </div>
                <div className="w-full sm:w-64 mt-4 sm:mt-0 block sm:hidden">
                  <CustomSelect
                    name="selectedDay"
                    label="Gün Seçin"
                    value={selectedDay}
                    onChange={(value: string | string[]) => {
                      if (typeof value === 'string') {
                        setSelectedDay(value);
                        const element = document.getElementById(`day-${value}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                      }
                    }}
                    options={[
                      { value: 'Pazartesi', label: 'Pazartesi' },
                      { value: 'Salı', label: 'Salı' },
                      { value: 'Çarşamba', label: 'Çarşamba' },
                      { value: 'Perşembe', label: 'Perşembe' },
                      { value: 'Cuma', label: 'Cuma' },
                      { value: 'Cumartesi', label: 'Cumartesi' },
                      { value: 'Pazar', label: 'Pazar' }
                    ]}
                    fullWidth
                    allowEmpty
                  />
                </div>
              </div>

              {/* Kurs listesi */}
              {courses.length > 0 ? (
                <div className="relative">
                  <div className="overflow-x-auto sm:overflow-x-visible">
                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-4 sm:min-w-0">
                      {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map((day) => (
                        <div 
                          key={day} 
                          id={`day-${day}`}
                          onClick={() => setSelectedDay(day === selectedDay ? '' : day)}
                          className={`bg-white rounded-lg shadow-sm border p-3 min-h-[100px] sm:min-h-[200px] cursor-pointer hover:border-indigo-300 hover:ring-1 hover:ring-indigo-300 transition-all ${
                            selectedDay === day 
                              ? 'border-indigo-300 ring-1 ring-indigo-300' 
                              : 'border-gray-200'
                          } ${
                            selectedDay && selectedDay !== day ? 'sm:block hidden' : ''
                          }`}
                        >
                          <div className="text-center font-medium py-2 rounded-md mb-3 bg-gray-50 text-gray-700">
                            {day}
                          </div>
                          
                          <div className="space-y-2">
                            {courses
                              .filter(course => course.schedule.some(s => s.day === day))
                              .map(course => (
                                <div 
                                  key={course.id} 
                                  className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-md transition-colors duration-200"
                                >
                                  <div className="font-medium text-indigo-700 truncate mb-1">{course.name}</div>
                                  {course.schedule
                                    .filter(s => s.day === day)
                                    .map((schedule, index) => (
                                      <div key={index} className="flex items-center text-gray-600 text-sm">
                                        <svg className="w-4 h-4 mr-1.5 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="truncate">{schedule.time}</span>
                                      </div>
                                    ))}
                                </div>
                              ))}
                            {courses.filter(course => course.schedule.some(s => s.day === day)).length === 0 && (
                              <div className="text-center text-gray-500 text-sm py-4">
                                Bu güne ait ders bulunmuyor
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz Kurs Bulunmuyor</h3>
                  <p className="text-gray-500 mb-4">
                    Yeni bir kurs eklemek için "Kurslar" sekmesini kullanabilirsiniz.
                  </p>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Yeni Kurs Ekle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <h2 className="font-semibold text-blue-800">Dans Okulu İpuçları</h2>
        <ul className="mt-2 space-y-2 text-sm text-blue-700">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Eğitmenlerinizin ve öğrencilerinizin profillerini düzenli olarak güncelleyin.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Kurs programını öğrenci ve eğitmen uygunluğuna göre optimize edin.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Öğrenci ve eğitmen geri bildirimlerini düzenli olarak takip edin.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Dans etkinliklerini ve özel dersleri önceden planlayın.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Okulunuzun sosyal medya ve tanıtım faaliyetlerini güncel tutun.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SchoolAdmin; 