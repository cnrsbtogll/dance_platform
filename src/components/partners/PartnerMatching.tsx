// src/components/partners/PartnerMatching.tsx
import React, { useState, useEffect, Fragment, ChangeEvent, FormEvent } from 'react';
import { Transition } from '@headlessui/react';
import { Link } from 'react-router-dom';
import CustomSelect from '../common/CustomSelect';

// Partner veri tipi
interface Partner {
  id: number;
  ad: string;
  yas: number;
  cinsiyet: string;
  seviye: string;
  dans: string[];
  konum: string;
  saatler: string[];
  foto: string;
  puan: number;
}

// PartnerKarti bileşeni için prop tipi
interface PartnerKartiProps {
  partner: Partner;
}

function PartnerMatching(): JSX.Element {
  const [dansTuru, setDansTuru] = useState<string>('');
  const [cinsiyet, setCinsiyet] = useState<string>('');
  const [seviye, setSeviye] = useState<string>('');
  const [yas, setYas] = useState<string>('');
  const [konum, setKonum] = useState<string>('');
  const [uygunSaatler, setUygunSaatler] = useState<string[]>([]);
  const [partnerler, setPartnerler] = useState<Partner[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [aramaTamamlandi, setAramaTamamlandi] = useState<boolean>(false);

  // Dans türü seçenekleri
  const dansTurleri: string[] = [
    'Salsa', 'Bachata', 'Tango', 'Vals', 'Hip Hop', 'Modern Dans', 'Bale', 'Flamenko', 'Zeybek', 'Jazz'
  ];

  // Seviye seçenekleri
  const seviyeler: string[] = ['Başlangıç', 'Orta', 'İleri'];

  // Cinsiyet seçenekleri
  const cinsiyetler: string[] = ['Kadın', 'Erkek'];

  // Placeholder sahte partner verileri
  const mockPartnerler: Partner[] = [
    {
      id: 1,
      ad: 'Elif Yılmaz',
      yas: 28,
      cinsiyet: 'Kadın',
      seviye: 'Orta',
      dans: ['Salsa', 'Bachata'],
      konum: 'İstanbul, Kadıköy',
      saatler: ['Akşam', 'Hafta Sonu'],
      foto: '/assets/images/dance/partner1.jpg',
      puan: 4.8
    },
    {
      id: 2,
      ad: 'Mehmet Kaya',
      yas: 35,
      cinsiyet: 'Erkek',
      seviye: 'İleri',
      dans: ['Tango', 'Vals'],
      konum: 'İstanbul, Beşiktaş',
      saatler: ['Akşam', 'Hafta Sonu'],
      foto: '/assets/images/dance/partner2.jpg',
      puan: 4.5
    },
    {
      id: 3,
      ad: 'Zeynep Demir',
      yas: 25,
      cinsiyet: 'Kadın',
      seviye: 'Başlangıç',
      dans: ['Hip Hop', 'Modern Dans'],
      konum: 'İstanbul, Beşiktaş',
      saatler: ['Öğlen'],
      foto: '/assets/images/dance/partner3.jpg',
      puan: 4.2
    },
    {
      id: 4,
      ad: 'Ahmet Yıldız',
      yas: 30,
      cinsiyet: 'Erkek',
      seviye: 'Orta',
      dans: ['Salsa', 'Bachata'],
      konum: 'Ankara, Çankaya',
      saatler: ['Akşam'],
      foto: '/assets/images/dance/partner4.jpg',
      puan: 4.7
    },
    {
      id: 5,
      ad: 'Ayşe Öztürk',
      yas: 27,
      cinsiyet: 'Kadın',
      seviye: 'Başlangıç',
      dans: ['Flamenko'],
      konum: 'İzmir, Karşıyaka',
      saatler: ['Hafta Sonu'],
      foto: '/assets/images/dance/partner5.jpg',
      puan: 4.0
    }
  ];

  // Sayfa ilk yüklendiğinde tüm partnerleri listeleme
  useEffect(() => {
    setPartnerler(mockPartnerler);
    setAramaTamamlandi(true);
  }, []);

  // Dans partneri arama fonksiyonu
  const partnerAra = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setLoading(true);

    // Gerçek uygulamada bu kısım API çağrısı olurdu
    setTimeout(() => {
      // Kriterlere göre partnerleri filtrele
      let filtreliPartnerler = mockPartnerler;

      if (dansTuru) {
        filtreliPartnerler = filtreliPartnerler.filter(partner => 
          partner.dans.includes(dansTuru)
        );
      }

      if (cinsiyet) {
        filtreliPartnerler = filtreliPartnerler.filter(partner => 
          partner.cinsiyet === cinsiyet
        );
      }

      if (seviye) {
        filtreliPartnerler = filtreliPartnerler.filter(partner => 
          partner.seviye === seviye
        );
      }

      if (konum) {
        filtreliPartnerler = filtreliPartnerler.filter(partner => 
          partner.konum.includes(konum)
        );
      }

      if (uygunSaatler.length > 0) {
        filtreliPartnerler = filtreliPartnerler.filter(partner => 
          uygunSaatler.some(saat => partner.saatler.includes(saat))
        );
      }

      setPartnerler(filtreliPartnerler);
      setLoading(false);
      setAramaTamamlandi(true);
    }, 1000);
  };

  // Uygun saatleri işleme fonksiyonu
  const handleSaatChange = (saat: string): void => {
    setUygunSaatler(prev => 
      prev.includes(saat) 
        ? prev.filter(s => s !== saat) 
        : [...prev, saat]
    );
  };

  // Partner kartı bileşeni (ClassCard tarzında)
  const PartnerKarti: React.FC<PartnerKartiProps> = ({ partner }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <div className="relative h-56 bg-gray-50 flex items-center justify-center overflow-hidden p-2">
        <img 
          src={partner.foto || 'https://via.placeholder.com/400x250?text=Dans+Partner'} 
          alt={partner.ad} 
          className="max-h-full max-w-full object-contain rounded-md"
          style={{ maxHeight: '200px' }}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://via.placeholder.com/400x250?text=Dans+Partner';
          }}
        />
        <div className="absolute top-2 right-2 bg-indigo-600 text-white px-2 py-1 text-sm rounded-md">
          {partner.seviye}
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <h2 className="text-xl font-bold mb-2 text-gray-800">{partner.ad}</h2>
        
        <div className="flex items-center text-gray-600 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span>{partner.yas} yaşında</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>{partner.konum}</span>
        </div>
        
        <div className="flex flex-wrap mb-3">
          {partner.dans.map((dansTuru, index) => (
            <span 
              key={index} 
              className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded mr-1 mb-1"
            >
              {dansTuru}
            </span>
          ))}
        </div>

        <div className="flex items-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex flex-wrap">
            {partner.saatler.map((saat, index) => (
              <span 
                key={index}
                className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-1 mb-1"
              >
                {saat}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="ml-1 text-sm font-semibold text-gray-700">{partner.puan}</span>
          </div>
          <button 
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            İletişime Geç
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Dans Partneri Bul</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <form onSubmit={partnerAra}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CustomSelect 
              label="Dans Türü"
              options={dansTurleri}
              value={dansTuru}
              onChange={setDansTuru}
              placeholder="Tüm dans türleri"
            />
            
            <CustomSelect 
              label="Partner Cinsiyeti"
              options={cinsiyetler}
              value={cinsiyet}
              onChange={setCinsiyet}
              placeholder="Tüm cinsiyetler"
            />
            
            <CustomSelect 
              label="Dans Seviyesi"
              options={seviyeler}
              value={seviye}
              onChange={setSeviye}
              placeholder="Tüm seviyeler"
            />
            
            <div>
              <label htmlFor="konum" className="block text-sm font-medium text-gray-700 mb-1">
                Konum
              </label>
              <input
                type="text"
                id="konum"
                value={konum}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setKonum(e.target.value)}
                placeholder="Şehir veya semt"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uygun Saatler
              </label>
              <div className="flex flex-wrap gap-3">
                {['Sabah', 'Öğlen', 'Akşam', 'Hafta Sonu'].map((saat) => (
                  <label key={saat} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={uygunSaatler.includes(saat)}
                      onChange={() => handleSaatChange(saat)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{saat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Partner Aranıyor...
                </span>
              ) : "Dans Partneri Ara"}
            </button>
          </div>
        </form>
      </div>
      
      <div className="space-y-6">
        {aramaTamamlandi && (
          <h2 className="text-2xl font-semibold mb-4">
            {partnerler.length > 0 
              ? `${partnerler.length} Dans Partneri Bulundu` 
              : "Uygun dans partneri bulunamadı"}
          </h2>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {partnerler.map(partner => (
            <PartnerKarti key={partner.id} partner={partner} />
          ))}
        </div>
        
        {aramaTamamlandi && partnerler.length === 0 && (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Partner bulunamadı</h3>
            <p className="mt-2 text-gray-600">
              Filtreleri değiştirerek tekrar aramayı deneyebilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PartnerMatching;