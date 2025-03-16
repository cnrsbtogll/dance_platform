// src/components/classes/ClassDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dansKurslari, dansEgitmenleri, dansOkullari } from '../../data/dansVerileri';

function ClassDetails() {
  const { id } = useParams();
  const [kurs, setKurs] = useState(null);
  const [egitmen, setEgitmen] = useState(null);
  const [okul, setOkul] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gerçek uygulamada bu verileri bir API'dan çekerdiniz
    const selectedKurs = dansKurslari.find(k => k.id === Number(id));
    
    if (selectedKurs) {
      setKurs(selectedKurs);
      const kursEgitmeni = dansEgitmenleri.find(e => e.id === selectedKurs.egitmen_id);
      const kursOkulu = dansOkullari.find(o => o.id === selectedKurs.okul_id);
      
      setEgitmen(kursEgitmeni);
      setOkul(kursOkulu);
    }
    
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!kurs) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-700">Kurs bulunamadı</h2>
        <Link to="/classes" className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Kurslara Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2">
            <img 
              src={kurs.gorsel} 
              alt={kurs.baslik} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/800x600?text=Dans+Kursu';
              }}
            />
          </div>
          <div className="md:w-1/2 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{kurs.baslik}</h1>
                <div className="flex items-center mt-2">
                  <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {kurs.seviye}
                  </span>
                  <span className="ml-2 bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {kurs.süre}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600">{kurs.fiyat}</div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold">Kurs Açıklaması</h3>
              <p className="mt-2 text-gray-600">{kurs.aciklama}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="font-semibold text-gray-700">Ders Günleri</h3>
                <p className="text-gray-600">{kurs.gun}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Ders Saatleri</h3>
                <p className="text-gray-600">{kurs.saat}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Kapasite</h3>
                <p className="text-gray-600">{kurs.kapasite} kişi</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Süre</h3>
                <p className="text-gray-600">{kurs.süre}</p>
              </div>
            </div>
            
            <button className="mt-8 w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
              Kursa Kaydol
            </button>
          </div>
        </div>

        {egitmen && (
          <div className="p-6 border-t">
            <h2 className="text-xl font-bold mb-4">Eğitmen</h2>
            <div className="flex items-center">
              <img 
                src={egitmen.gorsel} 
                alt={egitmen.ad} 
                className="w-16 h-16 rounded-full object-cover mr-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=Eğitmen';
                }}
              />
              <div>
                <h3 className="font-semibold text-lg">{egitmen.ad}</h3>
                <p className="text-gray-600">{egitmen.uzmanlık}</p>
                <p className="text-sm text-gray-500">{egitmen.tecrube} deneyim</p>
              </div>
            </div>
            <p className="mt-4 text-gray-700">{egitmen.biyografi}</p>
          </div>
        )}

        {okul && (
          <div className="p-6 border-t">
            <h2 className="text-xl font-bold mb-4">Dans Okulu</h2>
            <div className="flex items-start">
              <img 
                src={okul.gorsel} 
                alt={okul.ad} 
                className="w-20 h-20 object-cover mr-4 rounded-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=Dans+Okulu';
                }}
              />
              <div>
                <h3 className="font-semibold text-lg">{okul.ad}</h3>
                <p className="text-gray-600">{okul.konum}</p>
                <p className="text-gray-600 mt-2">{okul.aciklama}</p>
                <div className="mt-3">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">İletişim: </span>
                    {okul.iletisim}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Telefon: </span>
                    {okul.telefon}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-t flex justify-between items-center">
          <Link to="/classes" className="text-indigo-600 hover:text-indigo-800 font-medium">
            ← Tüm Kurslar
          </Link>
          <div className="flex space-x-4">
            <button className="flex items-center text-gray-600 hover:text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Paylaş
            </button>
            <button className="flex items-center text-gray-600 hover:text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favorilere Ekle
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Benzer Kurslar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dansKurslari
            .filter(k => k.id !== kurs.id && k.seviye === kurs.seviye)
            .slice(0, 3)
            .map(benzerKurs => (
              <div key={benzerKurs.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img 
                  src={benzerKurs.gorsel} 
                  alt={benzerKurs.baslik} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x250?text=Dans+Kursu';
                  }}
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{benzerKurs.baslik}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{benzerKurs.aciklama}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="font-bold text-indigo-600">{benzerKurs.fiyat}</span>
                    <Link 
                      to={`/class/${benzerKurs.id}`}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      Detaylar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default ClassDetails;