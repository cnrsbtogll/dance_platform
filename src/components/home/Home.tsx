import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';

interface HomeProps {
  isAuthenticated: boolean;
  user?: User | null;
}

function Home({ isAuthenticated, user }: HomeProps) {
  const hasInstructorRole = user?.role?.includes('instructor');
  const hasSchoolAdminRole = user?.role?.includes('school_admin');
  const hasSuperAdminRole = user?.role?.includes('admin');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl">
        <div className="absolute inset-0">
          <svg className="absolute left-0 top-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path className="text-indigo-500/20 fill-current" d="M0,0 L1000,0 L1000,1000 L0,1000 Z" />
            <path className="text-white/5 fill-current" d="M0,0 C300,150 500,50 1000,250 L1000,1000 L0,1000 Z" />
            <path className="text-white/5 fill-current" d="M0,250 C300,350 700,250 1000,500 L1000,1000 L0,1000 Z" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Dans Platformuna <span className="block md:inline">Hoş Geldiniz</span>
          </h1>
          <p className="mt-6 max-w-xl text-xl text-indigo-100">
            Dans tutkunuzu geliştirin, yeni partnerler bulun ve yeteneklerinizi sergileyin. Dansın her adımında yanınızdayız.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link 
              to="/partners" 
              className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-medium text-indigo-700 shadow-md hover:bg-indigo-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Partner Bul
            </Link>
            <Link 
              to="/classes" 
              className="inline-flex items-center justify-center rounded-md bg-indigo-900/20 backdrop-blur-sm px-6 py-3 text-base font-medium text-white border border-white/20 hover:bg-indigo-900/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Dans Kursu Bul
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-12">Platformumuzun Özellikleri</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Partner Bul Card */}
          <Link 
            to="/partners" 
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
            <div className="p-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-200 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-indigo-600 transition-colors duration-300">Partner Bul</h3>
              <p className="text-gray-600">Dans etmek için uygun partnerleri bulun ve iletişime geçin. Dans yolculuğunuzda artık yalnız değilsiniz.</p>
            </div>
          </Link>

          {/* Dans Kursu Bul Card */}
          <Link 
            to="/classes" 
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
            <div className="p-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors duration-300">Dans Kursu Bul</h3>
              <p className="text-gray-600">Size uygun dans kurslarını keşfedin ve dans eğitiminizi geliştirin. En iyi eğitmenlerle dans yeteneklerinizi zirveye taşıyın.</p>
            </div>
          </Link>

          {/* İlerleme Durumum Card */}
          <Link 
            to="/progress" 
            className="group bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <div className="p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">İlerleme Durumum</h3>
              <p className="text-gray-600">Dans eğitiminizdeki ilerlemenizi takip edin ve rozetlerinizi görüntüleyin. Gelişiminizi adım adım izleyin.</p>
            </div>
          </Link>

          {/* Dans Okulu Yönetim Paneli Card - Conditionally shown based on user role */}
          {isAuthenticated && hasSchoolAdminRole && (
            <Link 
              to="/school-admin" 
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
              <div className="p-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-emerald-600 transition-colors duration-300">Dans Okulu Yönetim Paneli</h3>
                <p className="text-gray-600">Dans okulunuzun kurslarını, eğitmenlerini ve öğrencilerini profesyonel bir şekilde yönetin.</p>
              </div>
            </Link>
          )}

          {/* Eğitmen Yönetim Paneli veya Eğitmen Ol Card */}
          {isAuthenticated && !hasSuperAdminRole && (
            hasInstructorRole ? (
              <Link 
                to="/instructor" 
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600"></div>
                <div className="p-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-amber-200 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-amber-600 transition-colors duration-300">Eğitmen Yönetim Paneli</h3>
                  <p className="text-gray-600">Kurslarınızı, öğrencilerinizi ve ders programınızı kolayca planlayın ve yönetin.</p>
                </div>
              </Link>
            ) : (
              <Link 
                to="/become-instructor" 
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-rose-500 to-pink-600"></div>
                <div className="p-8">
                  <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-rose-200 transition-colors duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-rose-600 transition-colors duration-300">Eğitmen Ol</h3>
                  <p className="text-gray-600">Dans eğitmeni olarak platformumuza katılın ve öğrencilerinize dans öğretin. Bilginizi paylaşın, topluluğu büyütün.</p>
                </div>
              </Link>
            )
          )}

          {/* Süper Admin Yönetim Paneli Card - Conditionally shown based on user role */}
          {isAuthenticated && hasSuperAdminRole && (
            <Link 
              to="/admin" 
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-violet-500 to-purple-600"></div>
              <div className="p-8">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-violet-200 transition-colors duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3 group-hover:text-violet-600 transition-colors duration-300">Süper Admin Paneli</h3>
                <p className="text-gray-600">Platformun tamamını yönetin, kullanıcıları ve ayarları kontrol edin. Tam yetki ile sistemi optimize edin.</p>
              </div>
            </Link>
          )}
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