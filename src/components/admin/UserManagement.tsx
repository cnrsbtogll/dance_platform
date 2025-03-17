import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  Timestamp
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification,
  deleteUser,
  getAuth,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { motion } from 'framer-motion';
import { User, UserRole, DanceLevel, DanceStyle } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

// Form data interface
interface FormData {
  displayName: string;
  email: string;
  phoneNumber: string;
  role: UserRole | string;
  level?: DanceLevel | string;
  password?: string;
  createAuth?: boolean;
  photoURL?: string;
}

// Define Firebase user type
interface FirebaseUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber: string;
  role: UserRole | UserRole[];
  level: DanceLevel;
  danceStyles?: DanceStyle[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const UserManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<FirebaseUser[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<FirebaseUser | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    email: '',
    phoneNumber: '',
    role: 'student',
    level: 'beginner',
    password: '',
    createAuth: true,
    photoURL: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  // Check if current user is super admin
  useEffect(() => {
    const checkIfSuperAdmin = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          let roles = userData.role || [];
          
          if (!Array.isArray(roles)) {
            roles = [roles];
          }
          
          setIsSuperAdmin(roles.includes('admin'));
        }
      } catch (err) {
        console.error('Süper admin kontrolü yapılırken hata oluştu:', err);
      }
    };
    
    checkIfSuperAdmin();
  }, []);

  // Fetch users on initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update filtered users when search term or role filter changes
  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users]);

  // Filter users based on search term and role filter
  const filterUsers = () => {
    let filtered = [...users];
    
    // Filter out admin users
    filtered = filtered.filter(user => {
      if (Array.isArray(user.role)) {
        return !user.role.includes('admin');
      } else {
        return user.role !== 'admin';
      }
    });
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(term) || 
        user.email.toLowerCase().includes(term)
      );
    }
    
    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => {
        if (Array.isArray(user.role)) {
          return user.role.includes(roleFilter as UserRole);
        } else {
          return user.role === roleFilter;
        }
      });
    }
    
    setFilteredUsers(filtered);
  };

  // Fetch users from Firestore
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all users from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const usersData: FirebaseUser[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseUser);
      });
      
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (err) {
      console.error('Kullanıcılar yüklenirken hata oluştu:', err);
      setError('Kullanıcılar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // Edit user
  const editUser = (user: FirebaseUser): void => {
    let role = user.role;
    // Handle both array and string role formats
    if (Array.isArray(role)) {
      role = role[0] || 'student';
    }
    
    setSelectedUser(user);
    setFormData({
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: role,
      level: user.level || 'beginner',
      password: '',
      createAuth: false,
      photoURL: user.photoURL || ''
    });
    setEditMode(true);
  };

  // Add new user
  const addNewUser = (): void => {
    setSelectedUser(null);
    setFormData({
      displayName: '',
      email: '',
      phoneNumber: '',
      role: 'student',
      level: 'beginner',
      password: '',
      createAuth: true,
      photoURL: ''
    });
    setEditMode(true);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (selectedUser) {
        // Update existing user
        const userRef = doc(db, 'users', selectedUser.id);
        const userRoleValue = formData.role === 'admin' && !isSuperAdmin 
          ? 'student'  // Prevent non-super-admins from creating admin users
          : formData.role;
        
        // Prepare role array
        let roleValue: UserRole | UserRole[];
        if (typeof userRoleValue === 'string') {
          roleValue = userRoleValue as UserRole;
        } else {
          roleValue = [userRoleValue as UserRole];
        }
        
        await updateDoc(userRef, {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          role: roleValue,
          level: formData.level as DanceLevel,
          photoURL: formData.photoURL,
          updatedAt: serverTimestamp()
        });
        
        // Update the users array
        const updatedUsers = users.map(user => 
          user.id === selectedUser.id 
            ? { 
                ...user, 
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                role: roleValue,
                level: formData.level as DanceLevel,
                photoURL: formData.photoURL,
                updatedAt: serverTimestamp() as Timestamp 
              } 
            : user
        );
        
        setUsers(updatedUsers);
        setSuccess('Kullanıcı bilgileri başarıyla güncellendi.');
      } else {
        // Create new user
        if (!formData.email || !formData.displayName) {
          throw new Error('E-posta ve ad soyad alanları zorunludur.');
        }
        
        // Check if email already exists
        const emailQuery = query(
          collection(db, 'users'), 
          where('email', '==', formData.email)
        );
        const emailCheckSnapshot = await getDocs(emailQuery);
        
        if (!emailCheckSnapshot.empty) {
          throw new Error('Bu e-posta adresi zaten kullanılıyor.');
        }
        
        let userId = '';
        
        // Create user in Firebase Auth if requested
        if (formData.createAuth) {
          if (!formData.password) {
            throw new Error('Kullanıcı hesabı oluşturmak için şifre gereklidir.');
          }
          
          // Create the user in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            formData.password
          );
          
          userId = userCredential.user.uid;
          
          // Update user profile
          await updateProfile(userCredential.user, {
            displayName: formData.displayName,
            photoURL: formData.photoURL || null
          });
          
          // Send email verification
          await sendEmailVerification(userCredential.user);
        } else {
          // Generate a random ID if not creating auth account
          userId = 'user_' + Date.now() + Math.random().toString(36).substr(2, 9);
        }
        
        // Prevent non-super-admins from creating admin users
        const userRoleValue = formData.role === 'admin' && !isSuperAdmin 
          ? 'student' 
          : formData.role;
        
        // Prepare role array
        let roleValue: UserRole | UserRole[];
        if (typeof userRoleValue === 'string') {
          roleValue = userRoleValue as UserRole;
        } else {
          roleValue = [userRoleValue as UserRole];
        }
        
        // Create user document in Firestore
        const newUserData = {
          id: userId,
          displayName: formData.displayName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || '',
          role: roleValue,
          level: formData.level as DanceLevel,
          photoURL: formData.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', userId), newUserData);
        
        // Add to users array
        const newUser: FirebaseUser = {
          ...newUserData,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp
        };
        
        setUsers([newUser, ...users]);
        setSuccess('Yeni kullanıcı başarıyla oluşturuldu.');
      }
      
      // Close the form
      setEditMode(false);
      setSelectedUser(null);
      
    } catch (err: any) {
      console.error('Kullanıcı kaydedilirken hata oluştu:', err);
      setError('Kullanıcı kaydedilirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUserHandler = async (userId: string): Promise<void> => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      // Remove from state
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      setSuccess('Kullanıcı başarıyla silindi.');
      
      // Note: Deleting the auth user would require admin SDK or reauthentication,
      // so we're only deleting the Firestore document here.
    } catch (err) {
      console.error('Kullanıcı silinirken hata oluştu:', err);
      setError('Kullanıcı silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Render user row
  const renderUser = (user: FirebaseUser) => {
    const roleDisplay = Array.isArray(user.role) 
      ? user.role.map(r => (
        <span 
          key={r} 
          className={`inline-block mr-1 px-2 py-1 text-xs rounded-full ${
            r === 'student' ? 'bg-green-100 text-green-800' : 
            r === 'instructor' ? 'bg-blue-100 text-blue-800' : 
            r === 'school' ? 'bg-purple-100 text-purple-800' : 
            'bg-gray-100 text-gray-800'
          }`}
        >
          {r === 'student' ? 'Öğrenci' : 
          r === 'instructor' ? 'Eğitmen' : 
          r === 'school' ? 'Okul' : r}
        </span>
      )) 
      : (
        <span 
          className={`inline-block px-2 py-1 text-xs rounded-full ${
            user.role === 'student' ? 'bg-green-100 text-green-800' : 
            user.role === 'instructor' ? 'bg-blue-100 text-blue-800' : 
            user.role === 'school' ? 'bg-purple-100 text-purple-800' : 
            'bg-gray-100 text-gray-800'
          }`}
        >
          {user.role === 'student' ? 'Öğrenci' : 
          user.role === 'instructor' ? 'Eğitmen' : 
          user.role === 'school' ? 'Okul' : user.role}
        </span>
      );

    return (
      <motion.tr 
        key={user.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="hover:bg-gray-50"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <img
                className="h-10 w-10 rounded-full object-cover"
                src={user.photoURL || 'https://via.placeholder.com/40?text=User'}
                alt={user.displayName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=User";
                }}
              />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
              {user.phoneNumber && (
                <div className="text-sm text-gray-500">{user.phoneNumber}</div>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{user.email}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {roleDisplay}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {user.level === 'beginner' && 'Başlangıç'}
            {user.level === 'intermediate' && 'Orta'}
            {user.level === 'advanced' && 'İleri'}
            {user.level === 'professional' && 'Profesyonel'}
            {!user.level && '-'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => editUser(user)}
            className="text-indigo-600 hover:text-indigo-900 mr-2"
          >
            Düzenle
          </button>
          <button
            onClick={() => deleteUserHandler(user.id)}
            className="text-red-600 hover:text-red-900"
          >
            Sil
          </button>
        </td>
      </motion.tr>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-700">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Kullanıcı Yönetimi</h2>
        {!editMode && (
          <button 
            onClick={addNewUser}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Yükleniyor...' : 'Yeni Kullanıcı Ekle'}
          </button>
        )}
      </div>
      
      {editMode ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {selectedUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad*
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!!selectedUser} // Cannot change email for existing users
                />
                {selectedUser && (
                  <p className="text-xs text-gray-500 mt-1">Mevcut kullanıcıların e-posta adresleri değiştirilemez.</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol*
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="student">Öğrenci</option>
                  <option value="instructor">Eğitmen</option>
                  <option value="school">Okul</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                  Dans Seviyesi
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="beginner">Başlangıç</option>
                  <option value="intermediate">Orta</option>
                  <option value="advanced">İleri</option>
                  <option value="professional">Profesyonel</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="photoURL" className="block text-sm font-medium text-gray-700 mb-1">
                  Profil Fotoğrafı URL
                </label>
                <input
                  type="text"
                  id="photoURL"
                  name="photoURL"
                  value={formData.photoURL}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              
              {!selectedUser && (
                <>
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="createAuth"
                        name="createAuth"
                        checked={formData.createAuth}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label htmlFor="createAuth" className="ml-2 block text-sm text-gray-700">
                        Giriş yapabilen kullanıcı hesabı oluştur
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Bu seçeneği işaretlerseniz, kullanıcı için giriş yapabileceği bir hesap oluşturulacak ve e-posta doğrulama gönderilecektir.
                    </p>
                  </div>
                  
                  {formData.createAuth && (
                    <div className="md:col-span-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Şifre*
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        required={formData.createAuth}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        minLength={6}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Şifre en az 6 karakter uzunluğunda olmalıdır.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (selectedUser ? 'Güncelle' : 'Ekle')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="md:flex-1">
              <input
                type="text"
                placeholder="Ad veya e-posta ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Tüm Roller</option>
                <option value="student">Öğrenci</option>
                <option value="instructor">Eğitmen</option>
                <option value="school">Okul</option>
              </select>
            </div>
          </div>
          
          {/* Info message about admin users */}
          <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 text-sm">
            <p>Not: Admin kullanıcıları kullanıcı yönetimi listesinde görüntülenmemektedir.</p>
          </div>
          
          {loading && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seviye
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => renderUser(user))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || roleFilter ? 'Aramanıza uygun kullanıcı bulunamadı.' : 'Henüz hiç kullanıcı kaydı bulunmuyor.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
} 