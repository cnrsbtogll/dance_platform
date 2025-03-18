import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Instructor, UserWithProfile } from '../../types';
import { motion } from 'framer-motion';
import { fetchAllInstructors } from '../../services/userService';

interface HomeProps {
  isAuthenticated: boolean;
  user?: User | null;
}

// Birleştirilmiş eğitmen verisi için tip tanımı
interface InstructorWithUser extends Instructor {
  user: UserWithProfile;
}

function Home({ isAuthenticated, user }: HomeProps) {
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors duration-300">
                    {instructor.user.displayName || "İsimsiz Eğitmen"}
                  </h3>
                  <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                    {(() => {
                      const instructorAny = instructor as any;
                      // Veri yapısını görmek için konsola yazdıralım
                      console.log("Instructor uzmanlık verisi:", instructor.id, instructorAny.uzmanlık);
                      
                      // Önce uzmanlık alanını kontrol edelim (Türkçe)
                      if (instructorAny.uzmanlık && Array.isArray(instructorAny.uzmanlık) && instructorAny.uzmanlık.length > 0) {
                        return instructorAny.uzmanlık.join(', ');
                      }
                      // Sonra specialties alanını kontrol edelim (İngilizce)
                      else if (instructor.specialties && Array.isArray(instructor.specialties) && instructor.specialties.length > 0) {
                        return instructor.specialties.join(', ');
                      }
                      // Eğer uzmanlık bir string ise direkt kullanalım
                      else if (typeof instructorAny.uzmanlık === 'string' && instructorAny.uzmanlık) {
                        return instructorAny.uzmanlık;
                      }
                      // Hiçbiri yoksa
                      return "Dans";
                    })()}
                  </span>
                  <p className="text-gray-500 text-xs mt-2">
                    {(() => {
                      // TypeScript hatalarından kaçınmak için any tipini kullanıyoruz
                      const instructorAny = instructor as any;
                      // Veri yapısını görmek için konsola yazdıralım
                      console.log("Instructor tecrübe verisi:", instructor.id, instructorAny.tecrube);
                      
                      // Önce tecrube alanını kontrol edelim (Türkçe alan adı)
                      if (instructorAny.tecrube !== undefined && instructorAny.tecrube !== null) {
                        return `${instructorAny.tecrube} yıl tecrübe`;
                      }
                      // Sonra experience alanını kontrol edelim
                      else if (instructor.experience !== undefined && instructor.experience !== null) {
                        return `${instructor.experience} yıl tecrübe`;
                      }
                      // Hiçbiri yoksa varsayılan metin
                      return "Tecrübeli Eğitmen";
                    })()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="text-center mt-8">
          <Link 
            to="/instructors" 
            className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
          >
            Tüm Eğitmenleri Gör
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
      
      {/* Dance Schools Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-10">Dans Okulları</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* We'll map through dance schools data in the future. This is a static placeholder for now */}
          {[1, 2, 3].map((index) => (
            <Link 
              key={index}
              to="/schools" 
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img 
                  src={`/assets/images/dance/okul${index}.jpg`} 
                  alt="Dans Okulu" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                  {index === 1 ? "Salsa Ankara Dans Akademi" : index === 2 ? "La Dans Akademi" : "Güney Gümüş Dans Akademi"}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {index === 1 ? "Çankaya, Ankara" : index === 2 ? "Kadıköy, İstanbul" : "Muratpaşa, Antalya"}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                    {index === 1 ? "Salsa, Kizomba" : index === 2 ? "Bachata, Salsa" : "Salsa, Bachata, Kizomba"}
                  </span>
                  <span className="text-sm text-gray-500">Detaylar &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Link 
            to="/schools" 
            className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
          >
            Tüm Dans Okullarını Gör
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
      
      {/* Call to Action Section */}
      <div className="bg-indigo-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Dans Etmeye Hazır mısınız?</h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-2xl mx-auto">
            Hemen şimdi platformumuza katılın ve dans dünyasına adım atın. Sizi dans tutkunları topluluğumuza katılmaya davet ediyoruz.
          </p>
          {!isAuthenticated && (
            <Link 
              to="/signin" 
              className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-medium text-indigo-700 shadow-md hover:bg-indigo-50 transition-all duration-300"
            >
              Hemen Başla
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home; 