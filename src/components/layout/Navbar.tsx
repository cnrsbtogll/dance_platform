import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from '../../services/authService';
import { User as UserType } from '../../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

// Navbar bileşeni için prop tipleri
interface NavbarProps {
  isAuthenticated: boolean;
  user?: UserType | null;
}

function Navbar({ isAuthenticated, user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  // Kullanıcı rollerini kontrol et
  const hasInstructorRole = user?.role?.includes('instructor');
  const hasSchoolAdminRole = user?.role?.includes('school_admin');
  const hasSuperAdminRole = user?.role?.includes('admin');
  const hasStudentRole = user?.role?.includes('student') || 
                       (!hasInstructorRole && !hasSchoolAdminRole && !hasSuperAdminRole && isAuthenticated);

  // Profil fotoğrafını Firestore'dan getir
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user || !user.id) {
        setProfilePhotoURL("/assets/placeholders/dance-partner-placeholder.svg");
        return;
      }
      
      try {
        // Konsola yazdırma
        console.log('👤 Kullanıcı profil fotoğrafı kontrolü:', {
          photoURL: user.photoURL,
          isPlaceholder: user.photoURL?.startsWith('profile-photo:')
        });
        
        // Firebase Auth'dan gelen photoURL kontrol et
        if (user.photoURL && !user.photoURL.startsWith('profile-photo:')) {
          console.log('✅ Firebase Auth profil fotoğrafı kullanılıyor');
          setProfilePhotoURL(user.photoURL);
          return;
        }
        
        // Firestore'dan kullanıcı dokümanını kontrol et
        const userDoc = await getDoc(doc(db, 'users', user.id));
        
        // Firestore'da photoURL varsa kullan, hasUploadedProfilePhoto kontrolü zorunlu değil
        if (userDoc.exists() && userDoc.data().photoURL) {
          console.log('✅ Firestore profil fotoğrafı bulundu!');
          
          // Önbellekleme sorunlarını önlemek için zaman damgası ekle
          const photoURL = userDoc.data().photoURL;
          setProfilePhotoURL(`${photoURL}${photoURL.includes('?') ? '&' : '?'}t=${Date.now()}`);
        } else {
          console.log('⚠️ Kullanıcı henüz profil fotoğrafı yüklememiş, placeholder gösteriliyor');
          setProfilePhotoURL("/assets/placeholders/dance-partner-placeholder.svg");
        }
      } catch (error) {
        console.error("⛔ Profil fotoğrafı getirme hatası:", error);
        setProfilePhotoURL("/assets/placeholders/dance-partner-placeholder.svg");
      }
    };

    // Profil fotoğrafı değiştiğinde hemen getir
    fetchProfilePhoto();
    
    // Her 30 saniyede bir profil fotoğrafını kontrol et (opsiyonel - önbellekleme sorunlarını çözmek için)
    const intervalId = setInterval(fetchProfilePhoto, 30000);
    
    return () => clearInterval(intervalId);
  }, [user?.id, user?.photoURL]); // photoURL'deki değişimleri de izle

  const handleLogout = async (): Promise<void> => {
    try {
      // Çıkış yapmadan önce iletişim bilgisini temizle
      localStorage.removeItem('contactStatus');
      
      // Diğer sayfalar arası paylaşılan verileri de temizle
      localStorage.removeItem('lastEmailUsed');
      
      await signOut();
      navigate('/'); // Ana sayfaya yönlendir
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const toggleMenu = (): void => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = (): void => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  // Aktif sayfayı belirlemek için yardımcı fonksiyon
  const isActive = (path: string): boolean => {
    // Ana sayfa kontrolü - artık doğrudan '/' sayfası için kontrol ediyoruz
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    // Diğer sayfalar için normal kontrol - eğer ana sayfa değilse
    if (path !== '/' && path !== '') {
      return location.pathname.startsWith(path);
    }
    return false;
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50 backdrop-blur-sm bg-white/90">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center group transition-all duration-300 ease-in-out">
                {/* Modern gradient logo with dance icon */}
                <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md transform group-hover:scale-105 transition-all duration-300">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-white" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Stylized dancing figure */}
                    <path d="M17 4c0 1.105-0.895 2-2 2s-2-0.895-2-2 0.895-2 2-2 2 0.895 2 2z" fill="currentColor" stroke="none" />
                    <path d="M13 7l-2 5l2 2l4 1l1-4l-2-1l-1-3" />
                    <path d="M9 12l-2 2l-4 0l0 4l4 0l3 -3" />
                    <path d="M7 21l2 -5" />
                    <path d="M15 21l-2 -5" />
                  </svg>
                </div>
                {/* Modern site name with gradient text */}
                <span className="ml-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight group-hover:tracking-wide transition-all duration-300">Dans Platformu</span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link 
                to="/partners" 
                className={`${isActive('/partners') 
                  ? 'border-indigo-500 text-indigo-700 font-medium' 
                  : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-400'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
              >
                Partner Bul
              </Link>
              <Link 
                to="/classes" 
                className={`${isActive('/classes') 
                  ? 'border-indigo-500 text-indigo-700 font-medium' 
                  : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-400'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
              >
                Dans Kursu Bul
              </Link>
              <Link 
                to="/progress" 
                className={`${isActive('/progress') 
                  ? 'border-indigo-500 text-indigo-700 font-medium' 
                  : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-400'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
              >
                İlerleme Durumum
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <>
                {/* Admin Panel Butonları */}
                {hasSuperAdminRole && (
                  <Link
                    to="/admin"
                    className="mr-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Admin Panel
                  </Link>
                )}
                {hasSchoolAdminRole && !hasSuperAdminRole && (
                  <Link
                    to="/school-admin"
                    className="mr-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Okul Yönetimi Paneli
                  </Link>
                )}
                {hasInstructorRole && !hasSchoolAdminRole && !hasSuperAdminRole && (
                  <Link
                    to="/instructor"
                    className="mr-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Eğitmen Paneli
                  </Link>
                )}
                {/* Öğrenci Teşvik Butonları */}
                {hasStudentRole && (
                  <>
                    <Link
                      to="/become-school"
                      className="mr-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Dans Okulu Aç
                    </Link>
                    <Link
                      to="/become-instructor"
                      className="mr-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Eğitmen Ol
                    </Link>
                  </>
                )}

                <div className="ml-3 relative">
                  <div className="flex items-center">
                    {/* Kullanıcı Bilgileri - Masaüstü */}
                    <div className="hidden md:block mr-3 text-right">
                      <div className="text-sm font-medium text-gray-800">{user?.displayName || 'Kullanıcı'}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[140px]">{user?.email || ''}</div>
                    </div>
                    <button
                      onClick={toggleProfileMenu}
                      className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md"
                    >
                      <img
                        className="h-9 w-9 rounded-full object-cover"
                        src={profilePhotoURL || "/assets/placeholders/dance-partner-placeholder.svg"}
                        alt="Profil"
                      />
                    </button>
                  </div>
                  {isProfileMenuOpen && (
                    <div 
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200"
                    >
                      <div className="rounded-lg bg-white shadow-xs py-1">
                        {/* Kullanıcı Bilgileri - Dropdown */}
                        <div className="block px-4 py-2 border-b border-gray-100">
                          <div className="text-sm font-medium text-gray-800">{user?.displayName || 'Kullanıcı'}</div>
                          <div className="text-xs text-gray-500 truncate">{user?.email || ''}</div>
                        </div>
                        {/* Profil linki - rolüne göre farklı profil sayfasına yönlendirme */}
                        {hasSuperAdminRole ? (
                          <Link
                            to="/profile?type=admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Admin Profilim
                          </Link>
                        ) : hasSchoolAdminRole ? (
                          <Link
                            to="/profile?type=school"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Okul Profilim
                          </Link>
                        ) : hasInstructorRole ? (
                          <Link
                            to="/profile?type=instructor"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Eğitmen Profilim
                          </Link>
                        ) : (
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            Profilim
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150"
                        >
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Giriş yapmamış kullanıcılar için butonlar */
              <div className="flex space-x-3">
                <Link
                  to="/become-instructor"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Eğitmen Başvurusu
                </Link>
                <Link
                  to="/become-school"
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Okul Kaydı Oluştur
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                >
                  Kayıt Ol
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobil için hamburger menüsü */}
      {isMenuOpen && (
        <div className="sm:hidden animate-fadeIn fixed top-16 left-0 right-0 z-40 bg-white shadow-lg">
          <div className="pt-1 pb-1 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm">
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-3">
                  <div className="flex-shrink-0">
                    <img
                      className="h-6 w-6 rounded-full object-cover shadow-sm"
                      src={profilePhotoURL || "/assets/placeholders/dance-partner-placeholder.svg"}
                      alt="Profil"
                    />
                  </div>
                  <div className="ml-2">
                    <div className="text-sm font-medium leading-none text-gray-800">{user?.displayName || 'Kullanıcı'}</div>
                    <div className="text-xs font-medium leading-none text-gray-500 mt-0.5">{user?.email || ''}</div>
                  </div>
                </div>
                <div className="mt-1 space-y-0 px-2">
                  <Link
                    to="/partners"
                    className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Partner Bul
                  </Link>
                  <Link
                    to="/classes"
                    className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dans Kursu Bul
                  </Link>
                  <Link
                    to="/progress"
                    className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    İlerleme Durumum
                  </Link>
                  
                  {/* Admin Panel Linkleri - Mobil */}
                  {hasSuperAdminRole && (
                    <Link
                      to="/admin"
                      className="block px-3 py-1 mt-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-colors duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  {hasSchoolAdminRole && !hasSuperAdminRole && (
                    <Link
                      to="/school-admin"
                      className="block px-3 py-1 mt-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-colors duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Okul Yönetimi Paneli
                    </Link>
                  )}
                  {hasInstructorRole && !hasSchoolAdminRole && !hasSuperAdminRole && (
                    <Link
                      to="/instructor"
                      className="block px-3 py-1 mt-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-colors duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Eğitmen Paneli
                    </Link>
                  )}
                  
                  {/* Öğrenci Teşvik Butonları - Mobil */}
                  {hasStudentRole && (
                    <>
                      <Link
                        to="/become-school"
                        className="block px-3 py-1 mt-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-colors duration-150"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dans Okulu Aç
                      </Link>
                      <Link
                        to="/become-instructor"
                        className="block px-3 py-1 mt-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 transition-colors duration-150"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Eğitmen Ol
                      </Link>
                    </>
                  )}
                  
                  {/* Profil linki - Mobil versiyon */}
                  {hasSuperAdminRole ? (
                    <Link
                      to="/profile?type=admin"
                      className="block px-3 py-1 rounded-md text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Profilim
                    </Link>
                  ) : hasSchoolAdminRole ? (
                    <Link
                      to="/profile?type=school"
                      className="block px-3 py-1 rounded-md text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Okul Profilim
                    </Link>
                  ) : hasInstructorRole ? (
                    <Link
                      to="/profile?type=instructor"
                      className="block px-3 py-1 rounded-md text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Eğitmen Profilim
                    </Link>
                  ) : (
                    <Link
                      to="/profile"
                      className="block px-3 py-1 rounded-md text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profilim
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-1 rounded-md text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </>
            ) : (
              /* Giriş yapmamış kullanıcılar için menü */
              <div className="px-2 py-1 space-y-0">
                <Link 
                  to="/partners"
                  className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Partner Bul
                </Link>
                <Link 
                  to="/classes"
                  className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dans Kursu Bul
                </Link>
                <Link 
                  to="/progress"
                  className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  İlerleme Durumum
                </Link>
                
                <div className="pt-1 mt-1 border-t border-gray-200 space-y-1">
                  <Link 
                    to="/become-instructor"
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Eğitmen Başvurusu
                    </div>
                  </Link>
                  <Link 
                    to="/become-school"
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Okul Kaydı Oluştur
                    </div>
                  </Link>
                  <Link 
                    to="/signup" 
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Kayıt Ol
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;