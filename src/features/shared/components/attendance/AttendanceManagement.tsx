import React from 'react';

interface AttendanceManagementProps {
  schoolInfo?: any;
  instructorId?: string;
  isAdmin?: boolean;
}

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({
  schoolInfo,
  instructorId,
  isAdmin = false
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Yoklama Takibi</h2>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin 
              ? 'Tüm kursların yoklama durumunu görüntüleyin ve yönetin'
              : 'Kurslarınızın yoklama durumunu görüntüleyin ve yönetin'}
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Yoklama özelliği yakında aktif olacak</h3>
          <p className="mt-1 text-sm text-gray-500">Bu özellik şu anda geliştirme aşamasındadır.</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement; 