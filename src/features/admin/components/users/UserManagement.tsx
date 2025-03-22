import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { generateInitialsAvatar } from '../../../../common/utils/imageUtils';
import ImageUploader from '../../../../common/components/ui/ImageUploader';
import CustomInput from '../../../../common/components/ui/CustomInput';
import { Button } from '@mui/material';

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

  // Update handleInputChange function
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string; type?: string; checked?: boolean } } | string,
    fieldName?: string
  ): void => {
    if (typeof e === 'string' && fieldName) {
      // Handle direct value changes (from CustomSelect)
      setFormData(prev => ({
        ...prev,
        [fieldName]: e
      }));
    } else if (typeof e === 'object' && 'target' in e) {
      // Handle event-based changes
      const target = e.target as { name: string; value: string; type?: string; checked?: boolean };
      setFormData(prev => ({
        ...prev,
        [target.name]: target.type === 'checkbox' ? !!target.checked : target.value
      }));
    }
  };

  // Handle photo change
  const handlePhotoChange = (base64Image: string | null) => {
    if (base64Image) {
      setFormData(prev => ({
        ...prev,
        photoURL: base64Image
      }));
    }
  };

  // Handle phone validation
  const handlePhoneValidation = useCallback((isValid: boolean, errorMessage?: string) => {
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
  }, []);

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

  // Davetiye e-postası gönderme fonksiyonu
  const sendInvitationEmail = async (email: string, invitationData: {
    displayName: string;
    schoolId?: string;
    schoolName?: string;
    instructorId?: string;
    instructorName?: string;
    level: DanceLevel;
  }) => {
    try {
      // Benzersiz bir davet kodu oluştur
      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Davet bilgilerini Firestore'a kaydet
      await setDoc(doc(db, 'pendingUsers', invitationId), {
        email,
        ...invitationData,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 gün geçerli
      });

      // E-posta gönderme fonksiyonu burada implement edilecek
      // Firebase Cloud Functions kullanılabilir
      
      return true;
    } catch (error) {
      console.error('Davet gönderilirken hata oluştu:', error);
      throw error;
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (Object.keys(formErrors).length > 0) {
      setError('Lütfen form hatalarını düzeltin.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (selectedStudent) {
        // Mevcut öğrenci güncelleme kodu aynı kalacak
        const userRef = doc(db, 'users', selectedStudent.id);
        
        let instructorName = '';
        if (formData.instructorId) {
          const selectedInstructor = instructors.find(i => i.id === formData.instructorId);
          instructorName = selectedInstructor?.displayName || '';
        }
        
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
        // Yeni öğrenci ekleme - artık hesap oluşturmak yerine davet gönderilecek
        if (!formData.email || !formData.displayName) {
          throw new Error('E-posta ve ad soyad alanları zorunludur.');
        }
        
        // E-posta kontrolü
        const emailQuery = query(
          collection(db, 'users'), 
          where('email', '==', formData.email)
        );
        const emailCheckSnapshot = await getDocs(emailQuery);
        
        if (!emailCheckSnapshot.empty) {
          throw new Error('Bu e-posta adresi zaten kullanılıyor.');
        }
        
        // Seçilen eğitmen ve okul bilgilerini al
        let instructorName = '';
        if (formData.instructorId) {
          const selectedInstructor = instructors.find(i => i.id === formData.instructorId);
          instructorName = selectedInstructor?.displayName || '';
        }
        
        let schoolName = '';
        if (formData.schoolId) {
          const selectedSchool = schools.find(s => s.id === formData.schoolId);
          schoolName = selectedSchool?.name || '';
        }

        // Davet gönder
        await sendInvitationEmail(formData.email, {
          displayName: formData.displayName,
          schoolId: formData.schoolId || undefined,
          schoolName: schoolName || undefined,
          instructorId: formData.instructorId || undefined,
          instructorName: instructorName || undefined,
          level: formData.level
        });
        
        setSuccess('Davet e-postası başarıyla gönderildi.');
      }
      
      setEditMode(false);
      setSelectedStudent(null);
      
    } catch (err: any) {
      console.error('İşlem sırasında hata oluştu:', err);
      setError('İşlem sırasında bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
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

  // Get avatar type based on user role
  const getAvatarType = (role: UserRole | UserRole[]): "student" | "instructor" | "school" => {
    const roleToCheck = Array.isArray(role) ? role[0] : role;
    
    switch (roleToCheck) {
      case 'instructor':
        return 'instructor';
      case 'school':
      case 'school_admin':
        return 'school';
      case 'admin':
      case 'student':
      default:
        return 'student';
    }
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
            <div className="flex-shrink-0 h-10 w-10 relative bg-green-100 rounded-full overflow-hidden">
              {student.photoURL ? (
                <img 
                  className="h-10 w-10 rounded-full object-cover absolute inset-0" 
                  src={student.photoURL}
                  alt={student.displayName}
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    // Hata durumunda baş harf avatarını göster
                    target.src = generateInitialsAvatar(student.displayName, getAvatarType(student.role));
                  }}
                />
              ) : (
                <img 
                  className="h-10 w-10 rounded-full object-cover" 
                  src={generateInitialsAvatar(student.displayName, getAvatarType(student.role))}
                  alt={student.displayName}
                />
              )}
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
                <CustomInput
                  name="displayName"
                  label="Ad Soyad"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>
              
              <div>
                <CustomInput
                  type="email"
                  name="email"
                  label="E-posta"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!!selectedStudent}
                  fullWidth
                  helperText={selectedStudent ? "Mevcut kullanıcıların e-posta adresleri değiştirilemez." : ""}
                />
              </div>
              
              <div>
                <CustomPhoneInput
                  name="phoneNumber"
                  label="Telefon"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>
              
              <div>
                <CustomSelect
                  name="level"
                  label="Dans Seviyesi"
                  value={formData.level}
                  onChange={(value) => handleInputChange(value, 'level')}
                  options={[
                    { value: 'beginner', label: 'Başlangıç' },
                    { value: 'intermediate', label: 'Orta' },
                    { value: 'advanced', label: 'İleri' },
                    { value: 'professional', label: 'Profesyonel' }
                  ]}
                  fullWidth
                />
              </div>
              
              <div className="md:col-span-2">
                <ImageUploader
                  currentPhotoURL={formData.photoURL}
                  onImageChange={handlePhotoChange}
                  displayName={formData.displayName || '?'}
                  userType={getAvatarType(selectedStudent?.role || 'student')}
                  shape="circle"
                  width={96}
                  height={96}
                />
              </div>

              <div>
                <CustomSelect
                  name="instructorId"
                  label="Eğitmen"
                  value={formData.instructorId}
                  onChange={(value) => handleInputChange(value, 'instructorId')}
                  options={[
                    { value: '', label: 'Eğitmen Seç...' },
                    ...instructors.map(instructor => ({
                      value: instructor.id,
                      label: instructor.displayName
                    }))
                  ]}
                  fullWidth
                />
              </div>
              
              <div>
                <CustomSelect
                  name="schoolId"
                  label="Okul"
                  value={formData.schoolId}
                  onChange={(value) => handleInputChange(value, 'schoolId')}
                  options={[
                    { value: '', label: 'Okul Seç...' },
                    ...schools.map(school => ({
                      value: school.id,
                      label: school.name
                    }))
                  ]}
                  fullWidth
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setEditMode(false)}
                disabled={loading}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : (selectedStudent ? 'Güncelle' : 'Ekle')}
              </Button>
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