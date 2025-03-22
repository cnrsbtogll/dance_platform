import React, { useState, FormEvent } from 'react';
import { User } from '../../../types';
import { motion } from 'framer-motion';
import InstructorProfileForm from '../components/InstructorProfileForm';
import CourseManagement from '../../../features/shared/components/courses/CourseManagement';
import { query, where, orderBy } from 'firebase/firestore';
import { usersRef } from '../../../firebase/firebaseConfig';
import { currentUser } from '../../../firebase/firebaseConfig';
import { StudentManagement } from '../../../features/shared/components/students/StudentManagement';

interface InstructorPanelProps {
  user?: User | null;
}

function InstructorPanel({ user }: InstructorPanelProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'students' | 'schedule'>('profile');

  // Kullanıcı bilgilerini logla
  console.log('InstructorPanel - user:', user);

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
        <div className="border-b">
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
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <InstructorProfileForm user={user} />
          )}

          {activeTab === 'courses' && (
            <CourseManagement instructorId={user.id} />
          )}

          {activeTab === 'students' && (
            <StudentManagement isAdmin={false} />
          )}

          {activeTab === 'schedule' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ders Programım</h2>
              </div>

              <p className="text-gray-600 mb-4">Haftalık ders programınız burada gösterilecektir.</p>

              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Oluşturduğunuz kurslar programınızda otomatik olarak görüntülenecektir.</p>
                <p className="text-sm text-gray-500 mt-2">Yeni bir kurs eklemek için "Kurslarım" sekmesini kullanın.</p>
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