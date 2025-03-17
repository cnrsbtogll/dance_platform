import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDanceClass } from '../../services/classService';
import { DanceStyle, DanceLevel, User, DanceClass } from '../../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface CreateClassFormProps {
  user?: User | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateClassForm: React.FC<CreateClassFormProps> = ({ user, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [instructorName, setInstructorName] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<{ id: string; name: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    danceStyle: 'salsa' as DanceStyle,
    level: 'beginner' as DanceLevel,
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      latitude: 0,
      longitude: 0,
    },
    price: 0,
    currency: 'TRY' as 'TRY' | 'USD' | 'EUR',
    duration: 60, // Default 60 minutes
    maxParticipants: 15,
    date: '',
    time: '',
    recurring: false,
    daysOfWeek: [] as string[],
    imageUrl: '',
    status: 'active' as 'active' | 'cancelled' | 'completed' | 'draft',
  });
  
  // Get instructor and school info
  useEffect(() => {
    if (!user) return;
    
    const fetchUserInfo = async () => {
      try {
        setInstructorName(user.displayName);
        
        // If user has a schoolId, fetch school info
        if (user.schoolId) {
          const schoolDocRef = doc(db, 'users', user.schoolId);
          const schoolDoc = await getDoc(schoolDocRef);
          
          if (schoolDoc.exists()) {
            const schoolData = schoolDoc.data();
            setSchoolInfo({
              id: user.schoolId,
              name: schoolData.displayName || 'İsimsiz Okul'
            });
            
            // Pre-fill location if school has address info
            if (schoolData.address) {
              setFormData(prev => ({
                ...prev,
                location: {
                  ...prev.location,
                  address: schoolData.address,
                  city: schoolData.city || '',
                  state: schoolData.state || '',
                  zipCode: schoolData.zipCode || ''
                }
              }));
            }
          }
        }
      } catch (err) {
        console.error('Kullanıcı bilgileri alınırken hata:', err);
      }
    };
    
    fetchUserInfo();
  }, [user]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle nested location fields
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle days of week selection
  const handleDayToggle = (day: string) => {
    setFormData(prev => {
      const currentDays = [...prev.daysOfWeek];
      
      if (currentDays.includes(day)) {
        return {
          ...prev,
          daysOfWeek: currentDays.filter(d => d !== day)
        };
      } else {
        return {
          ...prev,
          daysOfWeek: [...currentDays, day]
        };
      }
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Oturum bilginiz bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Ders adı zorunludur');
      }
      
      if (!formData.danceStyle) {
        throw new Error('Dans stili seçilmelidir');
      }
      
      if (formData.price < 0) {
        throw new Error('Fiyat negatif olamaz');
      }
      
      // Create class data object with partial DanceClass type
      const classData: Partial<DanceClass> = {
        ...formData,
        instructorId: user.id,
        instructorName: user.displayName || 'İsimsiz Eğitmen',
        currentParticipants: 0,
        // Convert date string to Date object
        date: formData.date ? new Date(formData.date) : new Date(),
      };
      
      // Sadece schoolId ve schoolName varsa ekleyin, yoksa undefined göndermeyin
      if (schoolInfo?.id) {
        classData.schoolId = schoolInfo.id;
      }
      
      if (schoolInfo?.name) {
        classData.schoolName = schoolInfo.name;
      }
      
      // Call service to create class
      await createDanceClass(classData as DanceClass);
      
      setSuccess(true);
      console.log('Dans dersi başarıyla eklendi!', classData);
      
      setFormData({
        name: '',
        description: '',
        danceStyle: 'salsa' as DanceStyle,
        level: 'beginner' as DanceLevel,
        location: {
          address: '',
          city: '',
          state: '',
          zipCode: '',
          latitude: 0,
          longitude: 0,
        },
        price: 0,
        currency: 'TRY' as 'TRY' | 'USD' | 'EUR',
        duration: 60,
        maxParticipants: 15,
        date: '',
        time: '',
        recurring: false,
        daysOfWeek: [],
        imageUrl: '',
        status: 'active' as 'active' | 'cancelled' | 'completed' | 'draft',
      });
      
      if (onSuccess) {
        console.log('onSuccess geri çağrısı çalıştırılıyor...');
        onSuccess();
      }
      
    } catch (err) {
      console.error('Ders oluşturulurken hata:', err);
      setError(err instanceof Error ? err.message : 'Ders oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Yeni Dans Dersi Oluştur</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
          Ders başarıyla oluşturuldu!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ders Adı */}
          <div className="col-span-2">
            <label className="block text-gray-700 mb-2" htmlFor="name">
              Ders Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {/* Açıklama */}
          <div className="col-span-2">
            <label className="block text-gray-700 mb-2" htmlFor="description">
              Ders Açıklaması
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* Dans Stili */}
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="danceStyle">
              Dans Stili <span className="text-red-500">*</span>
            </label>
            <select
              id="danceStyle"
              name="danceStyle"
              value={formData.danceStyle}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="salsa">Salsa</option>
              <option value="bachata">Bachata</option>
              <option value="kizomba">Kizomba</option>
              <option value="other">Diğer</option>
            </select>
          </div>
          
          {/* Seviye */}
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="level">
              Seviye <span className="text-red-500">*</span>
            </label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="beginner">Başlangıç</option>
              <option value="intermediate">Orta</option>
              <option value="advanced">İleri</option>
              <option value="professional">Profesyonel</option>
            </select>
          </div>
          
          {/* Adres */}
          <div className="col-span-2">
            <label className="block text-gray-700 mb-2" htmlFor="location.address">
              Adres <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location.address"
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {/* Şehir ve İlçe */}
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="location.city">
              Şehir <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location.city"
              name="location.city"
              value={formData.location.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="location.state">
              İlçe
            </label>
            <input
              type="text"
              id="location.state"
              name="location.state"
              value={formData.location.state}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* Fiyat */}
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="price">
              Fiyat <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {/* Para Birimi */}
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="currency">
              Para Birimi
            </label>
            <select
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="TRY">TL (₺)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
          
          {/* Süre */}
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="duration">
              Süre (dakika) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="15"
              step="15"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {/* Kapasite */}
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="maxParticipants">
              Maksimum Katılımcı <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="maxParticipants"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {/* Tarih */}
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="date">
              Başlangıç Tarihi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {/* Saat */}
          <div>
            <label className="block text-gray-700 mb-2" htmlFor="time">
              Başlangıç Saati <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {/* Tekrarlama */}
          <div className="col-span-2">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="recurring"
                name="recurring"
                checked={formData.recurring}
                onChange={handleCheckboxChange}
                className="h-5 w-5 text-indigo-600"
              />
              <label className="ml-2 text-gray-700" htmlFor="recurring">
                Tekrarlanan Ders
              </label>
            </div>
            
            {formData.recurring && (
              <div className="mt-3">
                <label className="block text-gray-700 mb-2">Haftanın Günleri</label>
                <div className="flex flex-wrap gap-2">
                  {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        formData.daysOfWeek.includes(day)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Görsel URL */}
          <div className="col-span-2">
            <label className="block text-gray-700 mb-2" htmlFor="imageUrl">
              Görsel URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          {/* Durum */}
          <div className="col-span-2">
            <label className="block text-gray-700 mb-2" htmlFor="status">
              Durum
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Aktif</option>
              <option value="draft">Taslak</option>
              <option value="cancelled">İptal Edildi</option>
              <option value="completed">Tamamlandı</option>
            </select>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
              disabled={loading}
            >
              İptal
            </button>
          )}
          
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClassForm; 