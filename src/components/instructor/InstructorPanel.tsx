import React, { useState } from 'react';
import { User } from '../../types';

interface InstructorPanelProps {
  user?: User | null;
}

function InstructorPanel({ user }: InstructorPanelProps) {
  const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'schedule'>('courses');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Eğitmen Yönetim Paneli</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b">
          <nav className="flex -mb-px">
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
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'courses' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Kurslarım</h2>
              <p className="text-gray-600 mb-4">Yönettiğiniz dans kursları burada listelenecektir.</p>
              
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <p className="text-gray-500">Henüz kursu bulunmuyor.</p>
                <button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded">
                  Yeni Kurs Ekle
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'students' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Öğrencilerim</h2>
              <p className="text-gray-600 mb-4">Kurslarınıza kayıtlı olan öğrenciler burada listelenecektir.</p>
              
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500">Henüz öğrenciniz bulunmuyor.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'schedule' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Ders Programım</h2>
              <p className="text-gray-600 mb-4">Haftalık ders programınız burada gösterilecektir.</p>
              
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Henüz programlanmış ders bulunmuyor.</p>
                <button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded">
                  Ders Planla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 rounded-lg p-4">
        <h2 className="font-semibold text-blue-800">Eğitmen İpuçları</h2>
        <ul className="mt-2 space-y-2 text-sm text-blue-700">
          <li>• Düzenli olarak kurs içeriğinizi güncelleyerek öğrencilerinizin ilgisini canlı tutun.</li>
          <li>• Öğrencilerinizin ilerleme durumlarını takip ederek kişiselleştirilmiş geri bildirimler verin.</li>
          <li>• Ders programınızı önceden planlayarak öğrencilerinize duyurun.</li>
          <li>• Dans videolarınızı paylaşarak öğrencilerinizin ders dışında da çalışmalarını sağlayın.</li>
        </ul>
      </div>
    </div>
  );
}

export default InstructorPanel; 