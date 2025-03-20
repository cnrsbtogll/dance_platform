import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Instructor, UserWithProfile, DanceClass, DanceSchool } from '../../types';
import { motion } from 'framer-motion';
import { fetchAllInstructors } from '../../api/services/userService';
import InstructorCard from '../../common/components/instructors/InstructorCard';
import { getFeaturedDanceCourses } from '../../api/services/courseService';
import { getFeaturedDanceSchools } from '../../api/services/schoolService';
import { generateInitialsAvatar } from '../../common/utils/imageUtils';

interface HomePageProps {
  isAuthenticated: boolean;
  user?: User | null;
}

// Birleştirilmiş eğitmen verisi için tip tanımı
interface InstructorWithUser extends Instructor {
  user: UserWithProfile;
}

function HomePage({ isAuthenticated, user }: HomePageProps) {
  const hasInstructorRole = user?.role?.includes('instructor');
  const hasSchoolAdminRole = user?.role?.includes('school_admin');
  const hasSuperAdminRole = user?.role?.includes('admin');
  
  // Eğitmen verilerini saklamak için state tanımlayalım
  const [instructors, setInstructors] = useState<InstructorWithUser[]>([]);
  const [classes, setClasses] = useState<DanceClass[]>([]);
  const [schools, setSchools] = useState<DanceSchool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Component yüklendiğinde verileri çekelim
  useEffect(() => {
    const loadData = async () => {
      // Yükleme durumunu başlat
      setLoading(true);
      setError(null);
      
      try {
        // 1. Önce eğitmenleri çek
        const fetchedInstructors = await fetchAllInstructors();
        console.log("Tüm eğitmenler:", fetchedInstructors);
        
        // Eğitmenleri tecrübeye göre sıralayalım (yüksekten düşüğe)
        const sortedInstructors = [...fetchedInstructors].sort((a, b) => {
          const experienceA = a.experience || a.tecrube || 0;
          const experienceB = b.experience || b.tecrube || 0;
          return Number(experienceB) - Number(experienceA);
        });

        // Eğitmenleri set et
        setInstructors(sortedInstructors);
      } catch (instructorError) {
        console.error('Eğitmenler yüklenirken hata:', instructorError);
        setInstructors([]);
      }
      
      try {  
        // 2. Dans kurslarını çek
        const featuredClasses = await getFeaturedDanceCourses();
        console.log("Öne çıkan dans kursları:", featuredClasses);
        setClasses(featuredClasses);
      } catch (classError) {
        console.error('Dans kursları yüklenirken hata:', classError);
        setClasses([]);
      }
      
      try {
        // 3. Dans okullarını çek
        const featuredSchools = await getFeaturedDanceSchools();
        console.log("Öne çıkan dans okulları:", featuredSchools);
        setSchools(featuredSchools);
      } catch (schoolError) {
        console.error('Dans okulları yüklenirken hata:', schoolError);
        setSchools([]);
      }
      
      // Her durumda yüklemeyi tamamla
      setLoading(false);
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white">
      {/* Hero Section */}
      <div className="container mx-auto pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 inline-block relative bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dans Platformuna Hoş Geldiniz
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Dans tutkunuzu geliştirin, yeni partnerler bulun ve yeteneklerinizi sergileyin. Dansın her adımında yanınızdayız.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/partners" 
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Partner Bul
            </Link>
            <Link 
              to="/courses" 
              className="inline-flex items-center justify-center rounded-md bg-white border border-indigo-200 px-6 py-3 text-base font-medium text-indigo-600 shadow-md hover:bg-indigo-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Dans Kursu Bul
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Instructors Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Öne Çıkan Eğitmenler</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Uzman eğitmenlerimizle dans becerilerinizi geliştirin ve profesyonel teknikler öğrenin.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-gray-600">Eğitmenler yükleniyor...</span>
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-8 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Henüz eğitmen bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {instructors.slice(0, 4).map((instructor, index) => (
              <InstructorCard
                key={instructor.id}
                instructor={instructor}
                index={index}
              />
            ))}
          </div>
        )}
        
        {instructors.length > 0 && (
          <div className="text-center mt-8">
            <Link 
              to="/instructors"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Tüm Eğitmenleri Keşfet
            </Link>
          </div>
        )}
      </div>

      {/* Featured Dance Classes */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Öne Çıkan Dans Kursları</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            En popüler dans kurslarımızı keşfedin ve dans yolculuğunuza hemen başlayın.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-gray-600">Dans kursları yükleniyor...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-8 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Henüz dans kursu bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {classes.map((danceClass) => (
              <Link
                key={danceClass.id}
                to={`/courses/${danceClass.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <img
                    src={danceClass.imageUrl || `/assets/images/dance/class${Math.floor(Math.random() * 4) + 1}.jpg`}
                    alt={danceClass.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-2 py-1 m-2 rounded">
                    {danceClass.level || 'Tüm Seviyeler'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{danceClass.name}</h3>
                  <p className="text-indigo-600 font-medium mb-2">{danceClass.danceStyle || 'Çeşitli'}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-bold">{danceClass.price || '?'} {danceClass.currency || 'TRY'}</span>
                    <span className="text-gray-500 text-sm">{danceClass.duration || 60} dk</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="text-center mt-8">
          <Link 
            to="/courses"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Tüm Kursları Keşfet
          </Link>
        </div>
      </div>

      {/* Featured Dance Schools */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Öne Çıkan Dans Okulları</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Türkiye'nin her yerindeki kaliteli dans okullarını keşfedin ve size uygun olanı bulun.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-gray-600">Dans okulları yükleniyor...</span>
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-8 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Henüz dans okulu bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {schools.map((school) => (
              <Link
                key={school.id}
                to={`/schools/${school.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  <img
                    src={school.gorsel || school.logo || school.images?.[0] || generateInitialsAvatar(school.name, 'school')}
                    alt={school.name}
                    className="w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = generateInitialsAvatar(school.name, 'school');
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{school.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {school.aciklama || school.description || 'Bu dans okulu hakkında detaylı bilgi bulunmamaktadır.'}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {school.konum || school.address?.city || 'İstanbul'}, {school.ulke || school.address?.country || 'Türkiye'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="text-center mt-8">
          <Link 
            to="/schools"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Tüm Dans Okullarını Keşfet
          </Link>
        </div>
      </div>

      {/* Call to Action */}
      {!isAuthenticated && (
        <div className="bg-indigo-700 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Dans Topluluğumuza Katılın</h2>
              <p className="text-indigo-200 mb-8">
                Hemen kayıt olun ve dans dünyasının tüm avantajlarından yararlanmaya başlayın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/signup" 
                  className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-medium text-indigo-700 shadow-md hover:bg-indigo-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-700"
                >
                  Ücretsiz Kayıt Ol
                </Link>
                <Link 
                  to="/signin" 
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 border border-white px-6 py-3 text-base font-medium text-white hover:bg-indigo-800 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-700"
                >
                  Giriş Yap
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage; 