import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Instructor, UserWithProfile } from '../../types';
import { motion } from 'framer-motion';
import { fetchAllInstructors } from '../../api/services/userService';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Component yüklendiğinde eğitmen verilerini çekelim
  useEffect(() => {
    const getInstructors = async () => {
      try {
        setLoading(true);
        const fetchedInstructors = await fetchAllInstructors();
        console.log("Tüm eğitmenler:", fetchedInstructors);
        
        // Eğitmenleri tecrübeye göre sıralayalım (yüksekten düşüğe)
        const sortedInstructors = [...fetchedInstructors].sort((a, b) => {
          const instructorA = a as any;
          const instructorB = b as any;
          
          // Türkçe (tecrube) veya İngilizce (experience) alanını kontrol edelim
          const experienceA = instructorA.tecrube !== undefined && instructorA.tecrube !== null
            ? Number(instructorA.tecrube)
            : a.experience !== undefined && a.experience !== null
              ? Number(a.experience)
              : 0;
          
          const experienceB = instructorB.tecrube !== undefined && instructorB.tecrube !== null
            ? Number(instructorB.tecrube)
            : b.experience !== undefined && b.experience !== null
              ? Number(b.experience)
              : 0;
          
          // Tecrübesi yüksek olan önce gelsin (azalan sıralama)
          return experienceB - experienceA;
        });
        
        setInstructors(sortedInstructors);
      } catch (err) {
        console.error('Eğitmenler yüklenirken hata oluştu:', err);
        setError('Eğitmen bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    getInstructors();
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
              to="/search" 
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Eğitmenlerimiz</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-gray-600">Eğitmenler yükleniyor...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-red-50 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Tekrar Dene
            </button>
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Henüz eğitmen bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {instructors.slice(0, 4).map((instructor, index) => (
              <Link 
                key={instructor.id}
                to="/instructors" 
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="h-64 bg-gray-200 relative overflow-hidden">
                  <img 
                    src={instructor.user.photoURL || `/assets/images/dance/egitmen${index + 1}.jpg`} 
                    alt={instructor.user.displayName || "Eğitmen"} 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    style={{ objectPosition: 'center top' }}
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {instructor.user.displayName || "Eğitmen"}
                  </h3>
                  <p className="text-indigo-600 font-medium mb-1">
                    Dans Eğitmeni
                  </p>
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-400 mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
                    <span className="text-gray-600">4.9</span>
                    <span className="text-gray-400 text-sm ml-1">(27 değerlendirme)</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p><span className="font-medium">Tecrübe:</span> {instructor.experience || instructor.tecrube || 0} yıl</p>
                    <p><span className="font-medium">Uzmanlık:</span> {instructor.uzmanlık || "Çeşitli Dans Stilleri"}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {instructors.length > 0 && (
          <div className="text-center mt-8">
            <Link 
              to="/instructors"
              className="inline-block py-2 px-4 rounded border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors duration-300"
            >
              Tüm Eğitmenleri Gör
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
        
        {/* Class cards would go here */}
        <div className="mt-8 text-center">
          <Link 
            to="/classes"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Tüm Kursları Keşfet
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

      {/* Admin/Instructor Quick Access */}
      {isAuthenticated && (user?.role?.length ?? 0) > 0 && (
        <div className="bg-gray-100 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Hızlı Erişim</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hasInstructorRole && (
                  <Link 
                    to="/instructor" 
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Eğitmen Paneli</h3>
                    <p className="text-gray-600 mb-2">Kurslarınızı ve öğrencilerinizi yönetin.</p>
                    <span className="text-indigo-600 inline-flex items-center">
                      Panele Git
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </Link>
                )}
                
                {hasSchoolAdminRole && (
                  <Link 
                    to="/school-admin" 
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Okul Yönetimi</h3>
                    <p className="text-gray-600 mb-2">Dans okulunuzun bilgilerini düzenleyin.</p>
                    <span className="text-indigo-600 inline-flex items-center">
                      Yönetime Git
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </Link>
                )}
                
                {hasSuperAdminRole && (
                  <Link 
                    to="/admin" 
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Admin Paneli</h3>
                    <p className="text-gray-600 mb-2">Platform ayarlarını yapılandırın.</p>
                    <span className="text-indigo-600 inline-flex items-center">
                      Panele Git
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage; 