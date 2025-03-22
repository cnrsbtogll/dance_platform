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
  Timestamp,
  writeBatch
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
import { Button, TablePagination, TableSortLabel } from '@mui/material';
import { StudentForm } from './forms/StudentForm';
import { InstructorForm } from './forms/InstructorForm';
import { SchoolForm } from './forms/SchoolForm';
import { StudentFormData, InstructorFormData, SchoolFormData } from './types';

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
  role: UserRole;
  instructorId: string;
  schoolId: string;
  // Optional fields for different user types
  specialties?: string[];
  experience?: number;
  bio?: string;
  availability?: {
    days: string[];
    hours: string[];
  };
  address?: string;
  city?: string;
  district?: string;
  description?: string;
  facilities?: string[];
  contactPerson?: string;
  website?: string;
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
  displayName: string;
  email: string;
}

// Add new interfaces for sorting and filtering
interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  roles: string[];
}

type FormDataType = StudentFormData | InstructorFormData | SchoolFormData;

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
  const [formData, setFormData] = useState<FormDataType>({
    id: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    level: 'beginner',
    photoURL: '',
    role: 'student',
    instructorId: '',
    schoolId: '',
    danceStyles: []
  } as StudentFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: '', direction: 'asc' });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({ roles: [] });
  const [selectedUserType, setSelectedUserType] = useState<'student' | 'instructor' | 'school' | null>(null);

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
          
          const isAdmin = roles.includes('admin');
          console.log('Setting admin status to:', isAdmin);
          setIsSuperAdmin(isAdmin);
        }
      } catch (err) {
        console.error('Süper admin kontrolü yapılırken hata oluştu:', err);
      }
    };
    
    checkIfSuperAdmin();
  }, []);

  // Separate effect for fetching users after admin status is determined
  useEffect(() => {
    console.log('Admin status changed, fetching users...', { isSuperAdmin });
    if (currentUser) {
      fetchAllUsers();
    }
  }, [isSuperAdmin, currentUser]);

  const fetchAllUsers = useCallback(async () => {
    console.log('Fetching all users...');
    console.log('Current user:', currentUser?.uid);
    console.log('Is super admin:', isSuperAdmin);
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all users from Firestore
      const usersRef = collection(db, 'users');
      let q;
      
      if (isSuperAdmin) {
        // Admin sees all users except other admins
        console.log('Fetching as admin - all users');
        // Temporarily simplify the query to just orderBy
        q = query(
          usersRef,
          orderBy('createdAt', 'desc')
        );
      } else {
        // Instructors only see their students
        console.log('Fetching as instructor - only assigned students');
        q = query(
          usersRef, 
          where('instructorId', '==', currentUser?.uid),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot size:', querySnapshot.size);
      
      const usersData: FirebaseUser[] = [];
      const instructorsData: Instructor[] = [];
      const schoolsData: School[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = { ...doc.data(), id: doc.id } as FirebaseUser;
        console.log('Processing user:', data.email, 'with roles:', data.role);
        
        // Convert role to array if it's a string
        if (!Array.isArray(data.role)) {
          data.role = [data.role];
        }

        // For admin, filter out admin users in memory
        if (isSuperAdmin && data.role.includes('admin')) {
          console.log('Skipping admin user:', data.email);
          return;
        }
        
        // Add to users list
        usersData.push(data);
        
        // Add to specific role lists
        if (data.role.includes('instructor')) {
          instructorsData.push({
            id: doc.id,
            displayName: data.displayName || 'İsimsiz Eğitmen',
            email: data.email || ''
          });
        }
        
        if (data.role.includes('school')) {
          schoolsData.push({
            id: doc.id,
            displayName: data.displayName || 'İsimsiz Okul',
            email: data.email || ''
          });
        }
      });
      
      console.log('Setting state with:', {
        users: usersData.length,
        instructors: instructorsData.length,
        schools: schoolsData.length
      });
      
      setStudents(usersData);
      setInstructors(instructorsData);
      setSchools(schoolsData);
      
      // Show index creation message if admin
      if (isSuperAdmin) {
        console.log('For better performance, please create the following index:');
        console.log('Collection: users');
        console.log('Fields: role (Ascending), createdAt (Descending)');
        console.log('You can create it here: https://console.firebase.google.com/project/danceplatform-7924a/firestore/indexes');
      }
      
    } catch (err) {
      console.error('Kullanıcılar yüklenirken hata oluştu:', err);
      if (err instanceof Error && err.message.includes('requires an index')) {
        setError(
          'Veritabanı indeksi oluşturulana kadar veriler sıralı olmadan gösterilecektir. ' +
          'Lütfen sistem yöneticinize başvurun.'
        );
      } else {
        setError(`Kullanıcılar yüklenirken bir hata oluştu: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}. Lütfen sayfayı yenileyin.`);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, isSuperAdmin]);

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!students.length) return [];
    
    if (!searchTerm) return students;
    
    const term = searchTerm.toLowerCase();
    return students.filter(student => 
      student.displayName.toLowerCase().includes(term) || 
      student.email.toLowerCase().includes(term)
    );
  }, [searchTerm, students]);

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
      role: 'student',
      instructorId: '',
      schoolId: '',
      danceStyles: []
    } as StudentFormData);
    setFormErrors({});
  };

  // Edit student
  const editStudent = (student: FirebaseUser): void => {
    setSelectedStudent(student);
    
    // Determine user type and set form data accordingly
    const userType = Array.isArray(student.role) ? student.role[0] : student.role;
    setSelectedUserType(userType as 'student' | 'instructor' | 'school');
    
    const baseFormData = {
      id: student.id,
      displayName: student.displayName,
      email: student.email,
      phoneNumber: student.phoneNumber || '',
      photoURL: student.photoURL || '',
      role: userType,
    };

    switch (userType) {
      case 'student':
        setFormData({
          ...baseFormData,
          level: student.level || 'beginner',
          instructorId: student.instructorId || '',
          schoolId: student.schoolId || '',
          danceStyles: student.danceStyles || []
        } as StudentFormData);
        break;
      case 'instructor':
        setFormData({
          ...baseFormData,
          level: student.level || 'professional',
          specialties: student.specialties || [],
          experience: student.experience || 0,
          bio: student.bio || '',
          schoolId: student.schoolId || '',
          availability: student.availability || { days: [], hours: [] }
        } as InstructorFormData);
        break;
      case 'school':
        setFormData({
          ...baseFormData,
          address: student.address || '',
          city: student.city || '',
          district: student.district || '',
          description: student.description || '',
          facilities: student.facilities || [],
          contactPerson: student.contactPerson || '',
          website: student.website || ''
        } as SchoolFormData);
        break;
    }

    setFormErrors({});
    setEditMode(true);
  };

  // Add new student
  const handleAddNewUser = (type: 'student' | 'instructor' | 'school') => {
    setSelectedUserType(type);
    setSelectedStudent(null);
    setFormData({
      id: '',
      displayName: '',
      email: '',
      phoneNumber: '',
      photoURL: generateInitialsAvatar('?', type),
      role: type,
      level: type === 'instructor' ? 'professional' : 'beginner',
      instructorId: '',
      schoolId: '',
      // Add type-specific default values
      ...(type === 'instructor' && {
        specialties: [],
        experience: 0,
        bio: '',
        availability: {
          days: [],
          hours: []
        }
      }),
      ...(type === 'school' && {
        address: '',
        city: '',
        district: '',
        description: '',
        facilities: [],
        contactPerson: '',
        website: ''
      })
    } as unknown as FormDataType);
    setFormErrors({});
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
    roles: UserRole[];
  }) => {
    try {
      // Benzersiz bir davet kodu oluştur
      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Remove undefined values and create clean data object
      const cleanData = {
        email,
        displayName: invitationData.displayName,
        roles: invitationData.roles,
        level: invitationData.level,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün geçerli
        ...(invitationData.schoolId ? { schoolId: invitationData.schoolId } : {}),
        ...(invitationData.schoolName ? { schoolName: invitationData.schoolName } : {}),
        ...(invitationData.instructorId ? { instructorId: invitationData.instructorId } : {}),
        ...(invitationData.instructorName ? { instructorName: invitationData.instructorName } : {})
      };

      // Davet bilgilerini Firestore'a kaydet
      await setDoc(doc(db, 'pendingUsers', invitationId), cleanData);

      // E-posta gönderme fonksiyonu burada implement edilecek
      // Firebase Cloud Functions kullanılabilir
      
      return true;
    } catch (error) {
      console.error('Davet gönderilirken hata oluştu:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (Object.keys(formErrors).length > 0) {
      setError('Lütfen form hatalarını düzeltin.');
      return;
    }

    if (!formData.role) {
      setError('Kullanıcı rolü seçilmemiş.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (selectedStudent) {
        const batch = writeBatch(db);
        
        // Common fields to update
        const commonFields = {
          displayName: formData.displayName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          photoURL: formData.photoURL,
          updatedAt: serverTimestamp()
        };

        // Update in users collection
        const userRef = doc(db, 'users', selectedStudent.id);
        batch.update(userRef, commonFields);

        // Update in role-specific collection
        switch (formData.role) {
          case 'student': {
            const studentData = formData as StudentFormData;
            const updateData = {
              ...commonFields,
              level: studentData.level,
              instructorId: studentData.instructorId || null,
              instructorName: instructors.find(i => i.id === studentData.instructorId)?.displayName || null,
              schoolId: studentData.schoolId || null,
              schoolName: schools.find(s => s.id === studentData.schoolId)?.displayName || null,
              danceStyles: studentData.danceStyles || []
            };
            batch.update(userRef, updateData);
            break;
          }
          case 'instructor': {
            const instructorData = formData as InstructorFormData;
            const instructorRef = doc(db, 'instructors', selectedStudent.id);
            const updateData = {
              ...commonFields,
              level: instructorData.level,
              specialties: instructorData.specialties,
              experience: instructorData.experience,
              bio: instructorData.bio,
              schoolId: instructorData.schoolId || null,
              schoolName: schools.find(s => s.id === instructorData.schoolId)?.displayName || null,
              availability: instructorData.availability
            };
            batch.update(userRef, updateData);
            batch.update(instructorRef, updateData);
            break;
          }
          case 'school': {
            const schoolData = formData as SchoolFormData;
            const schoolRef = doc(db, 'schools', selectedStudent.id);
            const updateData = {
              ...commonFields,
              address: schoolData.address,
              city: schoolData.city,
              district: schoolData.district,
              description: schoolData.description,
              facilities: schoolData.facilities,
              contactPerson: schoolData.contactPerson,
              website: schoolData.website
            };
            batch.update(userRef, updateData);
            batch.update(schoolRef, updateData);
            break;
          }
        }

        await batch.commit();

        // Update local state
        setStudents(prevStudents =>
          prevStudents.map(student =>
            student.id === selectedStudent.id
              ? {
                  ...student,
                  ...commonFields,
                  ...(formData.role === 'student' && { danceStyles: (formData as StudentFormData).danceStyles }),
                  ...(formData.role === 'instructor' && {
                    specialties: (formData as InstructorFormData).specialties,
                    experience: (formData as InstructorFormData).experience,
                    bio: (formData as InstructorFormData).bio,
                    availability: (formData as InstructorFormData).availability
                  }),
                  ...(formData.role === 'school' && {
                    address: (formData as SchoolFormData).address,
                    city: (formData as SchoolFormData).city,
                    district: (formData as SchoolFormData).district,
                    description: (formData as SchoolFormData).description,
                    facilities: (formData as SchoolFormData).facilities,
                    contactPerson: (formData as SchoolFormData).contactPerson,
                    website: (formData as SchoolFormData).website
                  })
                }
              : student
          )
        );

        setSuccess('Kullanıcı bilgileri başarıyla güncellendi.');
        setEditMode(false);
        setSelectedStudent(null);
        setSelectedUserType(null);
        resetForm();
      } else {
        // Yeni kullanıcı için kontroller
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
          schoolName = selectedSchool?.displayName || '';
        }

        // Eğer okul ekliyorsak
        if (formData.role === 'school') {
          const newSchoolRef = doc(collection(db, 'users'));
          const schoolData = {
            email: formData.email,
            displayName: formData.displayName,
            photoURL: formData.photoURL || generateInitialsAvatar(formData.displayName, 'school'),
            phoneNumber: formData.phoneNumber || '',
            role: ['school'] as UserRole[],
            level: formData.level,
            address: formData.address || '',
            city: formData.city || '',
            district: formData.district || '',
            description: formData.description || '',
            facilities: formData.facilities || [],
            contactPerson: formData.contactPerson || '',
            website: formData.website || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          // Batch write için
          const batch = writeBatch(db);

          // Users koleksiyonuna ekle
          batch.set(newSchoolRef, schoolData);

          // Schools koleksiyonuna ekle
          const schoolsRef = doc(collection(db, 'schools'), newSchoolRef.id);
          batch.set(schoolsRef, {
            ...schoolData,
            userId: newSchoolRef.id, // users koleksiyonundaki ID'yi referans olarak saklıyoruz
          });

          // Batch işlemini gerçekleştir
          await batch.commit();

          // State'i güncelle
          const newSchool: FirebaseUser = {
            id: newSchoolRef.id,
            ...schoolData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          setSchools(prev => [...prev, {
            id: newSchoolRef.id,
            displayName: formData.displayName,
            email: formData.email
          }]);

          setStudents(prev => [...prev, newSchool]);
          
          setSuccess('Dans okulu başarıyla eklendi.');
        } 
        // Eğer eğitmen ekliyorsak
        else if (formData.role === 'instructor') {
          const newInstructorRef = doc(collection(db, 'users'));
          const instructorData = {
            email: formData.email,
            displayName: formData.displayName,
            photoURL: formData.photoURL || generateInitialsAvatar(formData.displayName, 'instructor'),
            phoneNumber: formData.phoneNumber || '',
            role: ['instructor'] as UserRole[],
            level: formData.level,
            specialties: formData.specialties || [],
            experience: formData.experience || 0,
            bio: formData.bio || '',
            availability: formData.availability || { days: [], hours: [] },
            schoolId: formData.schoolId || null,
            schoolName: schoolName || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          // Batch write için
          const batch = writeBatch(db);

          // Users koleksiyonuna ekle
          batch.set(newInstructorRef, instructorData);

          // Instructors koleksiyonuna ekle
          const instructorsRef = doc(collection(db, 'instructors'), newInstructorRef.id);
          batch.set(instructorsRef, {
            ...instructorData,
            userId: newInstructorRef.id, // users koleksiyonundaki ID'yi referans olarak saklıyoruz
          });

          // Batch işlemini gerçekleştir
          await batch.commit();

          // State'i güncelle
          const newInstructor: FirebaseUser = {
            id: newInstructorRef.id,
            ...instructorData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          setInstructors(prev => [...prev, {
            id: newInstructorRef.id,
            displayName: formData.displayName,
            email: formData.email
          }]);

          setStudents(prev => [...prev, newInstructor]);
          
          setSuccess('Eğitmen başarıyla eklendi.');
        }
        // Diğer kullanıcı tipleri için davet gönder
        else {
          const invitationData = {
            displayName: formData.displayName,
            roles: [formData.role],
            level: formData.level,
            ...(formData.schoolId && { schoolId: formData.schoolId }),
            ...(schoolName && { schoolName }),
            ...(formData.instructorId && { instructorId: formData.instructorId }),
            ...(instructorName && { instructorName })
          };

          await sendInvitationEmail(formData.email, invitationData);

          // Yeni kullanıcıyı state'e ekle
          const newUser: FirebaseUser = {
            id: `pending_${Date.now()}`,
            email: formData.email,
            displayName: formData.displayName,
            photoURL: formData.photoURL,
            phoneNumber: formData.phoneNumber,
            role: formData.role,
            level: formData.level,
            instructorId: formData.instructorId || null,
            instructorName: instructorName || null,
            schoolId: formData.schoolId || null,
            schoolName: schoolName || null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          setStudents(prev => [...prev, newUser]);
          setSuccess('Davet e-postası başarıyla gönderildi.');
        }
      }
      
      setEditMode(false);
      setSelectedStudent(null);
      setSelectedUserType(null);
      
      // Formu sıfırla
      resetForm();
      
    } catch (err) {
      console.error('İşlem sırasında hata oluştu:', err);
      setError('İşlem sırasında bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
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

  // Get unique roles from all users
  const availableRoles = useMemo(() => {
    const roleSet = new Set<string>();
    students.forEach(student => {
      const roles = Array.isArray(student.role) ? student.role : [student.role];
      roles.forEach(role => {
        if (role !== 'admin') {
          roleSet.add(role);
        }
      });
    });
    return Array.from(roleSet);
  }, [students]);

  // Handle sort change
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle role filter change
  const handleRoleFilter = (role: string) => {
    setFilterConfig(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
    setPage(0); // Reset to first page when filter changes
  };

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(student =>
        student.displayName.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term)
      );
    }

    // Apply role filter
    if (filterConfig.roles.length > 0) {
      result = result.filter(student => {
        const studentRoles = Array.isArray(student.role) ? student.role : [student.role];
        return studentRoles.some(role => filterConfig.roles.includes(role));
      });
    }

    // Apply sorting
    if (sortConfig.field) {
      result.sort((a: any, b: any) => {
        let aValue = a[sortConfig.field];
        let bValue = b[sortConfig.field];

        // Special handling for roles array
        if (sortConfig.field === 'role') {
          aValue = Array.isArray(aValue) ? aValue.join(', ') : aValue;
          bValue = Array.isArray(bValue) ? bValue.join(', ') : bValue;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [students, searchTerm, sortConfig, filterConfig]);

  // Get current page data
  const paginatedStudents = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedStudents.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedStudents, page, rowsPerPage]);

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Add available roles for selection (excluding admin)
  const availableRolesForSelect = [
    { value: 'student', label: 'Öğrenci' },
    { value: 'instructor', label: 'Eğitmen' },
    { value: 'school', label: 'Dans Okulu' }
  ];

  // Render form based on user type
  const renderForm = () => {
    if (!editMode) return null;

    const commonProps = {
      formErrors,
      isEdit: !!selectedStudent,
      onInputChange: handleInputChange,
      onPhotoChange: handlePhotoChange
    };

    switch (selectedUserType) {
      case 'student':
        return (
          <StudentForm
            formData={formData as StudentFormData}
            instructors={instructors}
            schools={schools}
            {...commonProps}
          />
        );
      case 'instructor':
        return (
          <InstructorForm
            formData={formData as InstructorFormData}
            schools={schools}
            {...commonProps}
          />
        );
      case 'school':
        return (
          <SchoolForm
            formData={formData as SchoolFormData}
            {...commonProps}
          />
        );
      default:
        return null;
    }
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
          <div className="flex gap-2">
            <button 
              onClick={() => handleAddNewUser('student')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Yükleniyor...' : 'Yeni Öğrenci'}
            </button>
            <button 
              onClick={() => handleAddNewUser('instructor')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Yükleniyor...' : 'Yeni Eğitmen'}
            </button>
            <button 
              onClick={() => handleAddNewUser('school')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Yükleniyor...' : 'Yeni Dans Okulu'}
            </button>
          </div>
        )}
      </div>
      
      {editMode ? (
        <div className="bg-gray-50 p-6 rounded-lg relative">
          <h3 className="text-lg font-semibold mb-4">
            {selectedStudent ? 'Kullanıcı Düzenle' : `Yeni ${
              selectedUserType === 'student' ? 'Öğrenci' :
              selectedUserType === 'instructor' ? 'Eğitmen' :
              'Dans Okulu'
            } Ekle`}
          </h3>
          
          <form onSubmit={handleSubmit}>
            {renderForm()}
            
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditMode(false);
                  setSelectedUserType(null);
                }}
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
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ad veya e-posta ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {availableRoles.map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleFilter(role)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    filterConfig.roles.includes(role)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {role}
                </button>
              ))}
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
                    <TableSortLabel
                      active={sortConfig.field === 'displayName'}
                      direction={sortConfig.field === 'displayName' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('displayName')}
                    >
                      Kullanıcı
                    </TableSortLabel>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TableSortLabel
                      active={sortConfig.field === 'email'}
                      direction={sortConfig.field === 'email' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('email')}
                    >
                      E-posta
                    </TableSortLabel>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TableSortLabel
                      active={sortConfig.field === 'role'}
                      direction={sortConfig.field === 'role' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('role')}
                    >
                      Roller
                    </TableSortLabel>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TableSortLabel
                      active={sortConfig.field === 'level'}
                      direction={sortConfig.field === 'level' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('level')}
                    >
                      Dans Seviyesi
                    </TableSortLabel>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TableSortLabel
                      active={sortConfig.field === 'instructorName'}
                      direction={sortConfig.field === 'instructorName' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('instructorName')}
                    >
                      Eğitmen
                    </TableSortLabel>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <TableSortLabel
                      active={sortConfig.field === 'schoolName'}
                      direction={sortConfig.field === 'schoolName' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('schoolName')}
                    >
                      Okul
                    </TableSortLabel>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student) => renderStudent(student))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || filterConfig.roles.length > 0
                        ? 'Aramanıza veya seçtiğiniz filtrelere uygun kullanıcı bulunamadı.'
                        : 'Henüz hiç kullanıcı kaydı bulunmuyor.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <TablePagination
              component="div"
              count={filteredAndSortedStudents.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[25]}
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} / ${count}`
              }
              labelRowsPerPage="Sayfa başına satır:"
            />
          </div>
        </>
      )}
    </div>
  );
} 