import React, { useState, useEffect, useMemo } from 'react';
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
import { db, auth } from '../../../../api/firebase/firebase';
import { motion } from 'framer-motion';
import { User, UserRole, DanceLevel, DanceStyle } from '../../../../types';
import { useAuth } from '../../../../contexts/AuthContext';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../common/components/ui/CustomPhoneInput';

// Student interface with instructor and school
interface Student {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  level: DanceLevel;
  photoURL: string;
  instructorId?: string;
  instructorName?: string;
  schoolId?: string;
  schoolName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Form data interface
interface FormData {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  level: DanceLevel;
  photoURL: string;
  instructorId: string;
  schoolId: string;
  password: string;
  createAccount: boolean;
}

// Form errors interface
interface FormErrors {
  phoneNumber?: string;
  [key: string]: string | undefined;
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
  instructorId?: string | null;
  instructorName?: string | null;
  schoolId?: string | null;
  schoolName?: string | null;
  danceStyles?: DanceStyle[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Instructor type
interface Instructor {
  id: string;
  displayName: string;
  email: string;
}

// School type
interface School {
  id: string;
  name: string;
  email: string;
}

export const UserManagement: React.FC = () => {
  console.log('UserManagement component rendered');
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<FirebaseUser[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<FirebaseUser | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    id: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    level: 'beginner',
    photoURL: '',
    instructorId: '',
    schoolId: '',
    password: '',
    createAccount: true
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Check if current user is super admin
  useEffect(() => {
    console.log('Checking super admin status...');
    const checkIfSuperAdmin = async () => {
      if (!auth.currentUser) {
        console.log('No current user found');
        return;
      }
      
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log('Current user data:', userData);
          let roles = userData.role || [];
          
          if (!Array.isArray(roles)) {
            roles = [roles];
          }
          
          setIsSuperAdmin(roles.includes('admin'));
          console.log('Is super admin:', roles.includes('admin'));
        }
      } catch (err) {
        console.error('Süper admin kontrolü yapılırken hata oluştu:', err);
      }
    };
    
    checkIfSuperAdmin();
  }, []);

  // Fetch students, instructors and schools on initial load
  useEffect(() => {
    console.log('Initial data fetch effect triggered');
    fetchStudents();
    fetchInstructors();
    fetchSchools();
  }, []);

  // Replace the useEffect with useMemo for filtering students
  const filteredStudents = useMemo(() => {
    console.log('Filtering students...');
    if (!students.length) return [];
    
    const term = searchTerm.toLowerCase();
    return searchTerm
      ? students.filter(student => 
          student.displayName?.toLowerCase().includes(term) || 
          student.email?.toLowerCase().includes(term)
        )
      : students;
  }, [searchTerm, students]);

  // Fetch students from Firestore
  const fetchStudents = async () => {
    console.log('Fetching students...');
    setLoading(true);
    setError(null);
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      console.log('Total students found:', querySnapshot.size);
      
      const studentsData: FirebaseUser[] = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseUser);
      });
      
      console.log('Processed students data:', studentsData);
      setStudents(studentsData);
    } catch (err) {
      console.error('Kullanıcılar yüklenirken hata oluştu:', err);
      setError('Kullanıcılar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch instructors from Firestore
  const fetchInstructors = async () => {
    try {
      console.log('Fetching instructors...');
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      console.log('Total users found:', querySnapshot.size);
      
      const instructorsData: Instructor[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Check if user has instructor role (either as single role or in array)
        const roles = Array.isArray(data.role) ? data.role : [data.role];
        if (roles.includes('instructor')) {
          console.log('Found instructor:', {
            id: doc.id,
            displayName: data.displayName,
            email: data.email
          });

          instructorsData.push({
            id: doc.id,
            displayName: data.displayName || 'İsimsiz Eğitmen',
            email: data.email || ''
          });
        }
      });
      
      console.log('Total instructors processed:', instructorsData.length);
      console.log('Instructors list:', instructorsData);
      setInstructors(instructorsData);
    } catch (err) {
      console.error('Eğitmenler yüklenirken hata oluştu:', err);
      setError('Eğitmenler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    }
  };

  // Fetch schools from Firestore
  const fetchSchools = async () => {
    try {
      console.log('=== SCHOOLS FETCH START ===');
      const schoolsRef = collection(db, 'schools');
      const q = query(schoolsRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      console.log('Total schools found:', querySnapshot.size);
      
      const schoolsData: School[] = [];
      console.log('=== RAW SCHOOLS DATA ===');
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`School Document [${doc.id}]:`, {
          rawData: data,
          fields: {
            name: data.name,
            ad: data.ad,
            email: data.email,
            contactEmail: data.contactEmail
          }
        });
        
        // Hem 'name' hem de 'ad' alanlarını kontrol et
        const schoolName = data.name || data.ad || 'İsimsiz Okul';
        
        const schoolEntry = {
          id: doc.id,
          name: schoolName,
          email: data.email || data.contactEmail || ''
        };
        
        console.log('Processed school entry:', schoolEntry);
        schoolsData.push(schoolEntry);
      });
      
      // Okul adına göre alfabetik sırala
      schoolsData.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      
      console.log('=== FINAL SCHOOLS LIST ===');
      console.log('Processed and sorted schools:', schoolsData);
      console.log('=== SCHOOLS FETCH END ===');
      
      setSchools(schoolsData);
    } catch (err) {
      console.error('=== SCHOOLS FETCH ERROR ===', {
        error: err,
        message: err instanceof Error ? err.message : 'Bilinmeyen hata',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError('Okullar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    }
  };

  // CustomSelect için handleSelectChange fonksiyonu
  const handleSelectChange = (fieldName: keyof FormData) => (selectedValue: string | string[]) => {
    if (typeof selectedValue === 'string') {
      setFormData(prev => ({
        ...prev,
        [fieldName]: selectedValue
      }));
    }
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

  // Handle phone validation
  const handlePhoneValidation = (isValid: boolean, errorMessage?: string) => {
    if (!isValid && errorMessage) {
      setFormErrors(prev => ({
        ...prev,
        phoneNumber: errorMessage
      }));
    } else {
      setFormErrors(prev => {
        const { phoneNumber, ...rest } = prev;
        return rest;
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id: '',
      displayName: '',
      email: '',
      phoneNumber: '',
      level: 'beginner',
      photoURL: '',
      instructorId: '',
      schoolId: '',
      password: '',
      createAccount: true
    });
    setFormErrors({});
  };

  // Edit student
  const editStudent = (student: FirebaseUser): void => {
    setSelectedStudent(student);
    setFormData({
      id: student.id,
      displayName: student.displayName,
      email: student.email,
      phoneNumber: student.phoneNumber || '',
      level: student.level || 'beginner',
      photoURL: student.photoURL || '',
      instructorId: student.instructorId || '',
      schoolId: student.schoolId || '',
      password: '',
      createAccount: false
    });
    setFormErrors({});
    setEditMode(true);
  };

  // Add new student
  const addNewStudent = (): void => {
    setSelectedStudent(null);
    resetForm();
    setEditMode(true);
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Check for form errors
    if (Object.keys(formErrors).length > 0) {
      setError('Lütfen form hatalarını düzeltin.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (selectedStudent) {
        // Update existing student
        const userRef = doc(db, 'users', selectedStudent.id);
        
        // Get instructor name if an instructor is selected
        let instructorName = '';
        if (formData.instructorId) {
          const selectedInstructor = instructors.find(i => i.id === formData.instructorId);
          instructorName = selectedInstructor?.displayName || '';
        }
        
        // Get school name if a school is selected
        let schoolName = '';
        if (formData.schoolId) {
          const selectedSchool = schools.find(s => s.id === formData.schoolId);
          schoolName = selectedSchool?.name || '';
        }
        
        await updateDoc(userRef, {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          level: formData.level,
          instructorId: formData.instructorId || null,
          instructorName: instructorName || null,
          schoolId: formData.schoolId || null,
          schoolName: schoolName || null,
          updatedAt: serverTimestamp()
        });
        
        // Update the students array
        const updatedStudents = students.map(student => 
          student.id === selectedStudent.id 
            ? { 
                ...student, 
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                level: formData.level,
                instructorId: formData.instructorId || null,
                instructorName: instructorName || null,
                schoolId: formData.schoolId || null,
                schoolName: schoolName || null,
                updatedAt: serverTimestamp() as Timestamp 
              } 
            : student
        );
        
        setStudents(updatedStudents);
        setSuccess('Öğrenci bilgileri başarıyla güncellendi.');
      } else {
        // Create new student
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
        if (formData.createAccount) {
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
        
        // Get instructor name if an instructor is selected
        let instructorName = '';
        if (formData.instructorId) {
          const selectedInstructor = instructors.find(i => i.id === formData.instructorId);
          instructorName = selectedInstructor?.displayName || '';
        }
        
        // Get school name if a school is selected
        let schoolName = '';
        if (formData.schoolId) {
          const selectedSchool = schools.find(s => s.id === formData.schoolId);
          schoolName = selectedSchool?.name || '';
        }
        
        // Create user document in Firestore
        const newStudentData = {
          id: userId,
          displayName: formData.displayName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || '',
          role: 'student' as UserRole,
          level: formData.level,
          instructorId: formData.instructorId || null,
          instructorName: instructorName || null,
          schoolId: formData.schoolId || null,
          schoolName: schoolName || null,
          photoURL: formData.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(doc(db, 'users', userId), newStudentData);
        
        // Add to students array
        const newStudent: FirebaseUser = {
          ...newStudentData,
          role: 'student' as UserRole,
          level: formData.level,
          instructorId: formData.instructorId || null,
          instructorName: instructorName || null,
          schoolId: formData.schoolId || null,
          schoolName: schoolName || null,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp
        };
        
        setStudents([newStudent, ...students]);
        setSuccess('Yeni öğrenci başarıyla oluşturuldu.');
      }
      
      // Close the form
      setEditMode(false);
      setSelectedStudent(null);
      
    } catch (err: any) {
      console.error('Öğrenci kaydedilirken hata oluştu:', err);
      setError('Öğrenci kaydedilirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const deleteStudentHandler = async (studentId: string): Promise<void> => {
    if (!window.confirm('Bu öğrenciyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', studentId));
      
      // Remove from state
      const updatedStudents = students.filter(student => student.id !== studentId);
      setStudents(updatedStudents);
      setSuccess('Öğrenci başarıyla silindi.');
      
      // Note: Deleting the auth user would require admin SDK or reauthentication,
      // so we're only deleting the Firestore document here.
    } catch (err) {
      console.error('Öğrenci silinirken hata oluştu:', err);
      setError('Öğrenci silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'school':
        return 'bg-purple-100 text-purple-800';
      case 'student':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render role badges
  const renderRoleBadges = (roles: UserRole | UserRole[]) => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return (
      <div className="flex flex-wrap gap-1">
        {roleArray.map((role, index) => (
          <span
            key={index}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
          >
            {role === 'admin' && 'Admin'}
            {role === 'instructor' && 'Eğitmen'}
            {role === 'school' && 'Dans Okulu'}
            {role === 'student' && 'Öğrenci'}
            {!['admin', 'instructor', 'school', 'student'].includes(role) && role}
          </span>
        ))}
      </div>
    );
  };

  // Render student row
  const renderStudent = (student: FirebaseUser) => {
    return (
      <motion.tr 
        key={student.id}
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
                src={student.photoURL || 'https://via.placeholder.com/40?text=User'}
                alt={student.displayName}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/40?text=User";
                }}
              />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{student.displayName}</div>
              {student.phoneNumber && (
                <div className="text-sm text-gray-500">{student.phoneNumber}</div>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{student.email}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {renderRoleBadges(student.role)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {student.level === 'beginner' && 'Başlangıç'}
            {student.level === 'intermediate' && 'Orta'}
            {student.level === 'advanced' && 'İleri'}
            {student.level === 'professional' && 'Profesyonel'}
            {!student.level && '-'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {student.instructorName || '-'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {student.schoolName || '-'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => editStudent(student)}
            className="text-indigo-600 hover:text-indigo-900 mr-2"
          >
            Düzenle
          </button>
          <button
            onClick={() => deleteStudentHandler(student.id)}
            className="text-red-600 hover:text-red-900"
          >
            Sil
          </button>
        </td>
      </motion.tr>
    );
  };

  if (loading && students.length === 0) {
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
            onClick={addNewStudent}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Yükleniyor...' : 'Yeni Kullanıcı Ekle'}
          </button>
        )}
      </div>
      
      {editMode ? (
        <div className="bg-gray-50 p-6 rounded-lg relative">
          <h3 className="text-lg font-semibold mb-4">
            {selectedStudent ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
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
                  disabled={!!selectedStudent} // Cannot change email for existing students
                />
                {selectedStudent && (
                  <p className="text-xs text-gray-500 mt-1">Mevcut öğrencilerin e-posta adresleri değiştirilemez.</p>
                )}
              </div>
              
              <div>
                <CustomSelect
                  label="Okul"
                  value={formData.schoolId}
                  onChange={handleSelectChange('schoolId')}
                  options={schools.map(school => ({
                    value: school.id,
                    label: school.name
                  }))}
                  placeholder="Okul Seç..."
                />
              </div>
              
              <div>
                <CustomSelect
                  label="Eğitmen"
                  value={formData.instructorId}
                  onChange={handleSelectChange('instructorId')}
                  options={instructors.map(instructor => ({
                    value: instructor.id,
                    label: instructor.displayName
                  }))}
                  placeholder="Eğitmen Seç..."
                />
              </div>
              
              <div>
                <CustomSelect
                  label="Dans Seviyesi"
                  value={formData.level}
                  onChange={handleSelectChange('level')}
                  options={[
                    { value: 'beginner', label: 'Başlangıç' },
                    { value: 'intermediate', label: 'Orta' },
                    { value: 'advanced', label: 'İleri' },
                    { value: 'professional', label: 'Profesyonel' }
                  ]}
                  placeholder="Seviye Seçin"
                />
              </div>
              
              <div>
                <CustomPhoneInput
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  onValidation={handlePhoneValidation}
                  error={formErrors.phoneNumber}
                  label="Telefon"
                  required
                />
              </div>
              
              {!selectedStudent && (
                <>
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="createAccount"
                        name="createAccount"
                        checked={formData.createAccount}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label htmlFor="createAccount" className="ml-2 block text-sm text-gray-700">
                        Giriş yapabilen kullanıcı hesabı oluştur
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Bu seçeneği işaretlerseniz, öğrenci için giriş yapabileceği bir hesap oluşturulacak ve e-posta doğrulama gönderilecektir.
                    </p>
                  </div>
                  
                  {formData.createAccount && (
                    <div className="md:col-span-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Şifre*
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        required={formData.createAccount}
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
                {loading ? 'Kaydediliyor...' : (selectedStudent ? 'Güncelle' : 'Ekle')}
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
                    Roller
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dans Seviyesi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Eğitmen
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Okul
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => renderStudent(student))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm ? 'Aramanıza uygun öğrenci bulunamadı.' : 'Henüz hiç öğrenci kaydı bulunmuyor.'}
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