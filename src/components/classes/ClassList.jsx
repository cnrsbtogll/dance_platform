// src/components/classes/ClassList.jsx
import React, { useState, useEffect } from 'react';
import ClassCard from './ClassCard';
import { dansKurslari } from '../../data/dansVerileri';
import SearchFilters from '../search/SearchFilters';

function ClassList() {
  const [kurslar, setKurslar] = useState([]);
  const [filteredKurslar, setFilteredKurslar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gerçek uygulamada bu verileri bir API'dan çekerdiniz
    setKurslar(dansKurslari);
    setFilteredKurslar(dansKurslari);
    setLoading(false);
  }, []);

  const handleFilterChange = (filters) => {
    let filtered = [...kurslar];

    // Seviye filtresi
    if (filters.seviye && filters.seviye !== 'Tümü') {
      filtered = filtered.filter(kurs => kurs.seviye.includes(filters.seviye));
    }

    // Fiyat aralığı filtresi
    if (filters.fiyatAralik) {
      const [min, max] = filters.fiyatAralik.split('-');
      filtered = filtered.filter(kurs => {
        const fiyat = parseInt(kurs.fiyat.replace(/\D/g, ''));
        return fiyat >= parseInt(min) && fiyat <= parseInt(max);
      });
    }

    // Arama filtresi
    if (filters.arama) {
      const searchTerm = filters.arama.toLowerCase();
      filtered = filtered.filter(
        kurs => kurs.baslik.toLowerCase().includes(searchTerm) || 
                kurs.aciklama.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredKurslar(filtered);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Dans Kursları</h1>
      
      <SearchFilters onFilterChange={handleFilterChange} />
      
      <div className="mt-8">
        {filteredKurslar.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredKurslar.map(kurs => (
              <ClassCard key={kurs.id} kurs={kurs} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl text-gray-600">Arama kriterlerine uygun kurs bulunamadı</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassList;