import React, { useState, useEffect } from 'react';
import SchoolManagement from './SchoolManagement';
import InstructorManagement from './InstructorManagement';
import InstructorRequests from './InstructorRequests';
import DanceStyleManagement from './DanceStyleManagement';
import { StudentManagement } from './StudentManagement';
import SeedUsersButton from '../../scripts/SeedUsersButton';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { User } from '../../types';
import { motion } from 'framer-motion';

type TabType = 'okullar' | 'egitmenler' | 'egitmen-talepleri' | 'kurslar' | 'ogrenciler' | 'dans-stilleri' | 'ornek-veri' | 'okul-basvurulari';

interface AdminPanelProps {
  user?: User | null;
}

function AdminPanel({ user }: AdminPanelProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('okullar');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  
  // Check if the current user should be promoted to super admin
  useEffect(() => {
    const checkAndUpdateSuperAdmin = async () => {
      if (user?.id === 'HyH991wAtrU2E6JlTt711A6zHoL2' && user.email === 'super@admin.com') {
        // Check if the user already has the 'admin' role
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          let roles = userData.role || [];
          
          if (!Array.isArray(roles)) {
            roles = [roles];
          }
          
          if (!roles.includes('admin')) {
            // Add the 'admin' role to the user
            roles.push('admin');
            await updateDoc(userRef, { role: roles });
            console.log('Super admin role added to user');
          }
          
          setIsSuperAdmin(true);
        }
      } else if (user?.role?.includes('admin')) {
        setIsSuperAdmin(true);
      }
    };
    
    if (user) {
      checkAndUpdateSuperAdmin();
    }
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 inline-block relative bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Yönetim Paneli
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Dans okulları, eğitmenler ve dans stilleri gibi sistem genelindeki içerikleri yönetin ve platformu kontrol edin.
        </p>
      </motion.div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b overflow-x-auto">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('okullar')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${
                activeTab === 'okullar'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dans Okulları
            </button>
            <button
              onClick={() => setActiveTab('egitmenler')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${
                activeTab === 'egitmenler'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Eğitmenler
            </button>
            <button
              onClick={() => setActiveTab('ogrenciler')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${
                activeTab === 'ogrenciler'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Öğrenciler
            </button>
            <button
              onClick={() => setActiveTab('kurslar')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${
                activeTab === 'kurslar'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kurslar
            </button>
            <button
              onClick={() => setActiveTab('egitmen-talepleri')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${
                activeTab === 'egitmen-talepleri'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Eğitmenlik Başvuruları
            </button>
            <button
              onClick={() => setActiveTab('okul-basvurulari')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${
                activeTab === 'okul-basvurulari'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Okul Başvuruları
            </button>
            <button
              onClick={() => setActiveTab('dans-stilleri')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${
                activeTab === 'dans-stilleri'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dans Stilleri
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('ornek-veri')}
                className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 whitespace-nowrap ${
                  activeTab === 'ornek-veri'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Örnek Veri
              </button>
            )}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'okullar' && <SchoolManagement />}
          {activeTab === 'egitmenler' && <InstructorManagement />}
          {activeTab === 'ogrenciler' && <StudentManagement />}
          {activeTab === 'kurslar' && (
            <div className="text-center py-4">
              <h2 className="text-xl font-semibold">Kurs Yönetimi</h2>
              <p className="text-gray-500 mt-2">Bu bölüm henüz yapım aşamasındadır.</p>
            </div>
          )}
          {activeTab === 'egitmen-talepleri' && <InstructorRequests />}
          {activeTab === 'okul-basvurulari' && (
            <div className="text-center py-4">
              <h2 className="text-xl font-semibold">Okul Başvuru Yönetimi</h2>
              <p className="text-gray-500 mt-2">Bu bölüm henüz yapım aşamasındadır.</p>
            </div>
          )}
          {activeTab === 'dans-stilleri' && <DanceStyleManagement />}
          {activeTab === 'ornek-veri' && isSuperAdmin && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Örnek Veri Ekleme</h2>
              <p className="mb-4 text-gray-700">
                Bu panel ile veritabanına örnek kullanıcılar ekleyebilirsiniz. Eklenen kullanıcılar dans partneri eşleştirme 
                sistemi için kullanılabilir. Her bir örnek kullanıcı çeşitli dans stilleri, seviyeler, boy, kilo ve konum 
                bilgileri içerir.
              </p>
              <SeedUsersButton />
            </div>
          )}
        </div>
      </div>
      
      {isSuperAdmin && (
        <div className="mt-8 bg-purple-50 rounded-lg p-4">
          <h2 className="font-semibold text-purple-800">Süper Admin Yetkileri</h2>
          <p className="mt-2 text-sm text-purple-700">
            Süper admin olarak, tüm dans okullarını, eğitmenleri, kursları ve kullanıcıları yönetebilirsiniz. 
            Eğitmen başvurularını onaylayabilir veya reddedebilirsiniz. Dans stillerini de yönetebilirsiniz.
          </p>
        </div>
      )}
      
      <div className="mt-4 bg-blue-50 rounded-lg p-4">
        <h2 className="font-semibold text-blue-800">Yönetici İpuçları</h2>
        <ul className="mt-2 space-y-2 text-sm text-blue-700">
          <li>• Dans okulu ve eğitmen bilgilerinizi güncel tutmak müşteri güvenini artırır.</li>
          <li>• Kurs programınızı düzenli olarak güncelleyerek yeni öğrencilerin ilgisini çekin.</li>
          <li>• Eğitmenlerin profillerinde detaylı bilgiler sunarak deneyimlerini vurgulayın.</li>
          <li>• Kurslarınıza yüksek kaliteli fotoğraflar eklemek kayıt oranlarını artırabilir.</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminPanel; 