import React, { useState, useEffect } from 'react';
import { dansOkullari } from '../../data/dansVerileri';
import { collection, getDocs, doc, deleteDoc, getDoc, updateDoc, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Tip tanımlamaları
interface Egitmen {
  id: string;
  ad: string;
  uzmanlık: string;
  tecrube: string;
  biyografi: string;
  okul_id: number;
  gorsel: string;
  userId?: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
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
  email?: string;
  phoneNumber?: string;
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
    gorsel: '',
    email: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // İlk yüklemede verileri çek
  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Firestore'dan eğitmenleri çek
      const instructorsRef = collection(db, 'instructors');
      const q = query(instructorsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const instructorsData: Egitmen[] = [];
      querySnapshot.forEach((doc) => {
        instructorsData.push({
          id: doc.id,
          ...doc.data()
        } as Egitmen);
      });
      
      setEgitmenler(instructorsData);
      setLoading(false);
    } catch (err) {
      console.error('Eğitmenler getirilirken hata oluştu:', err);
      setError('Eğitmenler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setLoading(false);
    }
  };

  // Eğitmen düzenleme
  const egitmenDuzenle = (egitmen: Egitmen): void => {
    setSeciliEgitmen(egitmen);
    setFormVeri({
      ad: egitmen.ad,
      uzmanlık: egitmen.uzmanlık,
      tecrube: egitmen.tecrube,
      biyografi: egitmen.biyografi,
      okul_id: egitmen.okul_id,
      gorsel: egitmen.gorsel,
      email: egitmen.email || '',
      phoneNumber: egitmen.phoneNumber || ''
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
      gorsel: '/assets/images/dance/egitmen_default.jpg',
      email: '',
      phoneNumber: ''
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
  const formGonder = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    const okul_id = typeof formVeri.okul_id === 'string' 
      ? parseInt(formVeri.okul_id) 
      : formVeri.okul_id;
    
    try {
      if (seciliEgitmen) {
        // Mevcut eğitmeni güncelle
        const egitmenRef = doc(db, 'instructors', seciliEgitmen.id);
        
        await updateDoc(egitmenRef, {
          ad: formVeri.ad,
          uzmanlık: formVeri.uzmanlık,
          tecrube: formVeri.tecrube,
          biyografi: formVeri.biyografi,
          okul_id: okul_id,
          gorsel: formVeri.gorsel,
          updatedAt: serverTimestamp()
        });
        
        // State'i güncelle
        const guncellenenEgitmenler = egitmenler.map(egitmen => 
          egitmen.id === seciliEgitmen.id ? { 
            ...egitmen, 
            ad: formVeri.ad,
            uzmanlık: formVeri.uzmanlık,
            tecrube: formVeri.tecrube,
            biyografi: formVeri.biyografi,
            okul_id: okul_id,
            gorsel: formVeri.gorsel
          } : egitmen
        );
        setEgitmenler(guncellenenEgitmenler);
        
      } else {
        // Yeni eğitmen ekle
        const newInstructorData = {
          ad: formVeri.ad,
          uzmanlık: formVeri.uzmanlık,
          tecrube: formVeri.tecrube,
          biyografi: formVeri.biyografi,
          okul_id: okul_id,
          gorsel: formVeri.gorsel,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'instructors'), newInstructorData);
        
        // State'i güncelle
        const yeniEgitmen: Egitmen = {
          id: docRef.id,
          ...newInstructorData
        } as Egitmen;
        
        setEgitmenler([yeniEgitmen, ...egitmenler]);
      }
      
      // Formu kapat
      setDuzenlemeModu(false);
      setSeciliEgitmen(null);
      
    } catch (err) {
      console.error('Eğitmen kaydedilirken hata oluştu:', err);
      alert('Eğitmen kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Eğitmen silme
  const egitmenSil = async (id: string): Promise<void> => {
    if (window.confirm('Bu eğitmeni silmek istediğinizden emin misiniz?')) {
      try {
        // Firestore'dan sil
        await deleteDoc(doc(db, 'instructors', id));
        
        // State'i güncelle
        const filtrelenmisEgitmenler = egitmenler.filter(egitmen => egitmen.id !== id);
        setEgitmenler(filtrelenmisEgitmenler);
        
      } catch (err) {
        console.error('Eğitmen silinirken hata oluştu:', err);
        alert('Eğitmen silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p>{error}</p>
        <button 
          onClick={fetchInstructors} 
          className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-4 rounded"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

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
                  placeholder="https://ornek.com/foto.jpg"
                />
                
                {formVeri.gorsel && (
                  <div className="mt-2">
                    <img 
                      src={formVeri.gorsel} 
                      alt="Önizleme" 
                      className="h-20 w-20 object-cover rounded-md"
                      onError={(e) => { 
                        (e.target as HTMLImageElement).src = "/assets/images/dance/egitmen_default.jpg";
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDuzenlemeModu(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                {seciliEgitmen ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <input
              type="text"
              placeholder="İsim veya uzmanlık alanına göre ara..."
              value={aramaTerimi}
              onChange={(e) => setAramaTerimi(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          
          {filtrelenmisEgitmenler.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 mx-auto text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
              <p className="mt-2 text-gray-500">Eğitmen bulunamadı.</p>
            </div>
          ) : (
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
                      Dans Okulu
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tecrübe
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtrelenmisEgitmenler.map((egitmen) => (
                    <tr key={egitmen.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={egitmen.gorsel} 
                              alt={egitmen.ad} 
                              onError={(e) => { 
                                (e.target as HTMLImageElement).src = "/assets/images/dance/egitmen_default.jpg";
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{egitmen.ad}</div>
                            {egitmen.email && (
                              <div className="text-sm text-gray-500">{egitmen.email}</div>
                            )}
                            {egitmen.phoneNumber && (
                              <div className="text-sm text-gray-500">Tel: {egitmen.phoneNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{egitmen.uzmanlık}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getOkulAdi(egitmen.okul_id)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{egitmen.tecrube}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => egitmenDuzenle(egitmen)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      <div className="mt-8 bg-blue-50 p-4 rounded-md">
        <h3 className="text-blue-800 font-semibold">İpucu</h3>
        <p className="text-blue-700 text-sm mt-1">
          Eğitmen fotoğrafları, öğrencilerin eğitmeni tanıması için önemli bir faktördür.
          Yüksek kaliteli ve profesyonel fotoğraflar tercih edilmelidir.
        </p>
      </div>
    </div>
  );
}

export default InstructorManagement; 