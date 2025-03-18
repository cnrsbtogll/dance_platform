import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { updateProfilePhotoDirectly } from '../../../api/services/userService';
import { Button, Avatar, Box, Typography, CircularProgress, Paper, IconButton, Backdrop } from '@mui/material';
import { CloudUpload, PhotoCamera, Close, Edit, AddAPhoto } from '@mui/icons-material';
import { auth } from '../../../api/firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { motion } from 'framer-motion';

interface ProfilePhotoUploaderProps {
  userId: string;
  currentPhotoURL?: string;
  onSuccess?: (photoURL: string) => void;
  onError?: (error: Error) => void;
}

const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  userId,
  currentPhotoURL,
  onSuccess,
  onError,
}) => {
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 5; // Maximum file size in MB
  const MAX_DIMENSIONS = 2048; // Maximum width/height in pixels

  // Clean up any blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const validateAndSetImage = (file: File) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Dosya boyutu çok büyük. Lütfen ${MAX_FILE_SIZE_MB}MB'dan küçük bir görsel seçin.`);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Lütfen geçerli bir görsel dosyası seçin (JPEG, PNG, GIF, vs.)');
      return;
    }

    // Check image dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // Don't revoke the objectUrl here since we need to use it
      
      if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
        URL.revokeObjectURL(objectUrl); // Only revoke if we're not using it
        setError(`Görsel boyutları çok büyük. Lütfen maksimum ${MAX_DIMENSIONS}x${MAX_DIMENSIONS} piksel boyutunda bir görsel seçin.`);
        return;
      }
      
      setPreviewURL(objectUrl);
      setError(null);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Görsel yüklenirken bir hata oluştu. Lütfen başka bir görsel deneyin.');
    };
    
    img.src = objectUrl;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    validateAndSetImage(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetImage(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!previewURL) return;

    try {
      setIsUploading(true);
      setError(null);

      // Convert preview URL to base64 if it's not already
      if (!previewURL.startsWith('data:')) {
        try {
          const response = await fetch(previewURL);
          const blob = await response.blob();
          
          // Check file size before proceeding
          if (blob.size > 5 * 1024 * 1024) { // 5MB sınırı
            setIsUploading(false);
            setError(`Dosya boyutu çok büyük (${Math.round(blob.size / 1024 / 1024)}MB). Lütfen daha küçük bir görsel seçin.`);
            return;
          }
          
          // After successful upload, clean up the object URL
          if (previewURL.startsWith('blob:')) {
            URL.revokeObjectURL(previewURL);
          }
          
          const reader = new FileReader();
          
          reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            try {
              console.log(`📸 Base64 fotoğraf boyutu: ${Math.round(base64.length / 1024)}KB`);
              
              // Base64 veriyi doğrudan Firestore'a kaydet
              const photoURL = await updateProfilePhotoDirectly(userId, base64);
              
              // Firebase Auth için kısa bir yer tutucu URL kullan
              if (auth.currentUser) {
                try {
                  await updateProfile(auth.currentUser, {
                    photoURL: `profile-photo:${userId}?t=${Date.now()}`, // Önbellek kırma için zaman damgası ekle
                  });
                  console.log('✅ Firebase Auth profil başarıyla güncellendi');
                } catch (authError) {
                  console.warn('⚠️ Firebase Auth profil güncellemesi başarısız oldu, ancak Firestore güncellemesi başarılı', authError);
                  // Auth güncelleme hatası olsa da devam et, Firestore'daki veri doğru
                }
              }
              
              setIsUploading(false);
              console.log('✅ Profil fotoğrafı başarıyla yüklendi!');
              
              // Clean up the blob URL after successful upload
              if (previewURL && previewURL.startsWith('blob:')) {
                URL.revokeObjectURL(previewURL);
              }
              
              setPreviewURL(null); // Clear preview after successful upload
              
              if (onSuccess) {
                onSuccess(photoURL);
              }
              
              // Sayfayı yenile - bu, tüm bileşenlerin yeniden render olmasını sağlayacak
              setTimeout(() => {
                window.location.reload();
              }, 1000); // Kullanıcıya başarı mesajını görmesi için 1 saniye bekle
            } catch (error) {
              console.error('⛔ Fotoğraf yükleme hatası:', error);
              setIsUploading(false);
              const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
              setError(`Profil fotoğrafı yüklenemedi: ${errorMessage}`);
              
              if (onError && error instanceof Error) {
                onError(error);
              }
            }
          };
          
          reader.onerror = () => {
            setIsUploading(false);
            setError('Görsel okunurken bir hata oluştu.');
            
            if (onError) {
              onError(new Error('Failed to read image file'));
            }
          };
          
          reader.readAsDataURL(blob);
        } catch (error) {
          setIsUploading(false);
          const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
          setError(`Profil fotoğrafı yüklenemedi: ${errorMessage}`);
          
          if (onError && error instanceof Error) {
            onError(error);
          }
        }
      } else {
        // If it's already a base64 string
        try {
          // Base64 veriyi doğrudan Firestore'a kaydet
          const photoURL = await updateProfilePhotoDirectly(userId, previewURL);
          
          // Firebase Auth için kısa bir yer tutucu URL kullan
          if (auth.currentUser) {
            try {
              await updateProfile(auth.currentUser, {
                photoURL: `profile-photo:${userId}?t=${Date.now()}`, // Önbellek kırma için zaman damgası ekle
              });
            } catch (authError) {
              console.warn('Firebase Auth profil güncellemesi başarısız oldu, ancak Firestore güncellemesi başarılı', authError);
              // Auth güncelleme hatası olsa da devam et, Firestore'daki veri doğru
            }
          }
          
          setIsUploading(false);
          
          // Clean up the blob URL after successful upload
          if (previewURL && previewURL.startsWith('blob:')) {
            URL.revokeObjectURL(previewURL);
          }
          
          setPreviewURL(null); // Clear preview after successful upload
          
          if (onSuccess) {
            onSuccess(photoURL);
          }
          
          // Sayfayı yenile - bu, tüm bileşenlerin yeniden render olmasını sağlayacak
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Kullanıcıya başarı mesajını görmesi için 1 saniye bekle
        } catch (error) {
          setIsUploading(false);
          const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
          setError(`Profil fotoğrafı yüklenemedi: ${errorMessage}`);
          
          if (onError && error instanceof Error) {
            onError(error);
          }
        }
      }
    } catch (error) {
      setIsUploading(false);
      setError('Profil fotoğrafı yüklenirken beklenmeyen bir hata oluştu.');
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleClearPreview = () => {
    if (previewURL && previewURL.startsWith('blob:')) {
      URL.revokeObjectURL(previewURL);
    }
    setPreviewURL(null);
    setError(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      <Box
        component={motion.div}
        whileHover={{ scale: 1.03 }}
        sx={{ position: 'relative', mb: 3 }}
      >
        {/* Avatar with overlay */}
        <Box
          onDragEnter={handleDrag}
          sx={{
            position: 'relative',
            width: 140,
            height: 140,
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)',
            cursor: 'pointer',
            border: dragActive ? '3px dashed #8B5CF6' : '3px solid #8B5CF6',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 28px rgba(149, 157, 165, 0.3)',
            }
          }}
          onClick={!previewURL ? triggerFileSelect : undefined}
        >
          <Avatar
            src={previewURL || currentPhotoURL}
            alt="Profile"
            sx={{ 
              width: '100%', 
              height: '100%',
              backgroundColor: '#e0e7ff'
            }}
          />
          
          {/* Gradient overlay on hover */}
          {!previewURL && (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                zIndex: 1
              }}
            >
              <AddAPhoto fontSize="large" />
            </Box>
          )}
        </Box>

        {/* Edit button overlay */}
        {!previewURL && currentPhotoURL && (
          <IconButton 
            size="small"
            onClick={triggerFileSelect}
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            sx={{
              position: 'absolute',
              right: -5,
              bottom: 10,
              backgroundColor: '#8B5CF6',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              border: '2px solid white',
              '&:hover': {
                backgroundColor: '#7C3AED',
              }
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        )}

        {/* Preview controls */}
        {previewURL && (
          <Box 
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              padding: 2,
              zIndex: 2
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={handleUpload}
                disabled={isUploading}
                sx={{ 
                  backgroundColor: 'white',
                  color: '#8B5CF6',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                  }
                }}
              >
                {isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleClearPreview}
                disabled={isUploading}
                sx={{ 
                  backgroundColor: 'white',
                  color: '#ef4444',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                  }
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Drop zone text or instructions */}
      {!previewURL ? (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: 1, 
            textAlign: 'center',
            maxWidth: 250,
            fontWeight: 500,
            color: dragActive ? '#8B5CF6' : 'inherit'
          }}
        >
          Fotoğraf seçmek için tıklayın veya sürükleyip bırakın
        </Typography>
      ) : (
        <Typography 
          component={motion.p}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          variant="body2" 
          color="primary" 
          sx={{ 
            mt: 1, 
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          Fotoğrafınızı yüklemek için yukarıdaki kontrolleri kullanın
        </Typography>
      )}

      {error && (
        <Typography 
          component={motion.p}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          color="error" 
          variant="body2" 
          sx={{ mt: 2, textAlign: 'center', maxWidth: 300 }}
        >
          {error}
        </Typography>
      )}
      
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ mt: 2, textAlign: 'center' }}
      >
        Önerilen: 400x400 piksel, maksimum {MAX_FILE_SIZE_MB}MB boyutunda JPEG veya PNG dosyası.
      </Typography>

      {/* Backdrop overlay for drag and drop */}
      <Backdrop
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: '#fff' }}
        open={dragActive}
        invisible
      >
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Backdrop>
    </Box>
  );
};

export default ProfilePhotoUploader; 