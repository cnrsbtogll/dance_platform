import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';

interface DanceStyle {
  id: string;
  label: string;
  value: string;
  createdAt?: any;
  updatedAt?: any;
}

interface FormData {
  label: string;
  value: string;
}

function DanceStyleManagement(): JSX.Element {
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<DanceStyle | null>(null);
  const [formData, setFormData] = useState<FormData>({
    label: '',
    value: ''
  });

  // Fetch dance styles from Firestore
  const fetchDanceStyles = async () => {
    setLoading(true);
    setError(null);
    try {
      const danceStylesRef = collection(db, 'danceStyles');
      const q = query(danceStylesRef, orderBy('label'));
      const querySnapshot = await getDocs(q);
      
      const styles: DanceStyle[] = [];
      querySnapshot.forEach((doc) => {
        styles.push({
          id: doc.id,
          ...doc.data()
        } as DanceStyle);
      });
      
      setDanceStyles(styles);
    } catch (err) {
      console.error('Error fetching dance styles:', err);
      setError('Dans stilleri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchDanceStyles();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate slug value from label
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD') // normalize accents
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-z0-9]/g, '-') // replace non-alphanumeric chars with hyphens
      .replace(/-+/g, '-') // collapse multiple hyphens
      .replace(/^-|-$/g, ''); // remove leading/trailing hyphens
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.label.trim()) {
      setError('Dans stili adı boş olamaz.');
      return;
    }
    
    // Generate value from label if not provided
    const styleValue = formData.value.trim() || generateSlug(formData.label);
    
    setLoading(true);
    setError(null);
    
    try {
      if (isEditing && selectedStyle) {
        // Update existing style
        const styleRef = doc(db, 'danceStyles', selectedStyle.id);
        await updateDoc(styleRef, {
          label: formData.label,
          value: styleValue,
          updatedAt: serverTimestamp()
        });
      } else {
        // Add new style
        await addDoc(collection(db, 'danceStyles'), {
          label: formData.label,
          value: styleValue,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      // Reset form and fetch updated styles
      resetForm();
      fetchDanceStyles();
    } catch (err) {
      console.error('Error saving dance style:', err);
      setError('Dans stili kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit style
  const handleEdit = (style: DanceStyle) => {
    setSelectedStyle(style);
    setFormData({
      label: style.label,
      value: style.value
    });
    setIsEditing(true);
  };

  // Handle delete style
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu dans stilini silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteDoc(doc(db, 'danceStyles', id));
      fetchDanceStyles();
    } catch (err) {
      console.error('Error deleting dance style:', err);
      setError('Dans stili silinirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      label: '',
      value: ''
    });
    setSelectedStyle(null);
    setIsEditing(false);
    setError(null);
  };

  // Initialize Firestore with default styles if empty
  const initializeDefaultStyles = async () => {
    if (danceStyles.length === 0 && !loading) {
      setLoading(true);
      
      const defaultStyles = [
        { label: 'Salsa', value: 'salsa' },
        { label: 'Bachata', value: 'bachata' },
        { label: 'Kizomba', value: 'kizomba' },
        { label: 'Tango', value: 'tango' },
        { label: 'Vals', value: 'vals' }
      ];
      
      try {
        for (const style of defaultStyles) {
          await addDoc(collection(db, 'danceStyles'), {
            ...style,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        fetchDanceStyles();
      } catch (err) {
        console.error('Error initializing default styles:', err);
        setError('Varsayılan dans stilleri eklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Dans Stilleri Yönetimi</h2>
        
        {danceStyles.length === 0 && !loading && (
          <button 
            onClick={initializeDefaultStyles}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Varsayılan Stilleri Yükle
          </button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* Form for adding/editing dance styles */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {isEditing ? 'Dans Stili Düzenle' : 'Yeni Dans Stili Ekle'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                Dans Stili Adı*
              </label>
              <input
                type="text"
                id="label"
                name="label"
                required
                value={formData.label}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Örn: Salsa"
              />
            </div>
            
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Teknik Değer (Boş bırakılırsa otomatik oluşturulur)
              </label>
              <input
                type="text"
                id="value"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Örn: salsa"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                İptal
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {loading ? 'İşleniyor...' : isEditing ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
      
      {/* List of dance styles */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-700">Yükleniyor...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dans Stili
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teknik Değer
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {danceStyles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    Henüz dans stili eklenmemiş.
                  </td>
                </tr>
              ) : (
                danceStyles.map((style) => (
                  <tr key={style.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{style.label}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{style.value}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(style)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDelete(style.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DanceStyleManagement; 