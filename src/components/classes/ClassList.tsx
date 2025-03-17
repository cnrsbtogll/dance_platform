import React, { useState, useEffect, ReactNode } from 'react';
import { DanceClass, User } from '../../types';
import { getInstructorDanceClasses, deleteDanceClass } from '../../services/classService';

interface ClassListProps {
  user?: User | null;
  instructorId?: string;
  schoolId?: string;
  onEdit?: (classId: string) => void;
  onRefresh?: () => void;
  refreshKey?: number; // Yenilemeyi tetiklemek için sayaç
  emptyComponent?: ReactNode; // Boş durum için özel bileşen
}

const ClassList: React.FC<ClassListProps> = ({ 
  user, 
  instructorId, 
  schoolId, 
  onEdit, 
  onRefresh,
  refreshKey,
  emptyComponent
}) => {
  const [classes, setClasses] = useState<DanceClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  // Dersleri yükle
  useEffect(() => {
    if (!user && !instructorId && !schoolId) {
      setError('Oturum bilginiz veya eğitmen/okul kimliği bulunamadı.');
      setLoading(false);
      return;
    }
    
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let classData: DanceClass[] = [];
        
        console.log('Dersler çekiliyor:', { user, instructorId, schoolId });
        
        if (instructorId) {
          console.log('Eğitmen ID ile dersler çekiliyor:', instructorId);
          classData = await getInstructorDanceClasses(instructorId);
        } else if (schoolId) {
          console.log('Okul ID ile dersler çekiliyor:', schoolId);
          // Okul derslerini çekme fonksiyonu servise eklenebilir
          // classData = await getSchoolDanceClasses(schoolId);
        } else if (user && user.id) {
          console.log('Kullanıcı ID ile dersler çekiliyor:', user.id);
          classData = await getInstructorDanceClasses(user.id);
        }
        
        console.log('Çekilen ders verileri:', classData);
        setClasses(classData);
      } catch (err) {
        console.error('Dersler yüklenirken hata:', err);
        setError('Dersler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, [user, instructorId, schoolId, onRefresh, refreshKey]);
  
  // Dersi sil
  const handleDeleteClass = async (classId: string) => {
    // Silme işlemi için onay al
    const isConfirmed = window.confirm('Bu dersi silmek istediğinizden emin misiniz?');
    
    if (!isConfirmed) return;
    
    setDeleteLoading(classId);
    
    try {
      await deleteDanceClass(classId);
      setClasses(classes.filter(c => c.id !== classId));
    } catch (err) {
      console.error('Ders silinirken hata:', err);
      setError('Ders silinirken bir hata oluştu.');
    } finally {
      setDeleteLoading(null);
    }
  };
  
  // Dans stiline göre renk
  const getDanceStyleColor = (style: string) => {
    switch (style) {
      case 'salsa':
        return 'bg-red-500';
      case 'bachata':
        return 'bg-purple-500';
      case 'kizomba':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Seviyeye göre renk
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-orange-500';
      case 'professional':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Türkçe seviye adı
  const getLevelName = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Başlangıç';
      case 'intermediate':
        return 'Orta';
      case 'advanced':
        return 'İleri';
      case 'professional':
        return 'Profesyonel';
      default:
        return level;
    }
  };
  
  // Türkçe dans stili adı
  const getDanceStyleName = (style: string) => {
    switch (style) {
      case 'salsa':
        return 'Salsa';
      case 'bachata':
        return 'Bachata';
      case 'kizomba':
        return 'Kizomba';
      case 'other':
        return 'Diğer';
      default:
        return style;
    }
  };
  
  // Tarihi formatla
  const formatDate = (date: Date | any) => {
    if (!date) return '';
    
    const d = new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  if (loading) {
    return <div className="text-center py-8">Dersler yükleniyor...</div>;
  }
  
  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }
  
  if (classes.length === 0) {
    // Özel boş durum bileşeni varsa onu göster
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    
    // Yoksa varsayılan boş durum mesajını göster
    return (
      <div className="text-center py-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-gray-500">Henüz aktif ders bulunmuyor.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ders
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stil / Seviye
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tarih / Saat
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Katılımcılar
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Durum
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {classes.map((danceClass) => (
            <tr key={danceClass.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {danceClass.imageUrl ? (
                    <img 
                      src={danceClass.imageUrl} 
                      alt={danceClass.name} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getDanceStyleColor(danceClass.danceStyle)} text-white font-bold`}>
                      {getDanceStyleName(danceClass.danceStyle).charAt(0)}
                    </div>
                  )}
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{danceClass.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {danceClass.description.substring(0, 50)}{danceClass.description.length > 50 ? '...' : ''}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-wrap gap-1">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDanceStyleColor(danceClass.danceStyle)} text-white`}>
                    {getDanceStyleName(danceClass.danceStyle)}
                  </span>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(danceClass.level)} text-white`}>
                    {getLevelName(danceClass.level)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{formatDate(danceClass.date)}</div>
                <div className="text-sm text-gray-500">{danceClass.time}</div>
                {danceClass.recurring && (
                  <div className="mt-1">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Tekrarlanan
                    </span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-2 w-full bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${
                        danceClass.currentParticipants / danceClass.maxParticipants > 0.8
                          ? 'bg-red-500'
                          : danceClass.currentParticipants / danceClass.maxParticipants > 0.5
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${(danceClass.currentParticipants / danceClass.maxParticipants) * 100}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-700">
                    {danceClass.currentParticipants} / {danceClass.maxParticipants}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  danceClass.status === 'active' ? 'bg-green-100 text-green-800' : 
                  danceClass.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                  danceClass.status === 'completed' ? 'bg-gray-100 text-gray-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {danceClass.status === 'active' ? 'Aktif' : 
                   danceClass.status === 'cancelled' ? 'İptal' : 
                   danceClass.status === 'completed' ? 'Tamamlandı' : 
                   danceClass.status === 'draft' ? 'Taslak' : 
                   'Aktif'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(danceClass.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Düzenle
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClass(danceClass.id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={deleteLoading === danceClass.id}
                  >
                    {deleteLoading === danceClass.id ? 'Siliniyor...' : 'Sil'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassList;