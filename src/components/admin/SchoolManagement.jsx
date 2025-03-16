// src/components/admin/SchoolManagement.jsx
import React, { useState, useEffect } from 'react';
import { dansOkullari } from '../../data/dansVerileri';

function SchoolManagement() {
  const [okullar, setOkullar] = useState([]);
  const [duzenlemeModu, setDuzenlemeModu] = useState(false);
  const [seciliOkul, setSeciliOkul] = useState(null);
  const [aramaTerimi, setAramaTerimi] = useState('');
  const [formVeri, setFormVeri] = useState({
    ad: '',
    aciklama: '',
    konum: '',
    iletisim: '',
    telefon: '',
    gorsel: ''
  });

  // İlk yüklemede verileri çek
  useEffect(() => {
    // Gerçekte bu veri Supabase/Firebase'den çekilirdi
    setOkullar(dansOkullari);
  }, []);

  // Okul düzenleme
  const okulDuzenle = (okul) => {
    setSeciliOkul(okul);
    setFormVeri({
      ad: okul.ad,
      aciklama: okul.aciklama,
      konum: okul.konum,
      iletisim: okul.iletisim,
      telefon: okul.telefon,
      gorsel: okul.gorsel
    });
    setDuzenlemeModu(true);
  };

  // Yeni okul ekleme
  const yeniOkulEkle = () => {
    setSeciliOkul(null);
    setFormVeri({
      ad: '',
      aciklama: '',
      konum: '',
      iletisim: '',
      telefon: '',
      gorsel: '/assets/images/dance/okul_default.jpg'
    });
    setDuzenlemeModu(true);
  };

  // Form alanı değişikliği
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormVeri(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form gönderimi
  const formGonder = (e) => {
    e.preventDefault();
    
    if (seciliOkul) {
      // Mevcut okulu güncelle
      const guncellenenOkullar = okullar.map(okul => 
        okul.id === seciliOkul.id ? { ...okul, ...formVeri } : okul
      );
      setOkullar(guncellenenOkullar);
      // Gerçek uygulamada burada Firebase/Supabase güncelleme olurdu
    } else {
      // Yeni okul ekle
      const yeniOkul = {
        ...formVeri,
        id: okullar.length > 0 ? Math.max(...okullar.map(o => o.id)) + 1 : 1
      };
      setOkullar([...okullar, yeniOkul]);
      // Gerçek uygulamada burada Firebase/Supabase ekleme olurdu
    }
    
    // Formu kapat
    setDuzenlemeModu(false);
    setSeciliOkul(null);
  };

  // Okul silme
  const okulSil = (id) => {
    if (window.confirm('Bu okulu silmek istediğinizden emin misiniz?')) {
      const filtrelenmisOkullar = okullar.filter(okul => okul.id !== id);
      setOkullar(filtrelenmisOkullar);
      // Gerçek uygulamada burada Firebase/Supabase silme olurdu
    }
  };

  // Arama sonuçları
  const filtrelenmisOkullar = okullar.filter(okul => 
    okul.ad.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    okul.konum.toLowerCase().includes(aramaTerimi.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Dans Okulu Yönetimi</h2>
        {!duzenlemeModu && (
          <button 
            onClick={yeniOkulEkle}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Yeni Okul Ekle
          </button>
        )}
      </div>
      
      {duzenlemeModu ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {seciliOkul ? 'Okul Düzenle' : 'Yeni Okul Ekle'}
          </h3>
          
          <form onSubmit={formGonder}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="ad" className="block text-sm font-medium text-gray-700 mb-1">
                  Okul Adı*
                </label>
                <input
                  type="text"
                  id="ad"
                  name="ad"
                  required
                  value={formVeri.ad}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="konum" className="block text-sm font-medium text-gray-700 mb-1">
                  Konum*
                </label>
                <input
                  type="text"
                  id="konum"
                  name="konum"
                  required
                  value={formVeri.konum}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="iletisim" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  id="iletisim"
                  name="iletisim"
                  value={formVeri.iletisim}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  id="telefon"
                  name="telefon"
                  value={formVeri.telefon}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="aciklama" className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  id="aciklama"
                  name="aciklama"
                  rows="3"
                  value={formVeri.aciklama}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="gorsel" className="block text-sm font-medium text-gray-700 mb-1">
                  Fotoğraf URL'si
                </label>
                <input
                  type="text"
                  id="gorsel"
                  name="gorsel"
                  value={formVeri.gorsel}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDuzenlemeModu(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {seciliOkul ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Okul adı veya konum ara..."
              value={aramaTerimi}
              onChange={(e) => setAramaTerimi(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Okul
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Konum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İletişim
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtrelenmisOkullar.length > 0 ? (
                  filtrelenmisOkullar.map((okul) => (
                    <tr key={okul.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={okul.gorsel}
                              alt={okul.ad}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/40?text=Okul';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{okul.ad}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{okul.konum}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{okul.telefon}</div>
                        <div className="text-sm text-gray-500">{okul.iletisim}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => okulDuzenle(okul)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Düzenle
                        </button>
                        <button 
                          onClick={() => okulSil(okul.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      {aramaTerimi ? 'Aramanıza uygun okul bulunamadı.' : 'Henüz hiç okul kaydı bulunmamaktadır.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default SchoolManagement;