import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import SearchFilters from './SearchFilters';
import { DanceClass } from '../../types';
import CourseCard from '../classes/CourseCard';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface FilterValues {
  seviye: string;
  fiyatAralik: string;
  arama: string;
  dansTuru: string;
  gun: string;
}

const SearchPage: React.FC = () => {
  const [danceClasses, setDanceClasses] = useState<DanceClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<DanceClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({
    seviye: '',
    fiyatAralik: '',
    arama: '',
    dansTuru: '',
    gun: ''
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchDanceClasses = async () => {
      setLoading(true);
      try {
        const classesRef = collection(db, 'danceClasses');
        const q = query(classesRef, orderBy('createdAt', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        
        const fetchedClasses: DanceClass[] = [];
        querySnapshot.forEach((doc) => {
          fetchedClasses.push({
            id: doc.id,
            ...doc.data()
          } as DanceClass);
        });
        
        setDanceClasses(fetchedClasses);
        setFilteredClasses(fetchedClasses);
      } catch (err) {
        console.error('Error fetching dance classes:', err);
        setError('Kurslar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchDanceClasses();
  }, []);

  useEffect(() => {
    filterClasses(activeFilters);
  }, [activeFilters, danceClasses]);

  const handleFilterChange = (filters: FilterValues) => {
    setActiveFilters(filters);
  };

  const filterClasses = (filters: FilterValues) => {
    let result = [...danceClasses];

    // Dans türü filtreleme
    if (filters.dansTuru) {
      result = result.filter(
        (danceClass) => danceClass.danceStyle?.toLowerCase() === filters.dansTuru.toLowerCase()
      );
    }

    // Seviye filtreleme
    if (filters.seviye) {
      result = result.filter(
        (danceClass) => danceClass.level?.toLowerCase() === filters.seviye.toLowerCase()
      );
    }

    // Gün filtreleme
    if (filters.gun) {
      result = result.filter((danceClass) => {
        if (filters.gun === 'Hafta İçi') {
          return ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].some(
            (day) => danceClass.daysOfWeek?.includes(day)
          );
        } else if (filters.gun === 'Hafta Sonu') {
          return ['Cumartesi', 'Pazar'].some(
            (day) => danceClass.daysOfWeek?.includes(day)
          );
        } else {
          return danceClass.daysOfWeek?.includes(filters.gun);
        }
      });
    }

    // Fiyat aralığı filtreleme
    if (filters.fiyatAralik) {
      const [min, max] = filters.fiyatAralik.split('-').map(Number);
      result = result.filter(
        (danceClass) => {
          const price = Number(danceClass.price);
          return price >= min && price <= max;
        }
      );
    }

    // Arama filtreleme
    if (filters.arama) {
      const searchTerm = filters.arama.toLowerCase();
      result = result.filter(
        (danceClass) =>
          danceClass.name?.toLowerCase().includes(searchTerm) ||
          danceClass.description?.toLowerCase().includes(searchTerm) ||
          danceClass.instructorName?.toLowerCase().includes(searchTerm) ||
          danceClass.danceStyle?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredClasses(result);
  };

  // Aktif filtreleri temizle
  const clearFilter = (filterType: keyof FilterValues) => {
    setActiveFilters({
      ...activeFilters,
      [filterType]: ''
    });
  };

  // Tüm filtreleri temizle
  const clearAllFilters = () => {
    setActiveFilters({
      seviye: '',
      fiyatAralik: '',
      arama: '',
      dansTuru: '',
      gun: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header Section */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 sm:text-4xl">
              Dans Kursu Bul
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Türkiye'nin en kapsamlı dans kursu arama platformu
            </p>
          </div>

          {/* Search Filters */}
          <div className="mt-10">
            <SearchFilters onFilterChange={handleFilterChange} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Active Filters */}
        {Object.values(activeFilters).some(filter => filter !== '') && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Aktif filtreler:</span>
              
              {activeFilters.arama && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-indigo-100 text-indigo-700">
                  Arama: {activeFilters.arama}
                  <button
                    type="button"
                    onClick={() => clearFilter('arama')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 focus:outline-none"
                  >
                    <span className="sr-only">Aramayı kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {activeFilters.dansTuru && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-purple-100 text-purple-700">
                  Dans Türü: {activeFilters.dansTuru}
                  <button
                    type="button"
                    onClick={() => clearFilter('dansTuru')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-purple-400 hover:bg-purple-200 hover:text-purple-600 focus:outline-none"
                  >
                    <span className="sr-only">Dans türünü kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {activeFilters.seviye && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-blue-100 text-blue-700">
                  Seviye: {activeFilters.seviye}
                  <button
                    type="button"
                    onClick={() => clearFilter('seviye')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none"
                  >
                    <span className="sr-only">Seviyeyi kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {activeFilters.fiyatAralik && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-green-100 text-green-700">
                  Fiyat: {activeFilters.fiyatAralik.split('-')[0]} - {activeFilters.fiyatAralik.split('-')[1]} TL
                  <button
                    type="button"
                    onClick={() => clearFilter('fiyatAralik')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-green-400 hover:bg-green-200 hover:text-green-600 focus:outline-none"
                  >
                    <span className="sr-only">Fiyat aralığını kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {activeFilters.gun && (
                <span className="inline-flex rounded-full items-center py-1 pl-3 pr-1 text-sm font-medium bg-pink-100 text-pink-700">
                  Gün: {activeFilters.gun}
                  <button
                    type="button"
                    onClick={() => clearFilter('gun')}
                    className="flex-shrink-0 ml-1 h-5 w-5 rounded-full inline-flex items-center justify-center text-pink-400 hover:bg-pink-200 hover:text-pink-600 focus:outline-none"
                  >
                    <span className="sr-only">Günü kaldır</span>
                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Tüm filtreleri temizle
                <svg className="ml-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Results Count & Sort Options */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="text-sm text-gray-500 mb-4 sm:mb-0">
            {loading ? (
              <span>Kurslar yükleniyor...</span>
            ) : (
              <span>
                {filteredClasses.length} kurs bulundu
                {Object.values(activeFilters).some(filter => filter !== '') && ' (filtrelenmiş)'}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-2">Sırala:</span>
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              defaultValue="newest"
            >
              <option value="newest">En Yeni</option>
              <option value="oldest">En Eski</option>
              <option value="priceAsc">Fiyat (Artan)</option>
              <option value="priceDesc">Fiyat (Azalan)</option>
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Kurs bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">Arama kriterlerine uygun kurs bulunamadı. Filtreleri değiştirerek tekrar deneyebilirsiniz.</p>
            <div className="mt-6">
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Filtreleri temizle
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClasses.map((danceClass) => (
              <Link key={danceClass.id} to={`/classes/${danceClass.id}`}>
                <CourseCard
                  course={danceClass}
                  onEnroll={() => {}}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage; 