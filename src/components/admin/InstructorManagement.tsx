import React, { useState, useEffect } from 'react';
import { dansEgitmenleri, dansOkullari } from '../../data/dansVerileri';

// Tip tanımlamaları
interface Egitmen {
  id: number;
  ad: string;
  uzmanlık: string;
  tecrube: string;
  biyografi: string;
  okul_id: number;
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

interface FormData {
  ad: string;
  uzmanlık: string;
  tecrube: string;
  biyografi: string;
  okul_id: number | string;
  gorsel: string;
}

function InstructorManagement(): JSX.Element {
  const [egitmenler, setEgitmenler] = useState<Egitmen[]>([]);
  const [duzenlemeModu, setDuzenlemeModu] = useState<boolean>(false);
  const [seciliEgitmen, setSeciliEgitmen] = useState<Egitmen | null>(null);
  const [aramaTerimi, setAramaTerimi] = useState<string>('');
  const [formVeri, setFormVeri] = useState<FormData>({
    ad: '',
    uzmanlık: '',
    tecrube: '',
    biyografi: '',
    okul_id: '',
    gorsel: ''
  });

  // İlk yüklemede verileri çek
  useEffect(() => {
    // Gerçekte bu veri Supabase/Firebase'den çekilirdi
    setEgitmenler(dansEgitmenleri);
  }, []);

  // Eğitmen düzenleme
  const egitmenDuzenle = (egitmen: Egitmen): void => {
    setSeciliEgitmen(egitmen);
    setFormVeri({
      ad: egitmen.ad,
      uzmanlık: egitmen.uzmanlık,
      tecrube: egitmen.tecrube,
      biyografi: egitmen.biyografi,
      okul_id: egitmen.okul_id,
      gorsel: egitmen.gorsel
    });
    setDuzenlemeModu(true);
  };

  // Yeni eğitmen ekleme
  const yeniEgitmenEkle = (): void => {
    setSeciliEgitmen(null);
    setFormVeri({
      ad: '',
      uzmanlık: '',
      tecrube: '',
      biyografi: '',
      okul_id: '',
      gorsel: '/assets/images/dance/egitmen_default.jpg'
    });
    setDuzenlemeModu(true);
  };

  // Form alanı değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormVeri(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form gönderimi
  const formGonder = (e: React.FormEvent): void => {
    e.preventDefault();
    
    if (seciliEgitmen) {
      // Mevcut eğitmeni güncelle
      const guncellenenEgitmenler = egitmenler.map(egitmen => 
        egitmen.id === seciliEgitmen.id ? { 
          ...egitmen, 
          ...formVeri,
          okul_id: typeof formVeri.okul_id === 'string' ? parseInt(formVeri.okul_id) : formVeri.okul_id
        } : egitmen
      );
      setEgitmenler(guncellenenEgitmenler);
      // Gerçek uygulamada burada Firebase/Supabase güncelleme olurdu
    } else {
      // Yeni eğitmen ekle
      const yeniEgitmen: Egitmen = {
        ...formVeri,
        id: egitmenler.length > 0 ? Math.max(...egitmenler.map(e => e.id)) + 1 : 1,
        okul_id: typeof formVeri.okul_id === 'string' ? parseInt(formVeri.okul_id) : formVeri.okul_id
      } as Egitmen;
      
      setEgitmenler([...egitmenler, yeniEgitmen]);
      // Gerçek uygulamada burada Firebase/Supabase ekleme olurdu
    }
    
    // Formu kapat
    setDuzenlemeModu(false);
    setSeciliEgitmen(null);
  };

  // Eğitmen silme
  const egitmenSil = (id: number): void => {
    if (window.confirm('Bu eğitmeni silmek istediğinizden emin misiniz?')) {
      const filtrelenmisEgitmenler = egitmenler.filter(egitmen => egitmen.id !== id);
      setEgitmenler(filtrelenmisEgitmenler);
      // Gerçek uygulamada burada Firebase/Supabase silme olurdu
    }
  };

  // Arama sonuçları
  const filtrelenmisEgitmenler = egitmenler.filter(egitmen => 
    egitmen.ad.toLowerCase().includes(aramaTerimi.toLowerCase()) ||
    egitmen.uzmanlık.toLowerCase().includes(aramaTerimi.toLowerCase())
  );

  // Okul adını ID'ye göre getir
  const getOkulAdi = (okul_id: number): string => {
    const okul = dansOkullari.find(okul => okul.id === okul_id);
    return okul ? okul.ad : 'Bilinmeyen Okul';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Eğitmen Yönetimi</h2>
        {!duzenlemeModu && (
          <button 
            onClick={yeniEgitmenEkle}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Yeni Eğitmen Ekle
          </button>
        )}
      </div>
      
      {duzenlemeModu ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {seciliEgitmen ? 'Eğitmen Düzenle' : 'Yeni Eğitmen Ekle'}
          </h3>
          
          <form onSubmit={formGonder}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="ad" className="block text-sm font-medium text-gray-700 mb-1">
                  Eğitmen Adı*
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
                <label htmlFor="uzmanlık" className="block text-sm font-medium text-gray-700 mb-1">
                  Uzmanlık Alanı*
                </label>
                <input
                  type="text"
                  id="uzmanlık"
                  name="uzmanlık"
                  required
                  value={formVeri.uzmanlık}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Örn: Salsa, Tango"
                />
              </div>
              
              <div>
                <label htmlFor="tecrube" className="block text-sm font-medium text-gray-700 mb-1">
                  Tecrübe
                </label>
                <input
                  type="text"
                  id="tecrube"
                  name="tecrube"
                  value={formVeri.tecrube}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Örn: 5 yıl"
                />
              </div>
              
              <div>
                <label htmlFor="okul_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Çalıştığı Okul*
                </label>
                <select
                  id="okul_id"
                  name="okul_id"
                  required
                  value={formVeri.okul_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Okul Seçin</option>
                  {dansOkullari.map(okul => (
                    <option key={okul.id} value={okul.id}>{okul.ad}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="biyografi" className="block text-sm font-medium text-gray-700 mb-1">
                  Biyografi
                </label>
                <textarea
                  id="biyografi"
                  name="biyografi"
                  rows={4}
                  value={formVeri.biyografi}
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
                {seciliEgitmen ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Eğitmen adı veya uzmanlık alanı ara..."
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
                    Eğitmen
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uzmanlık
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tecrübe
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Okul
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtrelenmisEgitmenler.length > 0 ? (
                  filtrelenmisEgitmenler.map((egitmen) => (
                    <tr key={egitmen.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={egitmen.gorsel}
                              alt={egitmen.ad}
                              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = 'https://via.placeholder.com/40?text=Eğitmen';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{egitmen.ad}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{egitmen.uzmanlık}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{egitmen.tecrube}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getOkulAdi(egitmen.okul_id)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => egitmenDuzenle(egitmen)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Düzenle
                        </button>
                        <button 
                          onClick={() => egitmenSil(egitmen.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      {aramaTerimi ? 'Aramanıza uygun eğitmen bulunamadı.' : 'Henüz hiç eğitmen kaydı bulunmamaktadır.'}
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

export default InstructorManagement; 