import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Button, Box, Typography, Grid, Paper, Chip, Stack, Alert, Snackbar,
  Divider, CircularProgress, Avatar
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Email as EmailIcon, 
  Phone as PhoneIcon, 
  Info as InfoIcon,
  Style as StyleIcon,
  SignalCellularAlt as LevelIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import ProfilePhotoUploader from './ProfilePhotoUploader';
import { fetchUserProfile } from '../../services/userService';
import { UserWithProfile } from '../../types';
import useAuth from '../../hooks/useAuth';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserWithProfile | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const profile = await fetchUserProfile(user.id);
        setUserProfile(profile);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Profil bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user, navigate]);

  const handleEditClick = () => {
    navigate('/profile/edit');
  };

  const handlePhotoUploadSuccess = (photoURL: string) => {
    // Update the local state with the new photo URL
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        photoURL,
      });
    }
    
    setSuccess('Profil fotoğrafı başarıyla güncellendi.');
  };

  const handlePhotoUploadError = (error: Error) => {
    setError(`Profil fotoğrafı yüklenirken bir hata oluştu: ${error.message}`);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh',
        flexDirection: 'column', 
        gap: 2 
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography variant="h6" color="text.secondary">Profil yükleniyor...</Typography>
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <InfoIcon color="error" sx={{ fontSize: 60 }} />
        <Typography variant="h6" color="text.secondary">Profil bulunamadı.</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/profile/edit')}
          sx={{ mt: 2 }}
        >
          Profil Oluştur
        </Button>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box 
        sx={{ 
          maxWidth: 1000, 
          mx: 'auto', 
          py: 6, 
          px: { xs: 2, md: 4 }
        }}
      >
        <Snackbar 
          open={!!success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSuccess(null)} 
            severity="success"
            variant="filled"
            elevation={6}
          >
            {success}
          </Alert>
        </Snackbar>

        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setError(null)} 
            severity="error"
            variant="filled"
            elevation={6}
          >
            {error}
          </Alert>
        </Snackbar>

        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            fontWeight="bold"
            sx={{
              position: 'relative',
              display: 'inline-block',
              background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              mb: 2
            }}
          >
            Profil Bilgileri
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto' }}>
            Kişisel bilgilerinizi görüntüleyin ve düzenleyin
          </Typography>
        </Box>

        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: 4, 
            borderRadius: 3,
            background: 'linear-gradient(145deg, #ffffff, #f5f7ff)',
            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.1)'
          }}
        >
          <Grid container spacing={4}>
            <Grid item xs={12} md={4} sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: { xs: 'center', md: 'flex-start' } 
            }}>
              <Box 
                sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  width: '100%'
                }}
              >
                {user?.id && (
                  <ProfilePhotoUploader 
                    userId={user.id} 
                    currentPhotoURL={userProfile.photoURL}
                    onSuccess={handlePhotoUploadSuccess}
                    onError={handlePhotoUploadError}
                  />
                )}
              </Box>
              
              <Button 
                variant="contained" 
                startIcon={<EditIcon />} 
                onClick={handleEditClick}
                fullWidth
                sx={{ 
                  mt: 2, 
                  background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                  textTransform: 'none',
                  fontSize: '1rem',
                  py: 1.2,
                  borderRadius: 2,
                  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
                  '&:hover': {
                    boxShadow: '0 6px 15px rgba(99, 102, 241, 0.35)',
                  }
                }}
              >
                Profili Düzenle
              </Button>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  gap: 3
                }}
              >
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Typography 
                    variant="h4" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 0.5,
                      position: 'relative',
                      display: 'inline-block',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        width: '40%',
                        height: '4px',
                        borderRadius: '2px',
                        background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                        bottom: '-8px',
                        left: '0',
                      }
                    }}
                  >
                    {userProfile.displayName || 'İsimsiz Kullanıcı'}
                  </Typography>
                  
                  {userProfile.role && (
                    <Stack direction="row" spacing={1} my={2}>
                      <Chip 
                        icon={
                          userProfile.role === 'admin' ? <AdminPanelSettingsIcon /> :
                          userProfile.role === 'instructor' ? <SchoolIcon /> :
                          userProfile.role === 'school' ? <BusinessIcon /> : <PersonIcon />
                        }
                        label={
                          userProfile.role === 'admin' ? 'Yönetici' :
                          userProfile.role === 'instructor' ? 'Eğitmen' :
                          userProfile.role === 'school' ? 'Okul Yöneticisi' : 'Üye'
                        }
                        size="medium"
                        color={
                          userProfile.role === 'admin' ? 'error' :
                          userProfile.role === 'instructor' ? 'secondary' :
                          userProfile.role === 'school' ? 'primary' : 'default'
                        }
                        sx={{
                          borderRadius: '20px',
                          fontWeight: 'medium',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                          '& .MuiChip-icon': {
                            color: 'inherit'
                          }
                        }}
                      />
                    </Stack>
                  )}
                </Box>
                
                <Divider sx={{ 
                  borderColor: 'rgba(99, 102, 241, 0.2)', 
                  borderRadius: 1,
                  height: '2px',
                  background: 'linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.05))'
                }} />
                
                <Box 
                  component={motion.div}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2.5 
                  }}
                >
                  <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5, 
                      p: 1.5, 
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(99, 102, 241, 0.05)',
                      }
                    }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366F1',
                        width: 40,
                        height: 40
                      }}>
                        <EmailIcon />
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: '0.85rem', fontWeight: 500 }}
                        >
                          E-posta Adresi
                        </Typography>
                        <Typography 
                          variant="body1"
                          sx={{ 
                            fontWeight: 'medium',
                            color: userProfile.email ? 'text.primary' : 'text.disabled'
                          }}
                        >
                          {userProfile.email || 'E-posta adresi belirtilmemiş'}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                  
                  {userProfile.phoneNumber && (
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5, 
                        p: 1.5, 
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'rgba(99, 102, 241, 0.05)',
                        }
                      }}>
                        <Avatar sx={{ 
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#6366F1',
                          width: 40,
                          height: 40
                        }}>
                          <PhoneIcon />
                        </Avatar>
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: '0.85rem', fontWeight: 500 }}
                          >
                            Telefon Numarası
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {userProfile.phoneNumber}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                  
                  {userProfile.level && (
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5, 
                        p: 1.5, 
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'rgba(99, 102, 241, 0.05)',
                        }
                      }}>
                        <Avatar sx={{ 
                          bgcolor: 'rgba(99, 102, 241, 0.1)',
                          color: '#6366F1',
                          width: 40,
                          height: 40
                        }}>
                          <LevelIcon />
                        </Avatar>
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: '0.85rem', fontWeight: 500 }}
                          >
                            Dans Seviyesi
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {userProfile.level}
                          </Typography>
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                </Box>
                
                {userProfile.bio && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    <Divider sx={{ 
                      borderColor: 'rgba(99, 102, 241, 0.2)', 
                      borderRadius: 1,
                      height: '2px',
                      mb: 3,
                      background: 'linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.05))'
                    }} />
                    
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        borderRadius: 3,
                        background: 'linear-gradient(145deg, #f8faff, #f5f7ff)',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '6px',
                          height: '100%',
                          background: 'linear-gradient(180deg, #6366F1, #8B5CF6)',
                          borderTopLeftRadius: '12px',
                          borderBottomLeftRadius: '12px',
                        }
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          mb: 2,
                          fontWeight: 600,
                          color: '#6366F1'
                        }}
                      >
                        <InfoIcon fontSize="small" color="primary" />
                        Hakkımda
                      </Typography>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          lineHeight: 1.8,
                          color: 'text.primary',
                          pl: 1,
                          fontStyle: userProfile.bio ? 'normal' : 'italic'
                        }}
                      >
                        {userProfile.bio}
                      </Typography>
                    </Paper>
                  </motion.div>
                )}
                
                {userProfile.danceStyles && userProfile.danceStyles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    <Divider sx={{ 
                      borderColor: 'rgba(99, 102, 241, 0.2)', 
                      borderRadius: 1,
                      height: '2px',
                      mb: 3,
                      background: 'linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.05))'
                    }} />
                    
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 3, 
                        borderRadius: 3,
                        background: 'linear-gradient(145deg, #f8faff, #f5f7ff)',
                        border: '1px solid rgba(99, 102, 241, 0.1)',
                        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '6px',
                          height: '100%',
                          background: 'linear-gradient(180deg, #8B5CF6, #6366F1)',
                          borderTopLeftRadius: '12px',
                          borderBottomLeftRadius: '12px',
                        }
                      }}
                    >
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          mb: 2,
                          fontWeight: 600,
                          color: '#8B5CF6'
                        }}
                      >
                        <StyleIcon fontSize="small" color="secondary" />
                        Dans Stilleri
                      </Typography>
                      
                      <Box 
                        component={motion.div} 
                        sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
                      >
                        {userProfile.danceStyles.map((style: string, index: number) => (
                          <Chip 
                            component={motion.div}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 * index, duration: 0.3 }}
                            key={index} 
                            label={style} 
                            size="medium" 
                            sx={{ 
                              mb: 1, 
                              py: 0.5,
                              borderRadius: 5,
                              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                              color: 'white',
                              fontWeight: 500,
                              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                              }
                            }} 
                          />
                        ))}
                      </Box>
                    </Paper>
                  </motion.div>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Activity Section (Optional) */}
        <Box sx={{ mt: 5, mb: 2 }}>
          <Typography 
            variant="h5" 
            component="h2" 
            fontWeight="bold" 
            gutterBottom
            sx={{
              position: 'relative',
              display: 'inline-block',
              background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              '&::after': {
                content: '""',
                position: 'absolute',
                width: '30%',
                height: '3px',
                borderRadius: '2px',
                background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                bottom: '-8px',
                left: '0',
              }
            }}
          >
            Dans Aktiviteleri
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ maxWidth: '600px', mb: 3 }}
          >
            Katıldığınız dans aktiviteleri ve kursları burada görüntülenecektir.
          </Typography>
        </Box>

        <Paper 
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            background: 'linear-gradient(145deg, #ffffff, #f5f7ff)',
            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 250,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #6366F1)',
              backgroundSize: '200% 100%',
              animation: 'gradient-move 8s ease infinite',
              '@keyframes gradient-move': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' }
              }
            }}
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.3 }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 3
              }}
            >
              <StyleIcon sx={{ fontSize: 40, color: '#8B5CF6' }} />
            </Box>
          </motion.div>
          
          <Typography 
            variant="h6" 
            color="text.primary" 
            fontWeight="medium"
            sx={{ mb: 1 }}
          >
            Henüz katıldığınız bir aktivite bulunmuyor
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ textAlign: 'center', maxWidth: 400, mb: 3 }}
          >
            Dans kurslarına katılarak veya etkinliklere kayıt olarak aktivite geçmişinizi oluşturabilirsiniz.
          </Typography>
          
          <Button
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            variant="outlined"
            color="primary"
            onClick={() => navigate('/classes')}
            sx={{
              borderRadius: '20px',
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 'medium',
              borderColor: '#8B5CF6',
              color: '#8B5CF6',
              '&:hover': {
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99, 102, 241, 0.04)'
              }
            }}
          >
            Kursları Keşfet
          </Button>
        </Paper>
      </Box>
    </motion.div>
  );
};

export default UserProfile; 