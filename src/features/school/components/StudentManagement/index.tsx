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
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
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
  level: DanceLevel;
  photoURL: string;
  instructorId: string;
  danceStyles: DanceStyle[];
}

const defaultStudentFormData: StudentFormData = {
  id: '',
  displayName: '',
  email: '',
  phoneNumber: '',
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
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>(defaultStudentFormData);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dance styles
  const danceStyles: DanceStyle[] = ['salsa', 'bachata', 'kizomba', 'other'];

  useEffect(() => {
    fetchStudents();
    fetchInstructors();
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
      const studentsRef = collection(db, 'users');
      const q = query(
        studentsRef, 
        where('role', '==', 'student'),
        where('schoolId', '==', schoolInfo.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const studentsData: Student[] = [];
      
      querySnapshot.forEach((doc) => {
        studentsData.push({
          id: doc.id,
          ...doc.data()
        } as Student);
      });
      
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

  const handleOpenDialog = (isEditMode: boolean, student?: Student) => {
    setIsEdit(isEditMode);
    
    if (isEditMode && student) {
      setFormData({
        id: student.id,
        displayName: student.displayName,
        email: student.email,
        phoneNumber: student.phoneNumber || '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDanceStylesChange = (event: SelectChangeEvent<DanceStyle[]>) => {
    const value = event.target.value as DanceStyle[];
    setFormData({ ...formData, danceStyles: value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Instructor name for storing in the student record
      let instructorName = '';
      if (formData.instructorId) {
        const instructor = instructors.find(ins => ins.id === formData.instructorId);
        instructorName = instructor?.displayName || '';
      }
      
      if (isEdit) {
        // Update existing student
        const studentRef = doc(db, 'users', formData.id);
        await updateDoc(studentRef, {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          level: formData.level,
          instructorId: formData.instructorId || null,
          instructorName: instructorName || null,
          schoolId: schoolInfo.id,
          schoolName: schoolInfo.displayName,
          danceStyles: formData.danceStyles,
          photoURL: formData.photoURL || '/assets/placeholders/default-student.png',
          updatedAt: serverTimestamp()
        });
        
        // Update the student in the local state
        setStudents(students.map(student => 
          student.id === formData.id 
            ? { 
                ...student, 
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                level: formData.level,
                instructorId: formData.instructorId || null,
                instructorName: instructorName || null,
                schoolId: schoolInfo.id,
                schoolName: schoolInfo.displayName,
                danceStyles: formData.danceStyles,
                photoURL: formData.photoURL || '/assets/placeholders/default-student.png',
              } 
            : student
        ));
        
        setSuccessMessage('Öğrenci bilgileri başarıyla güncellendi.');
      } else {
        // Check if student with this email already exists
        const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', formData.email)));
        
        if (!userSnapshot.empty) {
          // Email already exists, just update the school association
          const existingUser = userSnapshot.docs[0];
          const existingUserId = existingUser.id;
          
          await updateDoc(doc(db, 'users', existingUserId), {
            schoolId: schoolInfo.id,
            schoolName: schoolInfo.displayName,
            instructorId: formData.instructorId || null,
            instructorName: instructorName || null,
            updatedAt: serverTimestamp()
          });
          
          // Add to the local state
          const existingUserData = existingUser.data() as Student;
          const updatedStudent = {
            ...existingUserData,
            id: existingUserId,
            schoolId: schoolInfo.id,
            schoolName: schoolInfo.displayName,
            instructorId: formData.instructorId || null,
            instructorName: instructorName || null,
          };
          
          setStudents([updatedStudent, ...students]);
          setSuccessMessage('Mevcut öğrenci okulunuza bağlandı.');
        } else {
          // Create a new student
          const newStudentId = `student_${Date.now()}`;
          const newStudentData = {
            id: newStudentId,
            displayName: formData.displayName,
            email: formData.email,
            phoneNumber: formData.phoneNumber || '',
            role: 'student',
            level: formData.level,
            instructorId: formData.instructorId || null,
            instructorName: instructorName || null,
            schoolId: schoolInfo.id,
            schoolName: schoolInfo.displayName,
            danceStyles: formData.danceStyles,
            photoURL: formData.photoURL || '/assets/placeholders/default-student.png',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await setDoc(doc(db, 'users', newStudentId), newStudentData);
          
          // Add the new student to the local state
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
      
      // Remove the school association from the student
      const studentRef = doc(db, 'users', selectedStudentId);
      await updateDoc(studentRef, {
        schoolId: null,
        schoolName: null,
        instructorId: null,
        instructorName: null,
        updatedAt: serverTimestamp()
      });
      
      // Remove from local state
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
    <div>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          Öğrenci Yönetimi
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Okulunuza kayıtlı öğrencileri yönetin, yeni öğrenciler ekleyin ve mevcut öğrencileri düzenleyin.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <TextField
          label="Öğrenci Ara"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: '300px' } }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
          }}
        />
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog(false)}
          sx={{ 
            bgcolor: 'primary.main', 
            '&:hover': { bgcolor: 'primary.dark' } 
          }}
        >
          Yeni Öğrenci
        </Button>
      </Box>
      
      {loading && students.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.light' }}>
              <TableRow>
                <TableCell>Öğrenci</TableCell>
                <TableCell>E-posta</TableCell>
                <TableCell>Seviye</TableCell>
                <TableCell>Dans Türleri</TableCell>
                <TableCell>Eğitmen</TableCell>
                <TableCell align="right">İşlemler</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={student.photoURL} 
                          alt={student.displayName}
                          sx={{ width: 40, height: 40, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="body1">{student.displayName}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {student.phoneNumber || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{getLevelText(student.level || 'beginner')}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {student.danceStyles && student.danceStyles.length > 0 ? (
                          student.danceStyles.map((style) => (
                            <Chip 
                              key={style} 
                              label={style.charAt(0).toUpperCase() + style.slice(1)} 
                              size="small" 
                              sx={{ fontWeight: 'medium' }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{student.instructorName || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Düzenle">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenDialog(true, student)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Sil">
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteConfirmOpen(student.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                      <SchoolIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm ? 'Arama kriterine uygun öğrenci bulunamadı.' : 'Henüz hiç öğrenci kaydı bulunmuyor.'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Farklı bir arama terimi deneyin veya yeni öğrenci ekleyin.' : 'Yeni bir öğrenci eklemek için "Yeni Öğrenci" butonuna tıklayın.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Add/Edit Student Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Ad Soyad"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="E-posta"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                required
                margin="normal"
                disabled={isEdit} // E-posta adresi düzenlenemez
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Telefon"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Dans Seviyesi</InputLabel>
                <Select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  label="Dans Seviyesi"
                >
                  <MenuItem value="beginner">Başlangıç</MenuItem>
                  <MenuItem value="intermediate">Orta</MenuItem>
                  <MenuItem value="advanced">İleri</MenuItem>
                  <MenuItem value="professional">Profesyonel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Eğitmen</InputLabel>
                <Select
                  name="instructorId"
                  value={formData.instructorId}
                  onChange={handleInputChange}
                  label="Eğitmen"
                >
                  <MenuItem value="">Eğitmen Seçilmedi</MenuItem>
                  {instructors.map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id}>
                      {instructor.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Dans Türleri</InputLabel>
                <Select
                  multiple
                  name="danceStyles"
                  value={formData.danceStyles}
                  onChange={handleDanceStylesChange}
                  label="Dans Türleri"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as DanceStyle[]).map((value) => (
                        <Chip key={value} label={value.charAt(0).toUpperCase() + value.slice(1)} />
                      ))}
                    </Box>
                  )}
                >
                  {danceStyles.map((style) => (
                    <MenuItem key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Profil Fotoğrafı URL"
                name="photoURL"
                value={formData.photoURL}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                placeholder="https://example.com/photo.jpg"
                helperText="Öğrencinin profil fotoğrafı için URL (opsiyonel)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            İptal
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.displayName || !formData.email}
          >
            {isEdit ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Öğrenciyi Sil</DialogTitle>
        <DialogContent>
          <Typography>
            Bu öğrenciyi okulunuzun listesinden kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="secondary">
            İptal
          </Button>
          <Button onClick={handleDeleteStudent} color="error" variant="contained">
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StudentManagement; 