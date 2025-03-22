import React, { useState, useEffect, useRef } from 'react';
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
import { resizeImageFromBase64 } from '../../../../api/services/userService';
import { generateInitialsAvatar } from '../../../../common/utils/imageUtils';
import ImageUploader from '../../../../common/components/ui/ImageUploader';
import CustomInput from '../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../common/components/ui/CustomPhoneInput';
import { Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, TextField } from '@mui/material';

// Default placeholder image for students
const DEFAULT_STUDENT_IMAGE = '/assets/placeholders/default-student.png';

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
  displayName: string;
  email: string;
}

// Photo Modal Component
interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoURL: string;
  studentName: string;
  defaultImagePath: string;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ isOpen, onClose, photoURL, studentName, defaultImagePath }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg overflow-hidden max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">{studentName} - Fotoğraf</h3>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 flex justify-center">
          <img 
            src={photoURL} 
            alt={`${studentName} fotoğrafı`} 
            className="max-h-[70vh] max-w-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImagePath;
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Student Photo Uploader Component
interface StudentPhotoUploaderProps {
  currentPhotoURL?: string;
  onImageChange: (base64Image: string | null) => void;
}

const StudentPhotoUploader: React.FC<StudentPhotoUploaderProps> = ({
  currentPhotoURL,
  onImageChange
}) => {
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 5; // Maximum file size in MB

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      // Check file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Dosya boyutu çok büyük. Lütfen ${MAX_FILE_SIZE_MB}MB'dan küçük bir görsel seçin.`);
        setIsUploading(false);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Lütfen geçerli bir görsel dosyası seçin (JPEG, PNG, GIF, vs.)');
        setIsUploading(false);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreviewURL(result);
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Fotoğraf yüklenirken bir hata oluştu.');
      console.error('Fotoğraf yükleme hatası:', err);
      setIsUploading(false);
    }
  };

  const confirmUpload = () => {
    if (previewURL) {
      onImageChange(previewURL);
    }
  };

  const cancelUpload = () => {
    setPreviewURL(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveCurrentPhoto = () => {
    onImageChange(DEFAULT_STUDENT_IMAGE);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Öğrenci Fotoğrafı
      </label>
      
      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <div className="relative mb-3">
        {/* Image preview area */}
        <div
          className="relative w-32 h-32 rounded-full overflow-hidden shadow-md cursor-pointer border-2 border-indigo-500 hover:border-indigo-600 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Current or preview image */}
          <img 
            src={previewURL || currentPhotoURL || DEFAULT_STUDENT_IMAGE} 
            alt="Öğrenci fotoğrafı" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_STUDENT_IMAGE;
            }}
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Delete button */}
        {currentPhotoURL && currentPhotoURL !== DEFAULT_STUDENT_IMAGE && !previewURL && (
          <button
            type="button"
            onClick={handleRemoveCurrentPhoto}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Preview controls */}
      {previewURL && (
        <div className="flex flex-col items-center gap-2 mt-2">
          <p className="text-xs text-gray-500 text-center">
            Seçilen fotoğrafı kaydetmek için onaylayın veya iptal edin.
          </p>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmUpload}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
              disabled={isUploading}
            >
              Onayla
            </button>
            
            <button
              type="button"
              onClick={cancelUpload}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
              disabled={isUploading}
            >
              İptal
            </button>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 mt-1">
          {error}
        </p>
      )}
      
      {/* Loading indicator */}
      {isUploading && (
        <div className="flex justify-center mt-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}
      
      {/* Help text */}
      {!previewURL && (
        <p className="text-xs text-gray-500 mt-1">
          Fotoğraf yüklemek için yukarıdaki alana tıklayın.
        </p>
      )}
    </div>
  );
};

interface StudentManagementProps {
  isAdmin?: boolean;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ isAdmin = false }) => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<FirebaseUser[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<FirebaseUser[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<FirebaseUser | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  // Photo modal state
  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{url: string, name: string} | null>(null);
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
    createAccount: false
  });

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

  // Fetch all users (students, instructors, schools) from Firestore
  const fetchAllUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all users from Firestore
      const usersRef = collection(db, 'users');
      let q;
      
      if (isAdmin) {
        // Admin sees all students
        q = query(usersRef, orderBy('createdAt', 'desc'));
      } else {
        // Instructors only see their students
        q = query(
          usersRef, 
          where('instructorId', '==', currentUser?.uid),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      const studentsData: FirebaseUser[] = [];
      const instructorsData: Instructor[] = [];
      const schoolsData: School[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;
        
        // Role değerini kontrol et - string veya array olabilir
        let role = data.role;
        
        // Test için her rolü 
        if (Array.isArray(role)) {
          // Role bir array ise her role türüne göre işlem yap
          if (role.includes('student')) {
            studentsData.push({ id, ...data } as FirebaseUser);
          }
          if (role.includes('instructor')) {
            instructorsData.push({
              id,
              displayName: data.displayName || 'İsimsiz Eğitmen',
              email: data.email || ''
            });
          }
          if (role.includes('school')) {
            schoolsData.push({
              id,
              displayName: data.displayName || 'İsimsiz Okul',
              email: data.email || ''
            });
          }
        } else {
          // Role bir string ise
          if (role === 'student') {
            studentsData.push({ id, ...data } as FirebaseUser);
          } else if (role === 'instructor') {
            instructorsData.push({
              id,
              displayName: data.displayName || 'İsimsiz Eğitmen',
              email: data.email || ''
            });
          } else if (role === 'school') {
            schoolsData.push({
              id,
              displayName: data.displayName || 'İsimsiz Okul',
              email: data.email || ''
            });
          }
        }
      });
      
      console.log(`${studentsData.length} öğrenci bulundu`);
      if (!isAdmin) {
        console.log('Instructor ID:', currentUser?.uid);
        console.log('Found students:', studentsData.map(s => ({
          name: s.displayName,
          instructorId: s.instructorId
        })));
      }
      
      setStudents(studentsData);
      setFilteredStudents(studentsData);
      setInstructors(instructorsData);
      setSchools(schoolsData);
    } catch (err) {
      console.error('Kullanıcılar yüklenirken hata oluştu:', err);
      setError(`Kullanıcılar yüklenirken bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}. Lütfen sayfayı yenileyin.`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students, instructors and schools on initial load
  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Update filtered students when search term changes
  useEffect(() => {
    filterStudents();
  }, [searchTerm, students]);

  // Filter students based on search term
  const filterStudents = () => {
    let filtered = [...students];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.displayName.toLowerCase().includes(term) || 
        student.email.toLowerCase().includes(term)
      );
    }
    
    setFilteredStudents(filtered);
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
    setEditMode(true);
  };

  // Add new student
  const addNewStudent = (): void => {
    setSelectedStudent(null);
    setFormData({
      id: '',
      displayName: '',
      email: '',
      phoneNumber: '',
      level: 'beginner',
      photoURL: generateInitialsAvatar('?', 'student'),
      instructorId: '',
      schoolId: '',
      password: '',
      createAccount: false
    });
    setEditMode(true);
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

  // Open Photo Modal
  const openPhotoModal = (photoURL: string, studentName: string) => {
    setSelectedPhoto({
      url: photoURL || DEFAULT_STUDENT_IMAGE,
      name: studentName
    });
    setPhotoModalOpen(true);
  };

  // Handle photo change
  const handlePhotoChange = async (base64Image: string | null): Promise<void> => {
    try {
      if (base64Image === null) {
        // If photo is removed, set to default
        setFormData(prev => ({
          ...prev,
          photoURL: DEFAULT_STUDENT_IMAGE
        }));
        return;
      }
      
      // Resize image to reduce size
      const resizedImage = await resizeImageFromBase64(base64Image, 400, 400, 0.75);
      
      // Update form state
      setFormData(prev => ({
        ...prev,
        photoURL: resizedImage
      }));
    } catch (err) {
      console.error('Fotoğraf işlenirken hata oluştu:', err);
      setError('Fotoğraf işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Davetiye e-postası gönderme fonksiyonu
  const sendInvitationEmail = async (email: string, invitationData: {
    displayName: string;
    level?: DanceLevel;
    phoneNumber?: string;
    instructorId?: string;
    instructorName?: string;
    schoolId?: string;
    schoolName?: string;
    photoURL?: string;
  }) => {
    try {
      // Benzersiz bir davet kodu oluştur
      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Remove undefined values from invitationData
      const cleanedInvitationData = Object.fromEntries(
        Object.entries({
          email,
          ...invitationData,
          status: 'pending',
          type: 'student',
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 gün geçerli
        }).filter(([_, value]) => value !== undefined)
      );

      // Davet bilgilerini Firestore'a kaydet
      await setDoc(doc(db, 'pendingUsers', invitationId), cleanedInvitationData);

      // Kullanıcıyı users koleksiyonuna ekle
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Timestamp.now();
      
      const userData = {
        id: userId,
        email,
        displayName: invitationData.displayName,
        role: 'student',
        level: invitationData.level || 'beginner',
        photoURL: invitationData.photoURL || DEFAULT_STUDENT_IMAGE,
        phoneNumber: invitationData.phoneNumber || '',
        instructorId: invitationData.instructorId || null,
        instructorName: invitationData.instructorName || null,
        schoolId: invitationData.schoolId || null,
        schoolName: invitationData.schoolName || null,
        createdAt: now,
        updatedAt: now,
        status: 'pending'
      };

      await setDoc(doc(db, 'users', userId), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Öğrenci listesini güncelle
      setStudents(prevStudents => [
        userData as FirebaseUser,
        ...prevStudents
      ]);

      return true;
    } catch (error) {
      console.error('Davet gönderilirken hata oluştu:', error);
      throw error;
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
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
          schoolName = selectedSchool?.displayName || '';
        }
        
        // Öğrenci güncellenirken role değeri korunur (değiştirilmez)
        const updateData = {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          level: formData.level,
          instructorId: formData.instructorId || null,
          instructorName: instructorName || null,
          schoolId: formData.schoolId || null,
          schoolName: schoolName || null,
          photoURL: formData.photoURL || DEFAULT_STUDENT_IMAGE,
          updatedAt: serverTimestamp()
        };
        
        try {
          await updateDoc(userRef, updateData);
          console.log('Öğrenci güncellendi:', selectedStudent.id);
          
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
                  photoURL: formData.photoURL || DEFAULT_STUDENT_IMAGE,
                  updatedAt: serverTimestamp() as Timestamp 
                } 
              : student
          );
          
          setStudents(updatedStudents);
          setSuccess('Öğrenci bilgileri başarıyla güncellendi.');
        } catch (updateError) {
          console.error('Öğrenci güncellenirken hata:', updateError);
          throw new Error('Öğrenci güncellenirken bir hata oluştu: ' + 
            (updateError instanceof Error ? updateError.message : 'Bilinmeyen hata'));
        }
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
          schoolName = selectedSchool?.displayName || '';
        }

        // Davet gönder
        await sendInvitationEmail(formData.email, {
          displayName: formData.displayName,
          level: formData.level,
          phoneNumber: formData.phoneNumber,
          instructorId: formData.instructorId,
          instructorName: instructorName,
          schoolId: formData.schoolId,
          schoolName: schoolName,
          photoURL: formData.photoURL
        });
        
        setSuccess('Öğrenci başarıyla eklendi ve davet e-postası gönderildi.');
      }
      
      // Close the form
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
                    target.src = generateInitialsAvatar(student.displayName, 'student');
                  }}
                />
              ) : (
                <img 
                  className="h-10 w-10 rounded-full object-cover" 
                  src={generateInitialsAvatar(student.displayName, 'student')}
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
      
      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal 
          isOpen={photoModalOpen}
          onClose={() => setPhotoModalOpen(false)}
          photoURL={selectedPhoto.url}
          studentName={selectedPhoto.name}
          defaultImagePath={DEFAULT_STUDENT_IMAGE}
        />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Öğrenci Yönetimi</h2>
        {!editMode && (
          <button 
            onClick={addNewStudent}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Yükleniyor...' : 'Yeni Öğrenci Ekle'}
          </button>
        )}
      </div>
      
      {editMode ? (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {selectedStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
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
                  helperText={selectedStudent ? "Mevcut öğrencilerin e-posta adresleri değiştirilemez." : ""}
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
              
              <div>
                <ImageUploader 
                  currentPhotoURL={formData.photoURL}
                  onImageChange={handlePhotoChange}
                  displayName={formData.displayName || '?'}
                  userType="student"
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
                      label: school.displayName
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
                    Öğrenci
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
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