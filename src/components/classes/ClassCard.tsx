import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { dansEgitmenleri, dansOkullari } from '../../data/dansVerileri';

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
}

interface Egitmen {
  id: number;
  ad: string;
  uzmanlık: string;
  tecrube: string;
  biyografi: string;
  gorsel: string;
}

interface Okul {
  id: number;
  ad: string;
  konum: string;
  aciklama: string;
  iletisim: string;
  telefon: string;
  gorsel: string;
}

interface ClassCardProps {
  kurs: Kurs;
}

function ClassCard({ kurs }: ClassCardProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  
  // Eğitmen ve okul bilgilerini bul
  const egitmen = dansEgitmenleri.find(egitmen => egitmen.id === kurs.egitmen_id);
  const okul = dansOkullari.find(okul => okul.id === kurs.okul_id);

  // Seviye için renkler
  const getLevelColor = (seviye: string) => {
    switch (seviye.toLowerCase()) {
      case 'başlangıç':
        return 'bg-emerald-500';
      case 'orta':
        return 'bg-amber-500';
      case 'ileri':
        return 'bg-rose-500';
      case 'tüm seviyeler':
        return 'bg-indigo-500';
      default:
        return 'bg-indigo-500';
    }
  };

  // Gün ve saat bilgisi
  const formatSchedule = () => {
    return `${kurs.gun} · ${kurs.saat}`;
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Image Container with Overlay */}
        <div className="relative h-56 overflow-hidden group">
          <img 
            src={kurs.gorsel || 'https://via.placeholder.com/400x250?text=Dans+Kursu'} 
            alt={kurs.baslik} 
            className={`w-full h-full object-cover object-center transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
            style={{ objectPosition: 'center center' }}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = 'https://via.placeholder.com/400x250?text=Dans+Kursu';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"></div>
          
          {/* Seviye badge */}
          <div className={`absolute top-4 right-4 ${getLevelColor(kurs.seviye)} text-white px-3 py-1 text-sm font-medium rounded-full shadow-lg`}>
            {kurs.seviye}
          </div>
          
          {/* Schedule badge */}
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm text-gray-800 px-3 py-1 text-sm font-medium rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatSchedule()}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h2 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-indigo-600">{kurs.baslik}</h2>
        
        <div className="flex items-center mb-3">
          {egitmen && egitmen.gorsel ? (
            <img 
              src={egitmen.gorsel} 
              alt={egitmen.ad}
              className="w-8 h-8 rounded-full object-cover mr-2 border-2 border-white shadow-sm" 
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.currentTarget;
                target.onerror = null;
                target.src = 'https://via.placeholder.com/40?text=Eğitmen';
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-gray-800">{egitmen ? egitmen.ad : 'Bilinmeyen Eğitmen'}</span>
            {egitmen && egitmen.uzmanlık && (
              <div className="text-xs text-gray-500">{egitmen.uzmanlık}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center mb-4 text-gray-600 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span>{okul ? okul.ad : 'Bilinmeyen Okul'}</span>
          {okul && okul.konum && (
            <span className="ml-1 text-gray-400">· {okul.konum}</span>
          )}
        </div>
        
        {/* Açıklama */}
        <p className="text-gray-600 text-sm mb-5 line-clamp-2">
          {kurs.aciklama || 'Bu dans kursu hakkında detaylı bilgi için detaylar butonuna tıklayın.'}
        </p>
        
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="text-xl font-bold text-indigo-600">{kurs.fiyat}</span>
          <Link 
            to={`/class/${kurs.id}`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-sm"
          >
            <span>Detaylar</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ClassCard; 