import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../../../../api/firebase/firebase';
import { 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Typography,
  Chip,
  IconButton,
  Avatar,
  Tooltip,
  Alert,
  CircularProgress,
  Grid,
  SelectChangeEvent
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Photo as PhotoIcon
} from '@mui/icons-material';
import { DanceLevel, DanceStyle } from '../../../../types';
import CustomInput from '../../../../common/components/ui/CustomInput';
import CustomSelect from '../../../../common/components/ui/CustomSelect';
import CustomPhoneInput from '../../../../common/components/ui/CustomPhoneInput';
import ImageUploader from '../../../../common/components/ui/ImageUploader';

interface Student {
  id: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  level?: DanceLevel;
  photoURL?: string;
  instructorId?: string | null;
  instructorName?: string | null;
  danceStyles?: DanceStyle[];
  progress?: {
    [key: string]: {
      level: DanceLevel;
      completedClasses: number;
      lastUpdated: Timestamp;
    }
  };
  createdAt: Timestamp;
  badges?: string[];
  schoolId?: string | null;
  schoolName?: string | null;
}

interface SchoolInfo {
  id: string;
  displayName: string;
  [key: string]: any;
}

interface Instructor {
  id: string;
  displayName: string;
  email: string;
}

interface StudentFormData {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  countryCode: string;
  level: DanceLevel;
  photoURL: string;
  instructorId: string;
  danceStyles: DanceStyle[];
}

interface DanceStyleOption {
  id: string;
  name: string;
  value: DanceStyle;
  description?: string;
  icon?: string;
  active: boolean;
}

const defaultStudentFormData: StudentFormData = {
  id: '',
  displayName: '',
  email: '',
  phoneNumber: '',
  countryCode: '+90',
  level: 'beginner',
  photoURL: '',
  instructorId: '',
  danceStyles: []
};

const StudentManagement: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [danceStyles, setDanceStyles] = useState<DanceStyleOption[]>([]);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>(defaultStudentFormData);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchInstructors();
    fetchDanceStyles();
  }, [schoolInfo.id]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const filtered = students.filter(student => 
      student.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const currentUserId = 'hlhpXCJknrhrA8Ths11WI9Ao1S42';
      console.log('Fetching students for currentUserId:', currentUserId);
      
      const studentsRef = collection(db, 'users');
      const q = query(
        studentsRef, 
        where('role', 'in', ['student', ['student']]),
        where('schoolId', '==', currentUserId),
        orderBy('createdAt', 'desc')
      );
      
      console.log('Query parameters:', {
        role: ['student', ['student']],
        schoolId: currentUserId
      });
      
      const querySnapshot = await getDocs(q);
      const studentsData: Student[] = [];
      
      console.log('Query returned:', querySnapshot.size, 'students');
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Raw student data:', {
          id: doc.id,
          displayName: data.displayName,
          email: data.email,
          schoolId: data.schoolId,
          role: data.role
        });
        
        studentsData.push({
          id: doc.id,
          ...doc.data()
        } as Student);
      });
      
      console.log('Final students:', studentsData.length);
      console.log('Students data:', studentsData.map(s => ({
        id: s.id,
        name: s.displayName,
        email: s.email,
        schoolId: s.schoolId
      })));
      
      setStudents(studentsData);
      setFilteredStudents(studentsData);
      setLoading(false);
    } catch (err) {
      console.error('Öğrenciler yüklenirken bir hata oluştu:', err);
      setError('Öğrenciler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    try {
      const instructorsRef = collection(db, 'users');
      const q = query(
        instructorsRef, 
        where('role', '==', 'instructor'),
        where('schoolId', '==', schoolInfo.id)
      );
      
      const querySnapshot = await getDocs(q);
      const instructorsData: Instructor[] = [];
      
      querySnapshot.forEach((doc) => {
        instructorsData.push({
          id: doc.id,
          displayName: doc.data().displayName || 'İsimsiz Eğitmen',
          email: doc.data().email
        });
      });
      
      setInstructors(instructorsData);
    } catch (err) {
      console.error('Eğitmenler yüklenirken bir hata oluştu:', err);
    }
  };

  const fetchDanceStyles = async () => {
    try {
      console.log('Dans stilleri yükleniyor...');
      const danceStylesRef = collection(db, 'danceStyles');
      const q = query(danceStylesRef, orderBy('label'));
      
      console.log('Dans stilleri sorgusu:', {
        collection: 'danceStyles',
        orderBy: 'label'
      });
      
      const querySnapshot = await getDocs(q);
      console.log('Dans stilleri sorgu sonucu:', {
        totalDocs: querySnapshot.size,
        empty: querySnapshot.empty
      });
      
      const danceStylesData: DanceStyleOption[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Dans stili dokümanı:', {
          id: doc.id,
          data: {
            label: data.label,
            value: data.value,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          }
        });
        
        danceStylesData.push({
          id: doc.id,
          name: data.label,
          value: data.value,
          active: true
        });
      });
      
      if (danceStylesData.length === 0) {
        console.warn('⚠️ Firestore\'dan dans stili gelmedi, varsayılan stiller kullanılacak');
        const defaultStyles: DanceStyleOption[] = [
          { id: 'salsa', name: 'Salsa', value: 'salsa', active: true },
          { id: 'bachata', name: 'Bachata', value: 'bachata', active: true },
          { id: 'kizomba', name: 'Kizomba', value: 'kizomba', active: true },
          { id: 'zouk', name: 'Zouk', value: 'zouk', active: true },
          { id: 'tango', name: 'Tango', value: 'tango', active: true },
          { id: 'other', name: 'Diğer', value: 'other', active: true }
        ];
        console.log('Varsayılan dans stilleri:', defaultStyles);
        setDanceStyles(defaultStyles);
      } else {
        console.log('✅ Firebase\'den yüklenen dans stilleri:', danceStylesData);
        setDanceStyles(danceStylesData);
      }
    } catch (err) {
      console.error('❌ Dans stilleri yüklenirken hata oluştu:', err);
      const defaultStyles: DanceStyleOption[] = [
        { id: 'salsa', name: 'Salsa', value: 'salsa', active: true },
        { id: 'bachata', name: 'Bachata', value: 'bachata', active: true },
        { id: 'kizomba', name: 'Kizomba', value: 'kizomba', active: true },
        { id: 'zouk', name: 'Zouk', value: 'zouk', active: true },
        { id: 'tango', name: 'Tango', value: 'tango', active: true },
        { id: 'other', name: 'Diğer', value: 'other', active: true }
      ];
      console.log('⚠️ Hata nedeniyle varsayılan dans stilleri kullanılıyor:', defaultStyles);
      setDanceStyles(defaultStyles);
    }
  };

  const handleOpenDialog = (isEditMode: boolean, student?: Student) => {
    setIsEdit(isEditMode);
    
    if (isEditMode && student) {
      setFormData({
        id: student.id,
        displayName: student.displayName,
        email: student.email,
        phoneNumber: student.phoneNumber || '',
        countryCode: student.phoneNumber?.slice(0, 3) || '+90',
        level: student.level || 'beginner',
        photoURL: student.photoURL || '',
        instructorId: student.instructorId || '',
        danceStyles: student.danceStyles || []
      });
    } else {
      setFormData(defaultStudentFormData);
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(defaultStudentFormData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: any } }
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      phoneNumber: value
    }));
  };

  const handleDanceStylesChange = (value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      danceStyles: value as DanceStyle[]
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const currentUserId = 'hlhpXCJknrhrA8Ths11WI9Ao1S42';
      console.log('Handling student submit with currentUserId:', currentUserId);
      
      let instructorName = '';
      if (formData.instructorId) {
        const instructor = instructors.find(ins => ins.id === formData.instructorId);
        instructorName = instructor?.displayName || '';
      }
      
      if (isEdit) {
        const studentRef = doc(db, 'users', formData.id);
        await updateDoc(studentRef, {
          displayName: formData.displayName,
          phoneNumber: formData.countryCode + formData.phoneNumber,
          level: formData.level,
          instructorId: formData.instructorId || null,
          instructorName: instructorName || null,
          schoolId: currentUserId,
          schoolName: schoolInfo.displayName,
          danceStyles: formData.danceStyles,
          photoURL: formData.photoURL || '/assets/placeholders/default-student.png',
          updatedAt: serverTimestamp()
        });
        
        setStudents(students.map(student => 
          student.id === formData.id 
            ? { 
                ...student, 
                displayName: formData.displayName,
                phoneNumber: formData.countryCode + formData.phoneNumber,
                level: formData.level,
                instructorId: formData.instructorId || null,
                instructorName: instructorName || null,
                schoolId: currentUserId,
                schoolName: schoolInfo.displayName,
                danceStyles: formData.danceStyles,
                photoURL: formData.photoURL || '/assets/placeholders/default-student.png',
              } 
            : student
        ));
        
        setSuccessMessage('Öğrenci bilgileri başarıyla güncellendi.');
      } else {
        const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', formData.email)));
        
        if (!userSnapshot.empty) {
          const existingUser = userSnapshot.docs[0];
          const existingUserId = existingUser.id;
          
          await updateDoc(doc(db, 'users', existingUserId), {
            schoolId: currentUserId,
            schoolName: schoolInfo.displayName,
            instructorId: formData.instructorId || null,
            instructorName: instructorName || null,
            updatedAt: serverTimestamp()
          });
          
          const existingUserData = existingUser.data() as Student;
          const updatedStudent = {
            ...existingUserData,
            id: existingUserId,
            schoolId: currentUserId,
            schoolName: schoolInfo.displayName,
            instructorId: formData.instructorId || null,
            instructorName: instructorName || null,
          };
          
          setStudents([updatedStudent, ...students]);
          setSuccessMessage('Mevcut öğrenci okulunuza bağlandı.');
        } else {
          const newStudentId = `student_${Date.now()}`;
          const newStudentData = {
            id: newStudentId,
            displayName: formData.displayName,
            email: formData.email,
            phoneNumber: formData.countryCode + formData.phoneNumber,
            role: 'student',
            level: formData.level,
            instructorId: formData.instructorId || null,
            instructorName: instructorName || null,
            schoolId: currentUserId,
            schoolName: schoolInfo.displayName,
            danceStyles: formData.danceStyles,
            photoURL: formData.photoURL || '/assets/placeholders/default-student.png',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await setDoc(doc(db, 'users', newStudentId), newStudentData);
          
          const newStudent = {
            ...newStudentData,
            createdAt: Timestamp.now()
          } as Student;
          
          setStudents([newStudent, ...students]);
          setSuccessMessage('Yeni öğrenci başarıyla eklendi.');
        }
      }
      
      setLoading(false);
      handleCloseDialog();
    } catch (err) {
      console.error('Öğrenci kaydedilirken bir hata oluştu:', err);
      setError('Öğrenci kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  const handleDeleteConfirmOpen = (studentId: string) => {
    setSelectedStudentId(studentId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudentId) return;
    
    try {
      setLoading(true);
      
      const studentRef = doc(db, 'users', selectedStudentId);
      await updateDoc(studentRef, {
        schoolId: null,
        schoolName: null,
        instructorId: null,
        instructorName: null,
        updatedAt: serverTimestamp()
      });
      
      setStudents(students.filter(student => student.id !== selectedStudentId));
      setSuccessMessage('Öğrenci okul listenizden kaldırıldı.');
      
      setLoading(false);
      setDeleteConfirmOpen(false);
      setSelectedStudentId(null);
    } catch (err) {
      console.error('Öğrenci silinirken bir hata oluştu:', err);
      setError('Öğrenci silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  const getLevelText = (level: DanceLevel) => {
    const levels = {
      beginner: 'Başlangıç',
      intermediate: 'Orta',
      advanced: 'İleri',
      professional: 'Profesyonel'
    };
    return levels[level] || '-';
  };

  return (
    <div className="container mx-auto px-4">
      {successMessage && (
        <div className="mb-4">
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Typography variant="h5" component="h2" className="text-gray-900">
            Öğrenci Yönetimi
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Öğrencilerinizi ekleyin, düzenleyin ve yönetin
          </Typography>
        </div>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <CustomInput
            placeholder="Öğrenci ara..."
            name="search"
            label=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            className="min-w-[200px]"
          />
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog(false)}
            className="whitespace-nowrap"
          >
            Yeni Öğrenci
          </Button>
        </div>
      </div>

      <div className="hidden md:block">
        <TableContainer component={Paper} className="shadow-md rounded-lg">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="font-semibold">Öğrenci</TableCell>
                <TableCell className="font-semibold">E-posta</TableCell>
                <TableCell className="font-semibold">Seviye</TableCell>
                <TableCell className="font-semibold">Eğitmen</TableCell>
                <TableCell className="font-semibold text-right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" className="py-8">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" className="py-8 text-gray-500">
                    {searchTerm ? 'Aramanızla eşleşen öğrenci bulunamadı.' : 'Henüz öğrenci bulunmuyor.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={student.photoURL}
                          alt={student.displayName}
                          className="w-10 h-10"
                        >
                          {student.displayName[0]}
                        </Avatar>
                        <div>
                          <Typography variant="body1" className="font-medium">
                            {student.displayName}
                          </Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          student.level === 'beginner' ? 'Başlangıç' :
                          student.level === 'intermediate' ? 'Orta' :
                          student.level === 'advanced' ? 'İleri' :
                          student.level === 'professional' ? 'Profesyonel' : '-'
                        }
                        size="small"
                        color={
                          student.level === 'beginner' ? 'default' :
                          student.level === 'intermediate' ? 'primary' :
                          student.level === 'advanced' ? 'secondary' :
                          student.level === 'professional' ? 'success' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{student.instructorName || '-'}</TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-2">
                        <Tooltip title="Düzenle">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(true, student)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sil">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <CircularProgress />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Aramanızla eşleşen öğrenci bulunamadı.' : 'Henüz öğrenci bulunmuyor.'}
          </div>
        ) : (
          filteredStudents.map((student) => (
            <Paper key={student.id} className="p-4 rounded-lg shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar
                    src={student.photoURL}
                    alt={student.displayName}
                    className="w-12 h-12 flex-shrink-0"
                  >
                    {student.displayName[0]}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Typography 
                      variant="subtitle1" 
                      className="font-medium truncate"
                      title={student.displayName}
                    >
                      {student.displayName}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      className="text-gray-600 truncate"
                      title={student.email}
                    >
                      {student.email}
                    </Typography>
                  </div>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(true, student)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setSelectedStudentId(student.id);
                      setDeleteConfirmOpen(true);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <Typography variant="caption" className="text-gray-500">
                    Seviye
                  </Typography>
                  <Chip
                    label={
                      student.level === 'beginner' ? 'Başlangıç' :
                      student.level === 'intermediate' ? 'Orta' :
                      student.level === 'advanced' ? 'İleri' :
                      student.level === 'professional' ? 'Profesyonel' : '-'
                    }
                    size="small"
                    color={
                      student.level === 'beginner' ? 'default' :
                      student.level === 'intermediate' ? 'primary' :
                      student.level === 'advanced' ? 'secondary' :
                      student.level === 'professional' ? 'success' : 'default'
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Typography variant="caption" className="text-gray-500">
                    Eğitmen
                  </Typography>
                  <Typography variant="body2">
                    {student.instructorName || '-'}
                  </Typography>
                </div>
                {student.danceStyles && student.danceStyles.length > 0 && (
                  <div className="col-span-2">
                    <Typography variant="caption" className="text-gray-500">
                      Dans Stilleri
                    </Typography>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.danceStyles.map((style) => {
                        const danceStyle = danceStyles.find(ds => ds.value === style);
                        return (
                          <Chip
                            key={style}
                            label={danceStyle?.name || style}
                            size="small"
                            variant="outlined"
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Paper>
          ))
        )}
      </div>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Öğrenciyi Sil</DialogTitle>
        <DialogContent>
          <Typography>Bu öğrenciyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            İptal
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (selectedStudentId) {
                handleDeleteStudent();
                setDeleteConfirmOpen(false);
              }
            }}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isEdit ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
        </DialogTitle>
        <DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <CustomInput
              label="Ad Soyad"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              required
              fullWidth
            />
            <CustomInput
              label="E-posta"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              fullWidth
              disabled={isEdit}
            />
            <CustomPhoneInput
              label="Telefon"
              name="phoneNumber"
              countryCode={formData.countryCode}
              phoneNumber={formData.phoneNumber}
              onCountryCodeChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
              onPhoneNumberChange={handlePhoneChange}
              fullWidth
            />
            <CustomSelect
              label="Seviye"
              name="level"
              value={formData.level}
              onChange={(value) => handleInputChange({ target: { name: 'level', value }})}
              options={[
                { value: 'beginner', label: 'Başlangıç' },
                { value: 'intermediate', label: 'Orta' },
                { value: 'advanced', label: 'İleri' },
                { value: 'professional', label: 'Profesyonel' }
              ]}
              fullWidth
            />
            <CustomSelect
              label="Eğitmen"
              name="instructorId"
              value={formData.instructorId}
              onChange={(value) => handleInputChange({ target: { name: 'instructorId', value }})}
              options={[
                { value: '', label: 'Seçiniz' },
                ...instructors.map(instructor => ({
                  value: instructor.id,
                  label: instructor.displayName
                }))
              ]}
              fullWidth
            />
            <CustomSelect
              label="Dans Stilleri"
              name="danceStyles"
              value={formData.danceStyles}
              onChange={handleDanceStylesChange}
              options={danceStyles.map(style => ({
                value: style.value,
                label: style.name
              }))}
              multiple
              fullWidth
            />
            <div className="col-span-full">
              <ImageUploader
                currentPhotoURL={formData.photoURL}
                onImageChange={(base64Image: string | null) => setFormData(prev => ({ ...prev, photoURL: base64Image || '' }))}
                displayName={formData.displayName}
                userType="student"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            İptal
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StudentManagement; 