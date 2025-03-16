import React, { useState, useEffect } from 'react';
import { dansRozet } from '../../data/dansVerileri';

// Tip tanımlamaları
interface UserProgress {
  tamamlananKurslar: number;
  tamamlananDersler: number;
  toplamDansSuresi: number; // saat
  kazanilanRozetler: number[]; // rozet id'leri
  ilerlemeYuzdesi: number;
  seviye: number;
  puanlar: number;
}

interface Rozet {
  id: number;
  ad: string;
  aciklama: string;
  gorsel: string;
  seviye: number;
}

interface IlerlemeBarProps {
  yuzde: number;
  etiket: string;
  renk?: string;
}

interface RozetKartiProps {
  rozet: Rozet;
  kazanildi?: boolean;
}

function BadgeSystem(): JSX.Element {
  // Kullanıcı ilerleme durumu (gerçek uygulamada bu Firebase/Supabase'den gelirdi)
  const [userProgress, setUserProgress] = useState<UserProgress>({
    tamamlananKurslar: 3,
    tamamlananDersler: 24,
    toplamDansSuresi: 36, // saat
    kazanilanRozetler: [1, 2], // rozet id'leri
    ilerlemeYuzdesi: 65,
    seviye: 2,
    puanlar: 650
  });

  // Tüm rozetler
  const [rozetler, setRozetler] = useState<Rozet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Gerçek uygulamada bu API'dan çekilirdi
    setRozetler(dansRozet);
    setLoading(false);
  }, []);

  // İlerleme çubuğu bileşeni
  const IlerlemeBar: React.FC<IlerlemeBarProps> = ({ yuzde, etiket, renk = 'indigo' }) => (
    <div className="mt-4 mb-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{etiket}</span>
        <span className="text-sm font-medium text-gray-700">{yuzde}%</span>
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`bg-${renk}-600 h-2.5 rounded-full`} 
          style={{ width: `${yuzde}%` }}
        ></div>
      </div>
    </div>
  );

  // Rozet kartı bileşeni
  const RozetKarti: React.FC<RozetKartiProps> = ({ rozet, kazanildi = false }) => (
    <div 
      className={`bg-white border rounded-lg p-4 flex flex-col items-center ${kazanildi ? 'border-green-500 shadow-md' : 'border-gray-300 opacity-70'}`}
    >
      <div className={`relative w-16 h-16 mb-3 ${!kazanildi && 'grayscale'}`}>
        <img 
          src={rozet.gorsel} 
          alt={rozet.ad} 
          className="w-full h-full object-contain"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = 'https://via.placeholder.com/150?text=Rozet';
          }}
        />
        {kazanildi && (
          <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      <h3 className={`text-md font-bold ${kazanildi ? 'text-gray-800' : 'text-gray-600'}`}>
        {rozet.ad}
      </h3>
      <p className="text-xs text-gray-500 text-center mt-1">{rozet.aciklama}</p>
      
      {!kazanildi && (
        <div className="mt-3 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
          {rozet.seviye}. Seviyede Açılır
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Dans İlerleme Durumum</h1>
      
      {/* İlerleme özeti kartı */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-gray-800">Seviye {userProgress.seviye}</h2>
            <p className="text-gray-600">Toplam {userProgress.puanlar} puan kazandınız</p>
          </div>
          
          <div className="flex items-center">
            <div className="text-right mr-4">
              <p className="text-sm text-gray-600">Bir sonraki seviye</p>
              <p className="font-bold text-indigo-600">{350 - (userProgress.puanlar % 350)} puan kaldı</p>
            </div>
            <div className="bg-indigo-600 text-white text-xl font-bold rounded-full w-12 h-12 flex items-center justify-center">
              {userProgress.seviye}
            </div>
          </div>
        </div>
        
        <IlerlemeBar yuzde={userProgress.ilerlemeYuzdesi} etiket="Genel İlerleme" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <p className="text-xl font-bold text-indigo-700">{userProgress.tamamlananKurslar}</p>
            <p className="text-sm text-gray-600">Tamamlanan Kurslar</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-xl font-bold text-purple-700">{userProgress.tamamlananDersler}</p>
            <p className="text-sm text-gray-600">Katılınan Dersler</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-xl font-bold text-blue-700">{userProgress.toplamDansSuresi}</p>
            <p className="text-sm text-gray-600">Dans Saati</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-xl font-bold text-green-700">{userProgress.kazanilanRozetler.length}</p>
            <p className="text-sm text-gray-600">Kazanılan Rozetler</p>
          </div>
        </div>
      </div>
      
      {/* Rozetler bölümü */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Rozetlerim</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {rozetler.map(rozet => (
            <RozetKarti 
              key={rozet.id} 
              rozet={rozet} 
              kazanildi={userProgress.kazanilanRozetler.includes(rozet.id)} 
            />
          ))}
        </div>
      </div>
      
      {/* İpuçları bölümü */}
      <div className="bg-indigo-50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Dans Becerilerinizi Nasıl Geliştirebilirsiniz?</h2>
        
        <ul className="space-y-3">
          <li className="flex items-start">
            <svg className="h-6 w-6 text-indigo-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Haftada en az 3 kez pratik yapın.</span>
          </li>
          <li className="flex items-start">
            <svg className="h-6 w-6 text-indigo-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Dans partnerlerinizle düzenli olarak buluşun ve geri bildirim isteyin.</span>
          </li>
          <li className="flex items-start">
            <svg className="h-6 w-6 text-indigo-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Dans videolarınızı çekin ve kendinizi izleyerek geliştirin.</span>
          </li>
          <li className="flex items-start">
            <svg className="h-6 w-6 text-indigo-600 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Kendinize gerçekçi hedefler belirleyin ve ilerlemenizi takip edin.</span>
          </li>
        </ul>
        
        <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
          Dans Kurslarına Göz At
        </button>
      </div>
    </div>
  );
}

export default BadgeSystem; 