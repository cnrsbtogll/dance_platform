import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from '../../services/authService';
import { User as UserType } from '../../types';

// Navbar bileşeni için prop tipleri
interface NavbarProps {
  isAuthenticated: boolean;
  user?: UserType | null;
}

function Navbar({ isAuthenticated, user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut();
      navigate('/signin');
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
    // Ana sayfa (/) için partner bul sayfasını aktif göster
    if (location.pathname === '/') {
      return path === '/partners';
    }
    // Diğer sayfalar için normal kontrol
    if (path === '/') {
      return false; // Ana sayfa hiçbir zaman aktif gösterilmeyecek
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 text-indigo-600" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span className="ml-2 text-xl font-bold text-gray-800">Dans Platformu</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                to="/partners" 
                className={`${isActive('/partners') 
                  ? 'border-indigo-500 text-indigo-700' 
                  : 'border-transparent text-gray-500 hover:border-indigo-500 hover:text-indigo-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Partner Bul
              </Link>
              <Link 
                to="/classes" 
                className={`${isActive('/classes') 
                  ? 'border-indigo-500 text-indigo-700' 
                  : 'border-transparent text-gray-500 hover:border-indigo-500 hover:text-indigo-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dans Kursları
              </Link>
              <Link 
                to="/progress" 
                className={`${isActive('/progress') 
                  ? 'border-indigo-500 text-indigo-700' 
                  : 'border-transparent text-gray-500 hover:border-indigo-500 hover:text-indigo-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                İlerleme Durumum
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex text-sm border-2 border-transparent rounded-full focus:outline-none focus:border-gray-300 transition duration-150 ease-in-out"
                  >
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={user?.photoURL || "https://via.placeholder.com/40?text=Kullanıcı"}
                      alt="Profil"
                    />
                  </button>
                </div>
                {isProfileMenuOpen && (
                  <div 
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg"
                  >
                    <div className="rounded-md bg-white shadow-xs">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Profilim
                        </Link>
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Yönetim Paneli
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsProfileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Çıkış Yap
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/signin" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150"
              >
                Giriş Yap
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button 
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out"
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

      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/partners"
              className={`block pl-3 pr-4 py-2 border-l-4 ${isActive('/partners') 
                ? 'border-indigo-500 text-indigo-700 bg-indigo-50' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-700'} text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              Partner Bul
            </Link>
            <Link
              to="/classes"
              className={`block pl-3 pr-4 py-2 border-l-4 ${isActive('/classes') 
                ? 'border-indigo-500 text-indigo-700 bg-indigo-50' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-700'} text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dans Kursları
            </Link>
            <Link
              to="/progress"
              className={`block pl-3 pr-4 py-2 border-l-4 ${isActive('/progress') 
                ? 'border-indigo-500 text-indigo-700 bg-indigo-50' 
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-indigo-500 hover:text-indigo-700'} text-base font-medium`}
              onClick={() => setIsMenuOpen(false)}
            >
              İlerleme Durumum
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={user?.photoURL || "https://via.placeholder.com/40?text=Kullanıcı"}
                      alt="Profil"
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-gray-800">{user?.displayName || 'Kullanıcı'}</div>
                    <div className="text-sm font-medium leading-none text-gray-500">{user?.email || ''}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-indigo-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profilim
                  </Link>
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-indigo-800 hover:bg-gray-100"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Yönetim Paneli
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-indigo-800 hover:bg-gray-100"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4">
                <Link 
                  to="/signin" 
                  className="block text-center w-full px-4 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-800 transition ease-in-out duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Giriş Yap
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;