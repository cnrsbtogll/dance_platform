import React, { useState, FormEvent, ChangeEvent } from 'react';
import CustomSelect from '../common/CustomSelect';

// Props için interface tanımı
interface SearchFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
}

// Filtre değerleri için interface tanımı
interface FilterValues {
  seviye: string;
  fiyatAralik: string;
  arama: string;
  dansTuru: string;
  gun: string;
}

// Fiyat aralığı seçenekleri için interface tanımı
interface FiyatAralik {
  label: string;
  value: string;
}

function SearchFilters({ onFilterChange }: SearchFiltersProps): JSX.Element {
  const [seviye, setSeviye] = useState<string>('');
  const [fiyatAralik, setFiyatAralik] = useState<string>('');
  const [arama, setArama] = useState<string>('');
  const [dansTuru, setDansTuru] = useState<string>('');
  const [gun, setGun] = useState<string>('');

  // Dans türleri
  const dansTurleri: string[] = [
    'Salsa', 'Bachata', 'Tango', 'Vals', 'Hip Hop', 'Modern Dans', 
    'Bale', 'Flamenko', 'Zeybek', 'Jazz', 'Breakdance'
  ];

  // Günler
  const gunler: string[] = [
    'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar', 'Hafta İçi', 'Hafta Sonu'
  ];

  // Fiyat aralıkları
  const fiyatAraliklari: FiyatAralik[] = [
    { label: '0 - 1000 TL', value: '0-1000' },
    { label: '1000 - 1500 TL', value: '1000-1500' },
    { label: '1500 - 2000 TL', value: '1500-2000' },
    { label: '2000 TL ve üzeri', value: '2000-10000' }
  ];

  // Seviye seçenekleri
  const seviyeler: string[] = ['Başlangıç', 'Orta', 'İleri', 'Tüm Seviyeler'];

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    onFilterChange({
      seviye,
      fiyatAralik,
      arama,
      dansTuru,
      gun
    });
  };

  const filterTemizle = (): void => {
    setSeviye('');
    setFiyatAralik('');
    setArama('');
    setDansTuru('');
    setGun('');
    onFilterChange({
      seviye: '',
      fiyatAralik: '',
      arama: '',
      dansTuru: '',
      gun: ''
    });
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => setArama(e.target.value)}
            placeholder="Kurs adı veya tanımı ile ara..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CustomSelect
            label="Dans Türü"
            options={dansTurleri}
            value={dansTuru}
            onChange={setDansTuru}
            placeholder="Tüm dans türleri"
          />

          <CustomSelect
            label="Seviye"
            options={seviyeler}
            value={seviye}
            onChange={setSeviye}
            placeholder="Tüm seviyeler"
          />

          <CustomSelect
            label="Fiyat Aralığı"
            options={fiyatAraliklari}
            value={fiyatAralik}
            onChange={setFiyatAralik}
            placeholder="Tüm fiyatlar"
          />

          <CustomSelect
            label="Ders Günü"
            options={gunler}
            value={gun}
            onChange={setGun}
            placeholder="Tüm günler"
          />
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