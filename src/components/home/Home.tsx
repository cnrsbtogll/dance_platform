import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types';

interface HomeProps {
  isAuthenticated: boolean;
  user?: User | null;
}

function Home({ isAuthenticated, user }: HomeProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">Dans Platformuna Hoş Geldiniz</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Partner Bul Card */}
        <Link to="/partners" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Partner Bul</h2>
            <p className="text-gray-600">Dans etmek için uygun partnerleri bulun ve iletişime geçin.</p>
          </div>
        </Link>

        {/* Dans Kursu Bul Card */}
        <Link to="/classes" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Dans Kursu Bul</h2>
            <p className="text-gray-600">Size uygun dans kurslarını keşfedin ve dans eğitiminizi geliştirin.</p>
          </div>
        </Link>

        {/* İlerleme Durumum Card */}
        <Link to="/progress" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="p-6">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">İlerleme Durumum</h2>
            <p className="text-gray-600">Dans eğitiminizdeki ilerlemenizi takip edin ve rozetlerinizi görüntüleyin.</p>
          </div>
        </Link>

        {/* Dans Okulu Yönetim Paneli Card - Conditionally shown based on user role */}
        {isAuthenticated && user?.role?.includes('school_admin') && (
          <Link to="/school-admin" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Dans Okulu Yönetim Paneli</h2>
              <p className="text-gray-600">Dans okulunuzun kurslarını, eğitmenlerini ve öğrencilerini yönetin.</p>
            </div>
          </Link>
        )}

        {/* Eğitmen Yönetim Paneli Card - Conditionally shown based on user role */}
        {isAuthenticated && user?.role?.includes('instructor') && (
          <Link to="/instructor" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Eğitmen Yönetim Paneli</h2>
              <p className="text-gray-600">Kurslarınızı, öğrencilerinizi ve ders programınızı yönetin.</p>
            </div>
          </Link>
        )}

        {/* Süper Admin Yönetim Paneli Card - Conditionally shown based on user role */}
        {isAuthenticated && user?.role?.includes('admin') && (
          <Link to="/admin" className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Süper Admin Yönetim Paneli</h2>
              <p className="text-gray-600">Platformun tamamını yönetin, kullanıcıları ve ayarları kontrol edin.</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Home; 