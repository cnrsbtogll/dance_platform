import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SchoolDetails() {
  const navigate = useNavigate();

  // Bileşen yüklendiğinde doğrudan ana yönetim paneline yönlendir
  useEffect(() => {
    // Kullanıcıyı ana yönetim sayfasına yönlendir
    navigate('/admin');
  }, [navigate]);

  // Yönlendirme yapılırken kısa bir yükleme mesajı göster
  return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <span className="ml-3 text-gray-700">Yönlendiriliyor...</span>
    </div>
  );
}

export default SchoolDetails; 