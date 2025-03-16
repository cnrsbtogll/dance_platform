// src/components/classes/ClassCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { dansEgitmenleri, dansOkullari } from '../../data/dansVerileri';

function ClassCard({ kurs }) {
  // Eğitmen ve okul bilgilerini bul
  const egitmen = dansEgitmenleri.find(egitmen => egitmen.id === kurs.egitmen_id);
  const okul = dansOkullari.find(okul => okul.id === kurs.okul_id);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={kurs.gorsel} 
          alt={kurs.baslik} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x250?text=Dans+Kursu';
          }}
        />
        <div className="absolute top-0 right-0 bg-indigo-600 text-white px-2 py-1 text-sm">
          {kurs.seviye}
        </div>
      </div>
      
      <div className="p-5">
        <h2 className="text-xl font-bold mb-2 text-gray-800">{kurs.baslik}</h2>
        
        <div className="flex items-center text-gray-600 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span>{egitmen ? egitmen.ad : 'Bilinmeyen Eğitmen'}</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1v1H7v-1a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
          </svg>
          <span>{okul ? okul.ad : 'Bilinmeyen Okul'}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm mb-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{kurs.gun}</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{kurs.saat}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xl font-bold text-indigo-600">{kurs.fiyat}</span>
          <Link 
            to={`/class/${kurs.id}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Detaylar
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ClassCard;