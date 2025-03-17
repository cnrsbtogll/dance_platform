import React, { useState, useEffect } from 'react';
import ClassCard from './ClassCard';
import { dansKurslari } from '../../data/dansVerileri';
import SearchFilters from '../search/SearchFilters';
import { motion } from 'framer-motion';

// Tip tanımlamaları
interface Kurs {
  id: number;
  baslik: string;
  aciklama: string;
  seviye: string;
  fiyat: string;
  egitmen_id: number;
  okul_id: number;
  gorsel: string;
  gun: string;
  saat: string;
  kapasite: number;
  süre: string;
}

interface FiltersType {
  seviye?: string;
  fiyatAralik?: string;
  arama?: string;
  dansTuru?: string;
  gun?: string;
}

function ClassList(): JSX.Element {
  const [kurslar, setKurslar] = useState<Kurs[]>([]);
  const [filteredKurslar, setFilteredKurslar] = useState<Kurs[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<number>(0);

  useEffect(() => {
    // Gerçek uygulamada bu verileri bir API'dan çekerdiniz
    setKurslar(dansKurslari);
    setFilteredKurslar(dansKurslari);
    setLoading(false);
  }, []);

  const handleFilterChange = (filters: FiltersType): void => {
    setIsFiltering(true);
    let filtered = [...kurslar];
    let filterCount = 0;

    // Seviye filtresi
    if (filters.seviye && filters.seviye !== 'Tümü') {
      filtered = filtered.filter(kurs => kurs.seviye.includes(filters.seviye as string));
      filterCount++;
    }

    // Dans türü filtresi
    if (filters.dansTuru && filters.dansTuru !== '') {
      filtered = filtered.filter(kurs => kurs.baslik.toLowerCase().includes(filters.dansTuru!.toLowerCase()));
      filterCount++;
    }

    // Gün filtresi
    if (filters.gun && filters.gun !== '') {
      filtered = filtered.filter(kurs => kurs.gun === filters.gun);
      filterCount++;
    }

    // Fiyat aralığı filtresi
    if (filters.fiyatAralik) {
      const [min, max] = filters.fiyatAralik.split('-');
      filtered = filtered.filter(kurs => {
        const fiyat = parseInt(kurs.fiyat.replace(/\D/g, ''));
        return fiyat >= parseInt(min) && fiyat <= parseInt(max);
      });
      filterCount++;
    }

    // Arama filtresi
    if (filters.arama) {
      const searchTerm = filters.arama.toLowerCase();
      filtered = filtered.filter(
        kurs => kurs.baslik.toLowerCase().includes(searchTerm) || 
                kurs.aciklama.toLowerCase().includes(searchTerm)
      );
      filterCount++;
    }

    setActiveFilters(filterCount);
    setFilteredKurslar(filtered);
    
    // Kısa bir gecikme sonrasında filtreleme animasyonunu kapat
    setTimeout(() => {
      setIsFiltering(false);
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-indigo-700 text-lg">Dans kursları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-indigo-50/10 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 mb-10">
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute left-0 top-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            <path className="text-indigo-500/20 fill-current" d="M0,0 L1000,0 L1000,1000 L0,1000 Z" />
            <path className="text-white/5 fill-current" d="M0,0 C300,150 500,50 1000,250 L1000,1000 L0,1000 Z" />
            <path className="text-white/5 fill-current" d="M0,250 C300,350 700,250 1000,500 L1000,1000 L0,1000 Z" />
          </svg>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">Dans Kursları</h1>
            <p className="text-xl text-center text-indigo-100 max-w-3xl mx-auto mb-8">
              Profesyonel eğitmenler eşliğinde dans yeteneklerinizi geliştirin ve tutkuyla dans edin.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <SearchFilters onFilterChange={handleFilterChange} />
        </motion.div>
        
        <div className="mt-8">
          {/* Filtreleme Durumu */}
          <motion.div
            className="mb-8 flex justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-gray-700">
              <span className="font-medium">{filteredKurslar.length}</span> kurs bulundu
              {activeFilters > 0 && (
                <span className="ml-2 text-indigo-600 text-sm font-medium">
                  ({activeFilters} filtre aktif)
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // En popüler kurslara göre sırala (örnek olarak id'ye göre)
                  const sorted = [...filteredKurslar].sort((a, b) => a.id - b.id);
                  setFilteredKurslar(sorted);
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                En Popüler
              </button>
              <button
                onClick={() => {
                  // Fiyata göre artan sırala
                  const sorted = [...filteredKurslar].sort((a, b) => {
                    return parseInt(a.fiyat.replace(/\D/g, '')) - parseInt(b.fiyat.replace(/\D/g, ''));
                  });
                  setFilteredKurslar(sorted);
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                Fiyat: Düşük-Yüksek
              </button>
              <button
                onClick={() => {
                  // Fiyata göre azalan sırala
                  const sorted = [...filteredKurslar].sort((a, b) => {
                    return parseInt(b.fiyat.replace(/\D/g, '')) - parseInt(a.fiyat.replace(/\D/g, ''));
                  });
                  setFilteredKurslar(sorted);
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                Fiyat: Yüksek-Düşük
              </button>
            </div>
          </motion.div>

          {filteredKurslar.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${isFiltering ? 'opacity-50' : ''}`}
            >
              {filteredKurslar.map((kurs, index) => (
                <motion.div
                  key={kurs.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                >
                  <ClassCard kurs={kurs} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">Kurs Bulunamadı</h3>
              <p className="text-gray-500 max-w-md mx-auto">Arama kriterlerinize uygun kurs bulunamadı. Lütfen farklı filtreler deneyiniz.</p>
            </motion.div>
          )}
        </div>
        
        {/* Pagination (Optional) */}
        {filteredKurslar.length > 12 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-indigo-50 text-gray-700 disabled:opacity-50">
                Önceki
              </button>
              <button className="px-3 py-1 bg-indigo-600 text-white rounded-md">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-indigo-50 text-gray-700">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-indigo-50 text-gray-700">
                Sonraki
              </button>
            </nav>
          </div>
        )}
        
        {/* CTA Section */}
        <div className="mt-16 mb-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Dansta Yeteneklerini Keşfet</h2>
            <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
              Dans etmek sadece bir hareket değil, bir yaşam tarzıdır. Profesyonel eğitmenlerle dans yeteneklerinizi keşfedin.
            </p>
            <button className="px-6 py-3 bg-white text-indigo-700 font-medium rounded-lg shadow-md hover:bg-indigo-50 transition-colors duration-300">
              Eğitmenlerle Tanışın
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassList; 