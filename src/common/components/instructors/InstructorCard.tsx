import React from 'react';
import { Link } from 'react-router-dom';
import { Instructor, UserWithProfile } from '../../../types';

interface InstructorWithUser extends Instructor {
  user: UserWithProfile;
}

interface InstructorCardProps {
  instructor: InstructorWithUser;
  index?: number;
  showDetailLink?: boolean;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ 
  instructor, 
  index = 0,
  showDetailLink = true 
}) => {
  // Kart içeriği
  const cardContent = (
    <>
      <div className="h-64 bg-gray-200 relative overflow-hidden">
        <img
          src={instructor.user.photoURL || `/assets/images/dance/egitmen${(index % 4) + 1}.jpg`}
          alt={instructor.user.displayName || "Eğitmen"}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          style={{ objectPosition: 'center top' }}
        />
      </div>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-800">
          {instructor.user.displayName || "Eğitmen"}
        </h3>
        <p className="text-indigo-600 font-medium mb-1">
          Dans Eğitmeni
        </p>
        <div className="flex items-center mb-2">
          <span className="text-yellow-400 mr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </span>
          <span className="text-gray-600">{(instructor.rating || 0).toFixed(1)}</span>
          <span className="text-gray-400 text-sm ml-1">({instructor.reviewCount || 0} değerlendirme)</span>
        </div>
        <div className="text-sm text-gray-500">
          <p><span className="font-medium">Tecrübe:</span> {instructor.experience || 0} yıl</p>
          <p><span className="font-medium">Uzmanlık:</span> {
            instructor.specialties && instructor.specialties.length > 0 
              ? instructor.specialties.join(', ') 
              : "Çeşitli Dans Stilleri"
          }</p>
        </div>
      </div>
    </>
  );

  // Eğer showDetailLink true ise, kartı link olarak göster
  if (showDetailLink) {
    return (
      <Link
        to={`/instructors/${instructor.id}`}
        className="bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden"
      >
        {cardContent}
      </Link>
    );
  }

  // Link olmayan versiyon
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {cardContent}
    </div>
  );
};

export default InstructorCard; 