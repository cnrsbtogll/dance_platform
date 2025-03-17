import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Grid, Paper, Chip, Stack, Alert, Snackbar } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
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
    
    // Sayfa yenilenecek, dolayısıyla setUser'a gerek yok
    // Profil fotoğrafı güncellemesi sonrası ProfilePhotoUploader
    // bileşeni sayfayı kendisi yeniler
  };

  const handlePhotoUploadError = (error: Error) => {
    setError(`Profil fotoğrafı yüklenirken bir hata oluştu: ${error.message}`);
  };

  if (loading) {
    return <Typography>Yükleniyor...</Typography>;
  }

  if (!userProfile) {
    return <Typography>Profil bulunamadı.</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {user?.id && (
              <ProfilePhotoUploader 
                userId={user.id} 
                currentPhotoURL={userProfile.photoURL}
                onSuccess={handlePhotoUploadSuccess}
                onError={handlePhotoUploadError}
              />
            )}
          </Grid>
          
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {userProfile.displayName || 'İsimsiz Kullanıcı'}
              </Typography>
              
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />} 
                onClick={handleEditClick}
              >
                Düzenle
              </Button>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                E-posta:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userProfile.email || 'E-posta adresi belirtilmemiş'}
              </Typography>
            </Box>
            
            {userProfile.phoneNumber && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Telefon:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userProfile.phoneNumber}
                </Typography>
              </Box>
            )}
            
            {userProfile.bio && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Hakkımda:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userProfile.bio}
                </Typography>
              </Box>
            )}
            
            {userProfile.level && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Seviye:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userProfile.level}
                </Typography>
              </Box>
            )}
            
            {userProfile.danceStyles && userProfile.danceStyles.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                  Dans Stilleri:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {userProfile.danceStyles.map((style, index) => (
                    <Chip key={index} label={style} size="small" sx={{ mb: 1 }} />
                  ))}
                </Stack>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default UserProfile; 