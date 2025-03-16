// src/components/search/SearchFilters.jsx
import React, { useState } from 'react';

function SearchFilters({ onFilterChange }) {
  const [seviye, setSeviye] = useState('');
  const [fiyatAralik, setFiyatAralik] = useState('');
  const [arama, setArama] = useState('');
  const [dansTuru, setDansTuru] = useState('');
  const [gun, setGun] = useState('');

  // Dans türleri
  const dansTurleri = [
    'Salsa', 'Bachata', 'Tango', 'Vals', 'Hip Hop', 'Modern Dans', 
    'Bale', 'Flamenko', 'Zeybek', 'Jazz', 'Breakdance'
  ];

  // Günler
  const gunler = [
    'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar', 'Hafta İçi', 'Hafta Sonu'
  ];

  // Fiyat aralıkları
  const fiyatAraliklari = [
    { label: '0 - 1000 TL', value: '0-1000' },
    { label: '1000 - 1500 TL', value: '1000-1500' },
    { label: '1500 - 2000 TL', value: '1500-2000' },
    { label: '2000 TL ve üzeri', value: '2000-10000' }
  ];

  // Seviye seçenekleri
  const seviyeler = ['Başlangıç', 'Orta', 'İleri', 'Tüm Seviyeler'];

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange({
      seviye,
      fiyatAralik,
      arama,
      dansTuru,
      gun
    });
  };

  const filterTemizle = () => {
    setSeviye('');
    setFiyatAralik('');
    setArama('');
    setDansTuru('');
    setGun('');
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="arama" className="block text-sm font-medium text-gray-700 mb-1">
            Dans Kursu Ara
          </label>
          <input
            type="text"
            id="arama"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Kurs adı veya tanımı ile ara..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="dansTuru" className="block text-sm font-medium text-gray-700 mb-1">
              Dans Türü
            </label>
            <select
              id="dansTuru"
              value={dansTuru}
              onChange={(e) => setDansTuru(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tümü</option>
              {dansTurleri.map((tur) => (
                <option key={tur} value={tur}>{tur}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="seviye" className="block text-sm font-medium text-gray-700 mb-1">
              Seviye
            </label>
            <select
              id="seviye"
              value={seviye}
              onChange={(e) => setSeviye(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tümü</option>
              {seviyeler.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fiyatAralik" className="block text-sm font-medium text-gray-700 mb-1">
              Fiyat Aralığı
            </label>
            <select
              id="fiyatAralik"
              value={fiyatAralik}
              onChange={(e) => setFiyatAralik(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tümü</option>
              {fiyatAraliklari.map((aralik) => (
                <option key={aralik.value} value={aralik.value}>
                  {aralik.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="gun" className="block text-sm font-medium text-gray-700 mb-1">
              Ders Günü
            </label>
            <select
              id="gun"
              value={gun}
              onChange={(e) => setGun(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tümü</option>
              {gunler.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={filterTemizle}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Filtreleri Temizle
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Filtrele
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchFilters;