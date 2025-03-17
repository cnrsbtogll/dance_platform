import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import CustomSelect from '../common/CustomSelect';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';

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

// Dans stili interface
interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

function SearchFilters({ onFilterChange }: SearchFiltersProps): JSX.Element {
  const [seviye, setSeviye] = useState<string>('');
  const [fiyatAralik, setFiyatAralik] = useState<string>('');
  const [arama, setArama] = useState<string>('');
  const [dansTuru, setDansTuru] = useState<string>('');
  const [gun, setGun] = useState<string>('');
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  // Fetch dance styles from Firestore
  useEffect(() => {
    const fetchDanceStyles = async () => {
      setLoadingStyles(true);
      try {
        const danceStylesRef = collection(db, 'danceStyles');
        const q = query(danceStylesRef, orderBy('label'));
        const querySnapshot = await getDocs(q);
        
        const styles: DanceStyle[] = [];
        querySnapshot.forEach((doc) => {
          styles.push({
            id: doc.id,
            ...doc.data()
          } as DanceStyle);
        });
        
        if (styles.length === 0) {
          // If no styles in Firestore, use default styles
          setDanceStyles([
            { id: 'default-1', label: 'Salsa', value: 'salsa' },
            { id: 'default-2', label: 'Bachata', value: 'bachata' },
            { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
            { id: 'default-4', label: 'Tango', value: 'tango' },
            { id: 'default-5', label: 'Vals', value: 'vals' },
            { id: 'default-6', label: 'Hip Hop', value: 'hiphop' },
            { id: 'default-7', label: 'Modern Dans', value: 'modern-dans' },
            { id: 'default-8', label: 'Bale', value: 'bale' },
            { id: 'default-9', label: 'Flamenko', value: 'flamenko' },
            { id: 'default-10', label: 'Zeybek', value: 'zeybek' },
            { id: 'default-11', label: 'Jazz', value: 'jazz' },
            { id: 'default-12', label: 'Breakdance', value: 'breakdance' }
          ]);
        } else {
          setDanceStyles(styles);
        }
      } catch (err) {
        console.error('Error fetching dance styles:', err);
        // Fallback to default styles on error
        setDanceStyles([
          { id: 'default-1', label: 'Salsa', value: 'salsa' },
          { id: 'default-2', label: 'Bachata', value: 'bachata' },
          { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
          { id: 'default-4', label: 'Tango', value: 'tango' },
          { id: 'default-5', label: 'Vals', value: 'vals' },
          { id: 'default-6', label: 'Hip Hop', value: 'hiphop' },
          { id: 'default-7', label: 'Modern Dans', value: 'modern-dans' },
          { id: 'default-8', label: 'Bale', value: 'bale' },
          { id: 'default-9', label: 'Flamenko', value: 'flamenko' },
          { id: 'default-10', label: 'Zeybek', value: 'zeybek' },
          { id: 'default-11', label: 'Jazz', value: 'jazz' },
          { id: 'default-12', label: 'Breakdance', value: 'breakdance' }
        ]);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchDanceStyles();
  }, []);

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
          {loadingStyles ? (
            <div className="bg-gray-100 p-2 rounded-md flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
              <span className="text-gray-600">Dans stilleri yükleniyor...</span>
            </div>
          ) : (
            <CustomSelect
              label="Dans Türü"
              options={danceStyles}
              value={dansTuru}
              onChange={setDansTuru}
              placeholder="Tüm dans türleri"
            />
          )}

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