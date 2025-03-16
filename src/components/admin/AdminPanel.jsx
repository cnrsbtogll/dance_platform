// src/components/admin/AdminPanel.jsx
import React, { useState } from 'react';
import SchoolManagement from './SchoolManagement';
import InstructorManagement from './InstructorManagement';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('okullar');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Yönetim Paneli</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('okullar')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'okullar'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dans Okulları
            </button>
            <button
              onClick={() => setActiveTab('egitmenler')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'egitmenler'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Eğitmenler
            </button>
            <button
              onClick={() => setActiveTab('kurslar')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'kurslar'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kurslar
            </button>
            <button
              onClick={() => setActiveTab('kullanicilar')}
              className={`py-4 px-6 text-center font-medium text-sm md:text-base border-b-2 ${
                activeTab === 'kullanicilar'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kullanıcılar
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'okullar' && <SchoolManagement />}
          {activeTab === 'egitmenler' && <InstructorManagement />}
          {activeTab === 'kurslar' && (
            <div className="text-center py-4">
              <h2 className="text-xl font-semibold">Kurs Yönetimi</h2>
              <p className="text-gray-500 mt-2">Bu bölüm henüz yapım aşamasındadır.</p>
            </div>
          )}
          {activeTab === 'kullanicilar' && (
            <div className="text-center py-4">
              <h2 className="text-xl font-semibold">Kullanıcı Yönetimi</h2>
              <p className="text-gray-500 mt-2">Bu bölüm henüz yapım aşamasındadır.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
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