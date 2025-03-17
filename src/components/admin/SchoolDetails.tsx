import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { motion } from 'framer-motion';

interface Okul {
  id: string;
  ad: string;
  aciklama: string;
  konum: string;
  iletisim: string;
  telefon: string;
  gorsel: string;
}

function SchoolDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [okul, setOkul] = useState<Okul | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Omit<Okul, 'id'>>({
    ad: '',
    aciklama: '',
    konum: '',
    iletisim: '',
    telefon: '',
    gorsel: '',
  });

  // Okul verilerini Firebase'den çek
  useEffect(() => {
    if (!id) return;

    const fetchOkul = async () => {
      setLoading(true);
      setError(null);
      try {
        const okulRef = doc(db, 'dansOkullari', id);
        const docSnap = await getDoc(okulRef);

        if (docSnap.exists()) {
          const okulData = { id: docSnap.id, ...docSnap.data() } as Okul;
          setOkul(okulData);
          setFormData({
            ad: okulData.ad || '',
            aciklama: okulData.aciklama || '',
            konum: okulData.konum || '',
            iletisim: okulData.iletisim || '',
            telefon: okulData.telefon || '',
            gorsel: okulData.gorsel || '',
          });
        } else {
          setError('Okul bulunamadı.');
        }
      } catch (err) {
        console.error('Okul verisi çekilirken hata oluştu:', err);
        setError('Okul bilgileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchOkul();
  }, [id]);

  // Form değişikliklerini işle
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Okul güncelle
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const okulRef = doc(db, 'dansOkullari', id);
      await updateDoc(okulRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });

      // Okul verilerini güncelle
      setOkul({ id, ...formData });
      setSuccess('Okul bilgileri başarıyla güncellendi.');
      setIsEditing(false);
    } catch (err) {
      console.error('Okul güncellenirken hata oluştu:', err);
      setError('Okul bilgileri güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Okul sil
  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm('Bu okulu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      setLoading(true);
      setError(null);
      
      try {
        const okulRef = doc(db, 'dansOkullari', id);
        await deleteDoc(okulRef);
        
        setSuccess('Okul başarıyla silindi.');
        // Yönlendirme yapılacak
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      } catch (err) {
        console.error('Okul silinirken hata oluştu:', err);
        setError('Okul silinirken bir hata oluştu. Lütfen tekrar deneyin.');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !okul) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4">
        <p>{error}</p>
        <button 
          onClick={() => navigate('/admin')}
          className="mt-2 text-indigo-600 hover:text-indigo-900"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Başarı ve Hata Mesajları */}
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p>{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Başlık ve Butonlar */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">{okul?.ad}</h1>
          <div className="flex space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-white text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-50"
                  disabled={loading}
                >
                  Düzenle
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                  disabled={loading}
                >
                  Sil
                </button>
              </>
            )}
            <button
              onClick={() => navigate('/admin')}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Geri Dön
            </button>
          </div>
        </div>

        {/* Içerik */}
        <div className="p-6">
          {isEditing ? (
            // Düzenleme formu
            <form onSubmit={handleUpdate}>
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
                    value={formData.ad}
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
                    value={formData.konum}
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
                    value={formData.iletisim}
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
                    value={formData.telefon}
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
                    rows={3}
                    value={formData.aciklama}
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
                    value={formData.gorsel}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? 'Kaydediliyor...' : 'Güncelle'}
                </button>
              </div>
            </form>
          ) : (
            // Okul detayları görünümü
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <img 
                    src={okul?.gorsel} 
                    alt={okul?.ad}
                    className="w-full h-auto rounded-lg shadow-md object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://via.placeholder.com/300x200?text=Dans+Okulu';
                    }}
                  />
                </div>
                
                <div className="md:w-2/3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Konum</h3>
                      <p className="mt-1">{okul?.konum || 'Belirtilmemiş'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">İletişim E-posta</h3>
                      <p className="mt-1">{okul?.iletisim || 'Belirtilmemiş'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Telefon</h3>
                      <p className="mt-1">{okul?.telefon || 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500">Açıklama</h3>
                    <p className="mt-1 text-gray-900 whitespace-pre-line">{okul?.aciklama || 'Açıklama bulunmuyor.'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SchoolDetails; 