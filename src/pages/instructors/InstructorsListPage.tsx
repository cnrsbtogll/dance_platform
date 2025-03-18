import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllInstructors } from '../../api/services/userService';
import { Instructor, UserWithProfile } from '../../types';
import InstructorCard from '../../common/components/instructors/InstructorCard';

// Eğitmen ve kullanıcı bilgisini birleştiren tip tanımı
interface InstructorWithUser extends Instructor {
  user: UserWithProfile;
}

const InstructorsListPage: React.FC = () => {
  const [instructors, setInstructors] = useState<InstructorWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');

  useEffect(() => {
    const loadInstructors = async () => {
      try {
        setLoading(true);
        const fetchedInstructors = await fetchAllInstructors();
        
        // Eğitmenleri tecrübeye göre sıralayalım (yüksekten düşüğe)
        const sortedInstructors = [...fetchedInstructors].sort((a, b) => {
          const experienceA = a.experience || a.tecrube || 0;
          const experienceB = b.experience || b.tecrube || 0;
          return experienceB - experienceA;
        });
        
        setInstructors(sortedInstructors);
      } catch (err) {
        console.error('Eğitmenler yüklenirken hata oluştu:', err);
        setError('Eğitmen bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    loadInstructors();
  }, []);

  // Search ve filtreleme işlemleri
  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch = searchTerm === '' || 
      (instructor.user.displayName && instructor.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStyle = selectedStyle === '' || 
      (instructor.uzmanlık && instructor.uzmanlık.includes(selectedStyle as any)) ||
      (instructor.specialties && instructor.specialties.includes(selectedStyle as any)) ||
      (instructor.user.danceStyles && instructor.user.danceStyles.includes(selectedStyle as any));
    
    return matchesSearch && matchesStyle;
  });

  // Tüm dans stilleri
  const allDanceStyles = Array.from(new Set(
    instructors.flatMap(instructor => [
      ...(Array.isArray(instructor.uzmanlık) ? instructor.uzmanlık : (instructor.uzmanlık ? [instructor.uzmanlık] : [])),
      ...(Array.isArray(instructor.specialties) ? instructor.specialties : (instructor.specialties ? [instructor.specialties] : [])),
      ...(Array.isArray(instructor.user.danceStyles) ? instructor.user.danceStyles : [])
    ])
  ));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-600">Eğitmenler yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-indigo-500 text-white py-2 px-4 rounded hover:bg-indigo-600 transition"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-500 flex items-center">
        <Link to="/" className="hover:text-indigo-600">Anasayfa</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Eğitmenler</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dans Eğitmenlerimiz</h1>
      
      {/* Filtreleme ve Arama */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
        <div className="md:flex justify-between">
          <div className="mb-4 md:mb-0 md:w-1/3">
            <label htmlFor="search" className="block text-gray-700 text-sm font-medium mb-2">Eğitmen Ara</label>
            <input
              type="text"
              id="search"
              placeholder="Eğitmen adı ara..."
              className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="md:w-1/3">
            <label htmlFor="danceStyle" className="block text-gray-700 text-sm font-medium mb-2">Dans Stiline Göre Filtrele</label>
            <select
              id="danceStyle"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
            >
              <option value="">Tüm Dans Stilleri</option>
              {allDanceStyles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredInstructors.length === 0 ? (
        <div className="bg-gray-50 p-10 rounded-lg text-center">
          <p className="text-gray-500">Aradığınız kriterlere uygun eğitmen bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredInstructors.map((instructor, index) => (
            <InstructorCard
              key={instructor.id}
              instructor={instructor}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorsListPage; 