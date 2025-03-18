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
  Card, 
  CardContent, 
  CardActions, 
  Grid, 
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
  Rating,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { DanceLevel, DanceStyle } from '../../../../types';

interface Instructor {
  id: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  danceStyles?: DanceStyle[];
  biography?: string;
  experience?: number;
  rating?: number;
  createdAt: Timestamp;
}

interface SchoolInfo {
  id: string;
  displayName: string;
  [key: string]: any;
}

interface InstructorFormData {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL: string;
  danceStyles: DanceStyle[];
  biography: string;
  experience: number;
}

const defaultInstructorFormData: InstructorFormData = {
  id: '',
  displayName: '',
  email: '',
  phoneNumber: '',
  photoURL: '',
  danceStyles: [],
  biography: '',
  experience: 0
};

const InstructorManagement: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<InstructorFormData>(defaultInstructorFormData);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dance styles and experience options
  const danceStyles: DanceStyle[] = ['salsa', 'bachata', 'kizomba', 'other'];
  const experienceLevels = [
    { value: 1, label: '1 yıldan az' },
    { value: 2, label: '1-3 yıl' },
    { value: 5, label: '3-5 yıl' },
    { value: 8, label: '5-10 yıl' },
    { value: 10, label: '10+ yıl' }
  ];

  useEffect(() => {
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
    const filtered = instructors.filter(instructor => 
      instructor.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInstructors(filtered);
  }, [searchTerm, instructors]);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const instructorsRef = collection(db, 'users');
      const q = query(
        instructorsRef, 
        where('role', '==', 'instructor'),
        where('schoolId', '==', schoolInfo.id),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const instructorsData: Instructor[] = [];
      
      querySnapshot.forEach((doc) => {
        instructorsData.push({
          id: doc.id,
          ...doc.data()
        } as Instructor);
      });
      
      setInstructors(instructorsData);
      setFilteredInstructors(instructorsData);
      setLoading(false);
    } catch (err) {
      console.error('Eğitmenler yüklenirken bir hata oluştu:', err);
      setError('Eğitmenler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      setLoading(false);
    }
  };

  const handleOpenDialog = (isEditMode: boolean, instructor?: Instructor) => {
    setIsEdit(isEditMode);
    
    if (isEditMode && instructor) {
      setFormData({
        id: instructor.id,
        displayName: instructor.displayName,
        email: instructor.email,
        phoneNumber: instructor.phoneNumber || '',
        photoURL: instructor.photoURL || '',
        danceStyles: instructor.danceStyles || [],
        biography: instructor.biography || '',
        experience: instructor.experience || 0
      });
    } else {
      setFormData(defaultInstructorFormData);
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData(defaultInstructorFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDanceStylesChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as DanceStyle[];
    setFormData({ ...formData, danceStyles: value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (isEdit) {
        // Update existing instructor
        const instructorRef = doc(db, 'users', formData.id);
        await updateDoc(instructorRef, {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          danceStyles: formData.danceStyles,
          biography: formData.biography,
          experience: formData.experience,
          photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png',
          updatedAt: serverTimestamp()
        });
        
        // Update the instructor in the local state
        setInstructors(instructors.map(instructor => 
          instructor.id === formData.id 
            ? { 
                ...instructor, 
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                danceStyles: formData.danceStyles,
                biography: formData.biography,
                experience: formData.experience,
                photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png',
              } 
            : instructor
        ));
        
        setSuccessMessage('Eğitmen bilgileri başarıyla güncellendi.');
      } else {
        // Check if instructor with this email already exists
        const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', formData.email)));
        
        if (!userSnapshot.empty) {
          // Email already exists, check if user is an instructor
          const existingUser = userSnapshot.docs[0];
          const existingUserId = existingUser.id;
          const userData = existingUser.data();
          
          if (userData.role === 'instructor' || (Array.isArray(userData.role) && userData.role.includes('instructor'))) {
            // Already an instructor, just update the school association
            await updateDoc(doc(db, 'users', existingUserId), {
              schoolId: schoolInfo.id,
              schoolName: schoolInfo.displayName,
              updatedAt: serverTimestamp()
            });
            
            // Add to the local state
            const existingInstructorData = existingUser.data() as Instructor;
            const updatedInstructor = {
              ...existingInstructorData,
              id: existingUserId,
              schoolId: schoolInfo.id,
              schoolName: schoolInfo.displayName,
            };
            
            setInstructors([updatedInstructor, ...instructors]);
            setSuccessMessage('Mevcut eğitmen okulunuza bağlandı.');
          } else {
            // User exists but not an instructor - update role to include instructor
            const currentRole = userData.role;
            let newRole;
            
            if (Array.isArray(currentRole)) {
              if (!currentRole.includes('instructor')) {
                newRole = [...currentRole, 'instructor'];
              } else {
                newRole = currentRole;
              }
            } else if (typeof currentRole === 'string') {
              newRole = currentRole === 'instructor' ? currentRole : ['instructor', currentRole];
            } else {
              newRole = 'instructor';
            }
            
            await updateDoc(doc(db, 'users', existingUserId), {
              role: newRole,
              schoolId: schoolInfo.id,
              schoolName: schoolInfo.displayName,
              danceStyles: formData.danceStyles,
              biography: formData.biography,
              experience: formData.experience,
              updatedAt: serverTimestamp()
            });
            
            // Add to the local state
            const existingUserData = existingUser.data() as Instructor;
            const updatedInstructor = {
              ...existingUserData,
              id: existingUserId,
              role: newRole,
              schoolId: schoolInfo.id,
              schoolName: schoolInfo.displayName,
              danceStyles: formData.danceStyles,
              biography: formData.biography,
              experience: formData.experience,
            };
            
            setInstructors([updatedInstructor, ...instructors]);
            setSuccessMessage('Kullanıcı eğitmen rolüne yükseltildi ve okulunuza bağlandı.');
          }
        } else {
          // Create a new instructor
          const newInstructorId = `instructor_${Date.now()}`;
          const newInstructorData = {
            id: newInstructorId,
            displayName: formData.displayName,
            email: formData.email,
            phoneNumber: formData.phoneNumber || '',
            role: 'instructor',
            danceStyles: formData.danceStyles,
            biography: formData.biography,
            experience: formData.experience,
            schoolId: schoolInfo.id,
            schoolName: schoolInfo.displayName,
            photoURL: formData.photoURL || '/assets/placeholders/default-instructor.png',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await setDoc(doc(db, 'users', newInstructorId), newInstructorData);
          
          // Add the new instructor to the local state
          const newInstructor = {
            ...newInstructorData,
            createdAt: Timestamp.now()
          } as Instructor;
          
          setInstructors([newInstructor, ...instructors]);
          setSuccessMessage('Yeni eğitmen başarıyla eklendi.');
        }
      }
      
      setLoading(false);
      handleCloseDialog();
    } catch (err) {
      console.error('Eğitmen kaydedilirken bir hata oluştu:', err);
      setError('Eğitmen kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  const handleDeleteConfirmOpen = (instructorId: string) => {
    setSelectedInstructorId(instructorId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteInstructor = async () => {
    if (!selectedInstructorId) return;
    
    try {
      setLoading(true);
      
      // Remove the school association from the instructor
      const instructorRef = doc(db, 'users', selectedInstructorId);
      await updateDoc(instructorRef, {
        schoolId: null,
        schoolName: null,
        updatedAt: serverTimestamp()
      });
      
      // Remove from local state
      setInstructors(instructors.filter(instructor => instructor.id !== selectedInstructorId));
      setSuccessMessage('Eğitmen okul listenizden kaldırıldı.');
      
      setLoading(false);
      setDeleteConfirmOpen(false);
      setSelectedInstructorId(null);
    } catch (err) {
      console.error('Eğitmen silinirken bir hata oluştu:', err);
      setError('Eğitmen silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  // Helper function to get a label for experience level
  const getExperienceText = (years: number) => {
    if (years < 1) return '1 yıldan az';
    if (years <= 3) return '1-3 yıl';
    if (years <= 5) return '3-5 yıl';
    if (years <= 10) return '5-10 yıl';
    return '10+ yıl';
  };

  return (
    <div>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          Eğitmen Yönetimi
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Okulunuza kayıtlı eğitmenleri yönetin, yeni eğitmenler ekleyin ve mevcut eğitmenleri düzenleyin.
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
          label="Eğitmen Ara"
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
          Yeni Eğitmen
        </Button>
      </Box>
      
      {loading && instructors.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredInstructors.length > 0 ? (
            filteredInstructors.map((instructor) => (
              <Grid item xs={12} sm={6} md={4} key={instructor.id}>
                <Card 
                  elevation={2} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 8
                    }
                  }}
                >
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar
                      src={instructor.photoURL}
                      alt={instructor.displayName}
                      sx={{ width: 100, height: 100, mb: 2 }}
                    />
                    <Typography variant="h6" align="center" gutterBottom>
                      {instructor.displayName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating 
                        value={instructor.rating || 0} 
                        readOnly 
                        precision={0.5}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {instructor.rating ? instructor.rating.toFixed(1) : 'Değerlendirilmemiş'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                      {instructor.danceStyles && instructor.danceStyles.map((style) => (
                        <Chip 
                          key={style} 
                          label={style.charAt(0).toUpperCase() + style.slice(1)} 
                          size="small" 
                          sx={{ fontWeight: 'medium' }}
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Divider />
                  <CardContent sx={{ flexGrow: 1 }}>
                    {instructor.biography && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {instructor.biography.length > 100
                          ? `${instructor.biography.substring(0, 100)}...`
                          : instructor.biography}
                      </Typography>
                    )}
                    
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2">{instructor.email}</Typography>
                      </Box>
                      {instructor.phoneNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2">{instructor.phoneNumber}</Typography>
                        </Box>
                      )}
                      {instructor.experience && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                          <Typography variant="body2">
                            Deneyim: {getExperienceText(instructor.experience)}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => handleOpenDialog(true, instructor)}
                      startIcon={<EditIcon />}
                    >
                      Düzenle
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteConfirmOpen(instructor.id)}
                      startIcon={<DeleteIcon />}
                    >
                      Kaldır
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 4, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2
              }}>
                <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {searchTerm ? 'Arama kriterine uygun eğitmen bulunamadı.' : 'Henüz hiç eğitmen kaydı bulunmuyor.'}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {searchTerm 
                    ? 'Farklı bir arama terimi deneyin veya yeni eğitmen ekleyin.' 
                    : 'Yeni bir eğitmen eklemek için "Yeni Eğitmen" butonuna tıklayın.'}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
      
      {/* Add/Edit Instructor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? 'Eğitmen Düzenle' : 'Yeni Eğitmen Ekle'}</DialogTitle>
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
                <InputLabel>Deneyim</InputLabel>
                <Select
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  label="Deneyim"
                >
                  {experienceLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Uzmanlık Alanları</InputLabel>
                <Select
                  multiple
                  name="danceStyles"
                  value={formData.danceStyles}
                  onChange={handleDanceStylesChange}
                  label="Uzmanlık Alanları"
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Profil Fotoğrafı URL"
                name="photoURL"
                value={formData.photoURL}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                placeholder="https://example.com/photo.jpg"
                helperText="Eğitmenin profil fotoğrafı için URL (opsiyonel)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Biyografi"
                name="biography"
                value={formData.biography}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                placeholder="Eğitmen hakkında kısa bir tanıtım yazısı..."
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
        <DialogTitle>Eğitmeni Kaldır</DialogTitle>
        <DialogContent>
          <Typography>
            Bu eğitmeni okulunuzun listesinden kaldırmak istediğinize emin misiniz? Bu işlem, eğitmeni tamamen silmez, sadece okulunuzla olan bağlantısını kaldırır.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="secondary">
            İptal
          </Button>
          <Button onClick={handleDeleteInstructor} color="error" variant="contained">
            Kaldır
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InstructorManagement; 