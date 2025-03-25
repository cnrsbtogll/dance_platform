import React from 'react';
import { School } from '../../../../types';

interface SchoolProfileProps {
  school: School;
  className?: string;
  variant?: 'row' | 'card';
}

export const SchoolProfile: React.FC<SchoolProfileProps> = ({ 
  school, 
  className = '',
  variant = 'row'
}) => {
  if (variant === 'row') {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="text-sm text-gray-900">
          {school.displayName || '-'}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center space-x-3">
        {school.photoURL && (
          <img 
            src={school.photoURL} 
            alt={school.displayName}
            className="h-10 w-10 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="text-sm font-medium text-gray-900">{school.displayName}</h3>
          <p className="text-sm text-gray-500">{school.email}</p>
        </div>
      </div>
      {(school.phoneNumber || school.address || school.city) && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {school.phoneNumber && (
            <div className="text-sm">
              <span className="text-gray-500">Telefon:</span>{' '}
              <span className="text-gray-900">{school.phoneNumber}</span>
            </div>
          )}
          {school.address && (
            <div className="text-sm">
              <span className="text-gray-500">Adres:</span>{' '}
              <span className="text-gray-900">{school.address}</span>
            </div>
          )}
          {school.city && (
            <div className="text-sm">
              <span className="text-gray-500">Şehir:</span>{' '}
              <span className="text-gray-900">{school.city}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchoolProfile; 