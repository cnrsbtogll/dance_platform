import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../api/firebase/firebase';
import { User, UserRole } from '../../../types';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      console.log('📍 Current location:', location.pathname);
      
      if (firebaseUser) {
        try {
          console.log('📝 Fetching user document for:', firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            const userWithId = {
              id: firebaseUser.uid,
              ...userData,
            };
            console.log('✅ User document found:', userWithId);
            console.log('🎭 User roles:', userWithId.role);

            setUser(userWithId);

            // Kullanıcı henüz giriş yapmamışsa veya ana sayfadaysa
            if (location.pathname === '/' || location.pathname === '/signin' || location.pathname === '/signup') {
              console.log('🚦 User needs redirection from:', location.pathname);
              
              // URL'den redirect parametresi kontrolü
              const params = new URLSearchParams(window.location.search);
              const redirectUrl = params.get('redirect');
              console.log('🔀 Redirect URL from params:', redirectUrl);

              if (redirectUrl) {
                console.log('➡️ Redirecting to URL from params:', redirectUrl);
                navigate(redirectUrl);
              } else {
                // Rol bazlı yönlendirme
                console.log('🎯 Starting role-based redirection...');
                if (userWithId.role.includes('instructor')) {
                  console.log('👨‍🏫 User is an instructor, redirecting to /instructor/management');
                  navigate('/instructor/management');
                } else if (userWithId.role.includes('school')) {
                  console.log('🏫 User is a school, redirecting to /school/dashboard');
                  navigate('/school/dashboard');
                } else if (userWithId.role.includes('admin')) {
                  console.log('👑 User is an admin, redirecting to /admin/dashboard');
                  navigate('/admin/dashboard');
                } else {
                  console.log('👤 User has no special role, redirecting to /profile');
                  navigate('/profile');
                }
              }
            } else {
              console.log('⏭️ User is already on a specific page:', location.pathname);
            }
          } else {
            // Yeni kullanıcı için varsayılan bilgileri ayarla
            const defaultUserData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: ['student'] as UserRole[],
              createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
              updatedAt: firebaseUser.metadata.lastSignInTime || new Date().toISOString(),
            };

            // Firestore'a yeni kullanıcıyı kaydet
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), defaultUserData);
              setUser(defaultUserData);

              // Yeni kullanıcıyı profil sayfasına yönlendir
              if (location.pathname === '/signin' || location.pathname === '/signup') {
                navigate('/profile');
              }
            } catch (error) {
              console.error('Yeni kullanıcı kaydedilemedi:', error);
              setUser(defaultUserData);
            }
          }
        } catch (error) {
          console.error('Kullanıcı bilgileri getirilemedi:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const value = {
    isAuthenticated: !!user,
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 