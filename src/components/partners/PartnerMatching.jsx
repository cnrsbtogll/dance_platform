// src/components/partners/PartnerMatching.jsx
import React, { useState, useEffect } from 'react';

function PartnerMatching() {
  const [dansTuru, setDansTuru] = useState('');
  const [cinsiyet, setCinsiyet] = useState('');
  const [seviye, setSeviye] = useState('');
  const [yas, setYas] = useState('');
  const [konum, setKonum] = useState('');
  const [uygunSaatler, setUygunSaatler] = useState([]);
  const [partnerler, setPartnerler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aramaTamamlandi, setAramaTamamlandi] = useState(false);

  // Dans türü seçenekleri
  const dansTurleri = [
    'Salsa', 'Bachata', 'Tango', 'Vals', 'Hip Hop', 'Modern Dans', 'Bale', 'Flamenko', 'Zeybek', 'Jazz'
  ];

  // Placeholder sahte partner verileri
  const mockPartnerler = [
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

  // Dans partneri arama fonksiyonu
  const partnerAra = (e) => {
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
  const handleSaatChange = (saat) => {
    setUygunSaatler(prev => 
      prev.includes(saat) 
        ? prev.filter(s => s !== saat) 
        : [...prev, saat]
    );
  };

  // Partner kartı bileşeni
  const PartnerKarti = ({ partner }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex">
        <div className="w-1/3">
          <img 
            src={partner.foto || 'https://via.placeholder.com/150'} 
            alt={partner.ad} 
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/150?text=Dans+Partner';
            }}
          />
        </div>
        <div className="w-2/3 p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-800">{partner.ad}</h3>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-sm font-semibold text-gray-700">{partner.puan}</span>
            </div>
          </div>
          
          <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Yaş:</span> {partner.yas}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Seviye:</span> {partner.seviye}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Dans Türleri:</span> {partner.dans.join(', ')}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Konum:</span> {partner.konum}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Uygun Saatler:</span> {partner.saatler.join(', ')}
            </p>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              İletişime Geç
            </button>
          </div>
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
              <label htmlFor="cinsiyet" className="block text-sm font-medium text-gray-700 mb-1">
                Partner Cinsiyeti
              </label>
              <select
                id="cinsiyet"
                value={cinsiyet}
                onChange={(e) => setCinsiyet(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tümü</option>
                <option value="Kadın">Kadın</option>
                <option value="Erkek">Erkek</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="seviye" className="block text-sm font-medium text-gray-700 mb-1">
                Dans Seviyesi
              </label>
              <select
                id="seviye"
                value={seviye}
                onChange={(e) => setSeviye(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Tümü</option>
                <option value="Başlangıç">Başlangıç</option>
                <option value="Orta">Orta</option>
                <option value="İleri">İleri</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="konum" className="block text-sm font-medium text-gray-700 mb-1">
                Konum
              </label>
              <input
                type="text"
                id="konum"
                value={konum}
                onChange={(e) => setKonum(e.target.value)}
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
        
        {partnerler.map(partner => (
          <PartnerKarti key={partner.id} partner={partner} />
        ))}
        
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