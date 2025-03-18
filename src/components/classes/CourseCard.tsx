import React, { useState } from 'react';
import { DanceClass } from '../../types';
import { Link } from 'react-router-dom';

interface CourseCardProps {
  course: DanceClass;
  onEnroll?: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Dans stiline göre renk
  const getDanceStyleColor = (style: string) => {
    switch (style) {
      case 'salsa':
        return 'bg-red-500';
      case 'bachata':
        return 'bg-purple-500';
      case 'kizomba':
        return 'bg-blue-500';
      case 'tango':
        return 'bg-orange-500';
      case 'vals':
        return 'bg-cyan-600';
      case 'hiphop':
        return 'bg-indigo-600';
      case 'modern-dans':
        return 'bg-green-500';
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
      case 'tango':
        return 'Tango';
      case 'vals':
        return 'Vals';
      case 'hiphop':
        return 'Hip Hop';
      case 'modern-dans':
        return 'Modern Dans';
      case 'bale':
        return 'Bale';
      case 'flamenko':
        return 'Flamenko';
      case 'zeybek':
        return 'Zeybek';
      case 'jazz':
        return 'Jazz';
      case 'breakdance':
        return 'Breakdance';
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

  // Ders zamanını formatla
  const formatSchedule = () => {
    if (course.recurring && course.daysOfWeek?.length) {
      const days = course.daysOfWeek
        .map(day => {
          switch (day.toLowerCase()) {
            case 'monday': return 'Pts';
            case 'tuesday': return 'Sal';
            case 'wednesday': return 'Çar';
            case 'thursday': return 'Per';
            case 'friday': return 'Cum';
            case 'saturday': return 'Cts';
            case 'sunday': return 'Paz';
            default: return day.substring(0, 3);
          }
        })
        .join(', ');
      return `${days} ${course.time}`;
    }
    return `${formatDate(course.date)} ${course.time}`;
  };

  // Fiyatı formatla (1000 -> 1.000 ₺)
  const formatPrice = () => {
    const currencySymbol = course.currency === 'TRY' ? '₺' : course.currency === 'USD' ? '$' : '€';
    return `${course.price.toLocaleString('tr-TR')} ${currencySymbol}`;
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Resim Konteyner ve Overlay */}
        <div className="relative h-56 overflow-hidden group">
          <img 
            src={course.imageUrl || `https://via.placeholder.com/400x250?text=${encodeURIComponent(getDanceStyleName(course.danceStyle))}`} 
            alt={course.name} 
            className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"></div>
          
          {/* Seviye rozeti */}
          <div className={`absolute top-4 right-4 ${getLevelColor(course.level)} text-white px-3 py-1 text-sm font-medium rounded-full shadow-lg`}>
            {getLevelName(course.level)}
          </div>
          
          {/* Zamanlama rozeti */}
          <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm text-gray-800 px-3 py-1 text-sm font-medium rounded-full flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatSchedule()}
          </div>
        </div>
      </div>

      {/* Kurs Bilgileri */}
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex space-x-2 mb-2">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDanceStyleColor(course.danceStyle)} text-white`}>
                {getDanceStyleName(course.danceStyle)}
              </span>
              {course.recurring && (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                  Periyodik
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{course.name}</h3>
            <p className="text-sm text-gray-500 mb-3">
              {course.instructorName} 
              {course.schoolName && ` • ${course.schoolName}`}
            </p>
          </div>
          <div className="text-lg font-bold text-indigo-600">
            {formatPrice()}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
          {course.description}
        </p>
        
        {/* Katılımcı durumu */}
        <div className="mb-4">
          <div className="flex items-center mb-1">
            <div className="h-2 w-full bg-gray-200 rounded-full">
              <div 
                className={`h-2 rounded-full ${
                  course.currentParticipants / course.maxParticipants > 0.8
                    ? 'bg-red-500'
                    : course.currentParticipants / course.maxParticipants > 0.5
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${(course.currentParticipants / course.maxParticipants) * 100}%` }}
              ></div>
            </div>
            <span className="ml-2 text-xs text-gray-700">
              {course.currentParticipants} / {course.maxParticipants}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {course.currentParticipants === course.maxParticipants 
              ? 'Kontenjan dolu' 
              : `${course.maxParticipants - course.currentParticipants} kişilik kontenjan kaldı`}
          </p>
        </div>
        
        {/* Butonlar */}
        <div className="flex space-x-2">
          <Link 
            to={`/classes/${course.id}`} 
            className="flex-1 py-2 px-4 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center"
          >
            Detaylar
          </Link>
          {onEnroll && (
            <button
              onClick={() => onEnroll(course.id)}
              disabled={course.currentParticipants >= course.maxParticipants}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md ${
                course.currentParticipants >= course.maxParticipants
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
            >
              Katıl
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard; 