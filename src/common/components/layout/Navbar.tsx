import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from '../../../pages/auth/services/authService';
import { User as UserType } from '../../../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../api/firebase/firebase';
import { generateInitialsAvatar } from '../../utils/imageUtils';
import LoginRequiredModal from '../modals/LoginRequiredModal';
import { eventBus, EVENTS } from '../../utils/eventBus';
import { useAuth } from '../../../contexts/AuthContext';

// Navbar bileşeni için prop tipleri
interface NavbarProps {
  isAuthenticated: boolean;
  user?: UserType | null;
}

function Navbar({ isAuthenticated, user }: NavbarProps) {
  const { currentUser, logout: authLogout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const [profilePhotoURL, setProfilePhotoURL] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<'tr' | 'en'>('tr');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginModalMessage, setLoginModalMessage] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  const customNavigate = (path: string) => {
    console.log('🧭 Yönlendirme başlatılıyor:', {
      hedefYol: path,
      mevcutYol: location.pathname,
      timestamp: new Date().toISOString()
    });

    try {
      navigate(path);
      console.log('✅ Yönlendirme başarılı:', {
        hedefYol: path,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Yönlendirme hatası:', {
        hedefYol: path,
        hata: error,
        timestamp: new Date().toISOString()
      });
    }
  };

  const hasInstructorRole = user?.role === 'instructor';
  const hasSchoolAdminRole = user?.role === 'school_admin';
  const hasSchoolRole = user?.role === 'school';
  const hasSuperAdminRole = user?.role === 'admin';
  const hasStudentRole = !user?.role || (!hasInstructorRole && !hasSchoolAdminRole && !hasSchoolRole && !hasSuperAdminRole && isAuthenticated);

  // Kullanıcı rollerini kontrol et ve logla
  useEffect(() => {
    console.log('👥 Kullanıcı Role Detaylı Bilgi:', {
      timestamp: new Date().toISOString(),
      role: user?.role,
      roleType: typeof user?.role,
      userObject: {
        id: user?.id,
        email: user?.email,
        displayName: user?.displayName,
        role: user?.role,
      },
      roleChecks: {
        hasInstructorRole,
        hasSchoolAdminRole,
        hasSchoolRole,
        hasSuperAdminRole,
        hasStudentRole
      }
    });

    // Firestore users tablosundan role bilgisini kontrol et
    const checkFirestoreRole = async () => {
      if (!user?.id) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          console.log('🔄 Firestore Users Role Detayları:', {
            timestamp: new Date().toISOString(),
            userId: user.id,
            firestoreRole: firestoreData.role,
            authRole: user.role,
            comparison: {
              hasRole: !!firestoreData.role,
              roleMatch: firestoreData.role === user.role
            }
          });
        } else {
          console.warn('⚠️ Firestore\'da kullanıcı dokümanı bulunamadı:', user.id);
        }
      } catch (error) {
        console.error('❌ Firestore role kontrolü hatası:', error);
      }
    };

    checkFirestoreRole();
  }, [user, hasInstructorRole, hasSchoolAdminRole, hasSchoolRole, hasSuperAdminRole, hasStudentRole]);

  // Kullanıcı rollerini kontrol et ve logla
  useEffect(() => {
    console.log('🔍 Kullanıcı rol bilgileri:', {
      rawRole: user?.role,
      isArray: Array.isArray(user?.role),
      user: user
    });
  }, [user]);

  // Firebase kullanıcı bilgilerini logla
  useEffect(() => {
    if (user) {
      console.log('🔥 Firebase Kullanıcı Bilgileri:', {
        timestamp: new Date().toISOString(),
        basicInfo: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        },
        customData: {
          role: user.role,
          phoneNumber: user.phoneNumber
        },
        authState: {
          isAuthenticated
        }
      });

      // Firestore'dan ek kullanıcı bilgilerini getir
      const fetchUserDetails = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.id));
          if (userDoc.exists()) {
            console.log('📄 Firestore Kullanıcı Detayları:', {
              timestamp: new Date().toISOString(),
              exists: true,
              data: userDoc.data(),
              id: userDoc.id
            });
          } else {
            console.log('⚠️ Firestore\'da kullanıcı dokümanı bulunamadı');
          }
        } catch (error) {
          console.error('❌ Firestore kullanıcı bilgileri getirme hatası:', error);
        }
      };

      fetchUserDetails();
    }
  }, [user, isAuthenticated]);

  // Rol durumlarını logla
  useEffect(() => {
    console.log('👥 Kullanıcı rol durumları:', {
      hasInstructorRole,
      hasSchoolAdminRole,
      hasSchoolRole,
      hasSuperAdminRole,
      hasStudentRole,
      isAuthenticated
    });
  }, [hasInstructorRole, hasSchoolAdminRole, hasSchoolRole, hasSuperAdminRole, hasStudentRole, isAuthenticated]);

  // Kullanıcı rolünü detaylı logla
  useEffect(() => {
    console.log('👤 Kullanıcı Rol Detayları:', {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      email: user?.email,
      displayName: user?.displayName,
      role: user?.role,
      roleType: typeof user?.role,
      parsedRoles: {
        isInstructor: hasInstructorRole,
        isSchoolAdmin: hasSchoolAdminRole,
        isSchool: hasSchoolRole,
        isSuperAdmin: hasSuperAdminRole,
        isStudent: hasStudentRole
      },
      isAuthenticated
    });
  }, [user, hasInstructorRole, hasSchoolAdminRole, hasSchoolRole, hasSuperAdminRole, hasStudentRole, isAuthenticated]);

  // Profil fotoğrafını Firestore'dan getir
  const fetchProfilePhoto = useCallback(async () => {
    if (!user) return;

    try {
      // Önce Firestore'dan kontrol et
      const userDoc = await getDoc(doc(db, 'users', user.id));

      console.log('🔍 Firestore profil fotoğrafı kontrolü:', {
        userId: user.id,
        firestoreExists: userDoc.exists(),
        firestoreData: userDoc.exists() ? userDoc.data() : null,
        firestorePhotoURL: userDoc.exists() ? userDoc.data().photoURL : null,
        timestamp: new Date().toISOString()
      });

      // Firestore'da photoURL varsa kullan
      if (userDoc.exists() && userDoc.data().photoURL) {
        console.log('✅ Firestore profil fotoğrafı bulundu:', userDoc.data().photoURL);
        setProfilePhotoURL(userDoc.data().photoURL);
        return;
      }

      // Firestore'da yoksa Firebase Auth'dan gelen photoURL'i kontrol et
      console.log('🔄 Firebase Auth profil fotoğrafı kontrolü:', {
        authPhotoURL: user.photoURL,
        isAssetURL: user.photoURL?.startsWith('/assets/'),
        timestamp: new Date().toISOString()
      });

      if (user.photoURL && !user.photoURL.startsWith('/assets/')) {
        console.log('✅ Firebase Auth profil fotoğrafı kullanılıyor:', user.photoURL);
        setProfilePhotoURL(user.photoURL);
        return;
      }

      // Hiçbir yerde fotoğraf yoksa baş harf avatarı göster
      console.log('⚠️ Profil fotoğrafı bulunamadı, baş harf avatarı gösteriliyor');
      const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
      const initialsAvatar = generateInitialsAvatar(user.displayName || '?', userType);
      console.log('🎨 Oluşturulan baş harf avatarı:', initialsAvatar);
      setProfilePhotoURL(initialsAvatar);
    } catch (error) {
      console.error("⛔ Profil fotoğrafı getirme hatası:", error);
      const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
      setProfilePhotoURL(generateInitialsAvatar(user?.displayName || '?', userType));
    }
  }, [user, hasInstructorRole, hasSchoolRole]);

  // Event listener'ı ekle
  useEffect(() => {
    const handleProfilePhotoUpdate = () => {
      console.log('🔄 Profil fotoğrafı güncelleme eventi alındı, fotoğraf yenileniyor...');
      fetchProfilePhoto();
    };

    const handleProfileUpdate = (updatedUser: UserType) => {
      console.log('🔄 Profil güncelleme eventi alındı:', updatedUser);
      // Kullanıcı bilgilerini güncelle
      if (user && updatedUser) {
        const updatedUserInfo = { ...user, ...updatedUser };
        // Burada kendi state yönetiminize göre user'ı güncellemeniz gerekiyor
        // Örneğin: setUser(updatedUserInfo) veya dispatch(updateUser(updatedUserInfo))
        // Şu an için sadece fotoğrafı güncelliyoruz
        fetchProfilePhoto();
      }
    };

    eventBus.on(EVENTS.PROFILE_PHOTO_UPDATED, handleProfilePhotoUpdate);
    eventBus.on(EVENTS.PROFILE_UPDATED, handleProfileUpdate);

    // Component mount olduğunda fotoğrafı getir
    console.log('🔄 Component mount oldu, ilk fotoğraf yüklemesi başlatılıyor...');
    fetchProfilePhoto();

    return () => {
      eventBus.off(EVENTS.PROFILE_PHOTO_UPDATED, handleProfilePhotoUpdate);
      eventBus.off(EVENTS.PROFILE_UPDATED, handleProfileUpdate);
    };
  }, [user?.id, fetchProfilePhoto]);

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

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'tr' ? 'en' : 'tr');
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

  const handleProtectedFeatureClick = (feature: string) => {
    if (!isAuthenticated) {
      let message = "";
      switch (feature) {
        case "progress":
          message = "İlerleme durumunuzu görebilmek için giriş yapmanız gerekmektedir.";
          break;
        case "partner":
          message = "Partner ile iletişime geçebilmek için giriş yapmanız gerekmektedir.";
          break;
        default:
          message = "Bu özelliği kullanabilmek için giriş yapmanız gerekmektedir.";
      }
      setLoginModalMessage(message);
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  return (
    <>
      <nav className="bg-white shadow-md fixed w-full z-50 backdrop-blur-sm bg-white/90">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
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
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {!hasSchoolRole && !hasInstructorRole && (
                  <>
                    <Link 
                      to="/partners" 
                      className={`${isActive('/partners') 
                        ? 'border-indigo-500 text-indigo-700 font-medium' 
                        : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-400'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
                    >
                      Partner Bul
                    </Link>
                    <Link 
                      to="/courses" 
                      className={`${isActive('/courses') 
                        ? 'border-indigo-500 text-indigo-700 font-medium' 
                        : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-400'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
                    >
                      Kurs Bul
                    </Link>
                    <Link 
                      to="/festivals" 
                      className={`${isActive('/festivals') 
                        ? 'border-indigo-500 text-indigo-700 font-medium' 
                        : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-400'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
                    >
                      Festivaller
                    </Link>
                    <Link 
                      to="/nights" 
                      className={`${isActive('/nights') 
                        ? 'border-indigo-500 text-indigo-700 font-medium' 
                        : 'border-transparent text-gray-500 hover:text-indigo-600 hover:border-indigo-400'} inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-all duration-200`}
                    >
                      Geceler
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-2">
              {/* Kullanıcının rolüne göre butonları göster */}
              <div className="flex space-x-2">
                {/* 'Eğitmen Ol' butonu */}
                {!hasInstructorRole && !hasSchoolRole && !hasSchoolAdminRole && (
                  <Link
                    to="/become-instructor"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Eğitmen Ol
                  </Link>
                )}

                {/* Dans Okulu Aç butonu */}
                {!hasSchoolRole && !hasSchoolAdminRole && (
                  <Link
                    to="/become-school"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Dans Okulu Aç
                  </Link>
                )}

                {/* Eğitim Paneli butonu */}
                {hasInstructorRole && (
                  <Link
                    to="/instructor"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Eğitmen Paneli
                  </Link>
                )}
              </div>
              
              {isAuthenticated ? (
                <>
                  {/* Admin Panel Butonu */}
                  {hasSuperAdminRole && (
                    <Link
                      to="/admin"
                      className="mr-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {/* Okul Yönetim Paneli */}
                  {hasSchoolRole && !hasSuperAdminRole && (
                    <Link
                      to="/school-admin"
                      className="mr-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      Okul Yönetim Paneli
                    </Link>
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
                        className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <span className="sr-only">Profil menüsünü aç</span>
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={profilePhotoURL}
                          alt={user?.displayName || 'Profil'}
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
                            target.src = generateInitialsAvatar(user?.displayName || '?', userType);
                          }}
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
                          ) : hasStudentRole ? (
                            <>
                              <Link
                                to="/profile"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150"
                                onClick={() => setIsProfileMenuOpen(false)}
                              >
                                Profilim
                              </Link>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150"
                                onClick={() => {
                                  console.log('🎯 İlerleme Durumum butonuna tıklandı:', {
                                    isAuthenticated,
                                    user: {
                                      id: user?.id,
                                      email: user?.email,
                                      role: user?.role,
                                      displayName: user?.displayName
                                    },
                                    hasStudentRole,
                                    timestamp: new Date().toISOString()
                                  });

                                  const result = handleProtectedFeatureClick('progress');
                                  console.log('🔒 handleProtectedFeatureClick sonucu:', {
                                    result,
                                    timestamp: new Date().toISOString()
                                  });

                                  if (result) {
                                    console.log('🚀 /progress sayfasına yönlendiriliyor...');
                                    customNavigate('/progress');
                                    console.log('📱 Menü kapatılıyor...');
                                    setIsProfileMenuOpen(false);
                                  }
                                }}
                              >
                                İlerleme Durumum
                              </button>
                            </>
                          ) : null}
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
                <div className="space-x-3">
                  <Link
                    to="/signin"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Giriş Yap
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
          <div className="sm:hidden animate-fadeIn fixed top-16 left-0 right-0 z-40 bg-white shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="pt-2 pb-3 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm">
              {/* Her durumda gösterilecek butonlar */}
              <div className="px-4 space-y-2">
                {!hasInstructorRole && !hasSchoolRole && !hasSchoolAdminRole && (
                  <Link 
                    to="/become-instructor"
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Eğitmen Ol
                    </div>
                  </Link>
                )}
                
                {/* Dans Okulu Aç butonu - Mobil */}
                {!hasSchoolRole && !hasSchoolAdminRole && (
                  <Link 
                    to="/become-school"
                    onClick={() => {
                      console.log('🎯 Dans Okulu Aç butonuna tıklandı (Mobil):', {
                        userId: user?.id,
                        userEmail: user?.email,
                        userRole: user?.role,
                        roleChecks: {
                          hasInstructorRole,
                          hasSchoolRole,
                          hasSchoolAdminRole,
                          hasSuperAdminRole
                        },
                        timestamp: new Date().toISOString(),
                        currentPath: location.pathname
                      });
                      setIsMenuOpen(false);
                    }}
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Dans Okulu Aç
                    </div>
                  </Link>
                )}

                {/* Eğitmen Paneli butonu - Mobil */}
                {hasInstructorRole && (
                  <Link 
                    to="/instructor"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Eğitmen Paneli
                    </div>
                  </Link>
                )}
              </div>

              {isAuthenticated ? (
                <>
                  <div className="flex items-center px-4 py-2">
                    <div className="flex-shrink-0">
                      <img
                        className="h-8 w-8 rounded-full object-cover shadow-sm"
                        src={profilePhotoURL}
                        alt={user?.displayName || 'Profil'}
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          const userType = hasInstructorRole ? 'instructor' : hasSchoolRole ? 'school' : 'student';
                          target.src = generateInitialsAvatar(user?.displayName || '?', userType);
                        }}
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium leading-none text-gray-800">{user?.displayName || 'Kullanıcı'}</div>
                      <div className="text-xs font-medium leading-none text-gray-500 mt-1">{user?.email || ''}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 px-4">
                    {!hasSchoolRole && !hasInstructorRole && (
                      <>
                        <Link
                          to="/partners"
                          className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Partner Bul
                        </Link>
                        <Link
                          to="/courses"
                          className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Kurs Bul
                        </Link>
                        <Link
                          to="/festivals"
                          className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Festivaller
                        </Link>
                        <Link
                          to="/nights"
                          className="block px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Geceler
                        </Link>
                      </>
                    )}
                    
                    {/* Ayırıcı çizgi */}
                    <div className="my-4 border-t border-gray-200" />
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Profil Menüsü
                    </div>

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
                    {hasSchoolRole && !hasSuperAdminRole && (
                      <Link
                        to="/school-admin"
                        className="block px-3 py-1 mt-2 rounded-md text-base font-medium text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-colors duration-150"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Okul Yönetim Paneli
                      </Link>
                    )}
                    
                    {/* Öğrenci Teşvik Butonları - Mobil */}
                    {/* Butonlar kaldırıldı ve her zaman gösterilecek şekilde taşındı */}
                    
                    {/* Profil linki - Mobil versiyon */}
                    {hasSuperAdminRole ? (
                      <Link
                        to="/profile?type=admin"
                        className="block px-3 py-1 rounded-md text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Profilim
                      </Link>
                    ) : hasStudentRole ? (
                      <>
                        <Link
                          to="/profile"
                          className="block px-3 py-1 rounded-md text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Profilim
                        </Link>
                        <button
                          className="block w-full text-left px-3 py-1 rounded-md text-base font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 transition-colors duration-150"
                          onClick={() => {
                            console.log('🎯 İlerleme Durumum butonuna tıklandı:', {
                              isAuthenticated,
                              user: {
                                id: user?.id,
                                email: user?.email,
                                role: user?.role,
                                displayName: user?.displayName
                              },
                              hasStudentRole,
                              timestamp: new Date().toISOString()
                            });

                            const result = handleProtectedFeatureClick('progress');
                            console.log('🔒 handleProtectedFeatureClick sonucu:', {
                              result,
                              timestamp: new Date().toISOString()
                            });

                            if (result) {
                              console.log('🚀 /progress sayfasına yönlendiriliyor...');
                              customNavigate('/progress');
                              console.log('📱 Menü kapatılıyor...');
                              setIsMenuOpen(false);
                            }
                          }}
                        >
                          İlerleme Durumum
                        </button>
                      </>
                    ) : null}
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
                <div className="pt-1 mt-1 border-t border-gray-200 space-y-2">
                  <Link 
                    to="/signin" 
                    className="block w-full px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1 shadow-sm transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Giriş Yap
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
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Login Required Modal */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message={loginModalMessage}
      />
    </>
  );
}

export default Navbar;