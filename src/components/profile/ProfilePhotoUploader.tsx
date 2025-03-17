import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { updateProfilePhotoDirectly } from '../../services/userService';
import { Button, Avatar, Box, Typography, CircularProgress } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { auth } from '../../config/firebase';
import { updateProfile } from 'firebase/auth';

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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      <Avatar
        src={previewURL || currentPhotoURL}
        alt="Profile"
        sx={{ width: 100, height: 100, cursor: 'pointer', mb: 1 }}
        onClick={triggerFileSelect}
      />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<CloudUpload />}
          onClick={triggerFileSelect}
          disabled={isUploading}
        >
          Fotoğraf Seç
        </Button>

        {previewURL && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? <CircularProgress size={24} /> : 'Yükle'}
          </Button>
        )}
      </Box>

      {error && (
        <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          {error}
        </Typography>
      )}
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
        Önerilen: 400x400 piksel, maksimum {MAX_FILE_SIZE_MB}MB boyutunda JPEG veya PNG dosyası.
      </Typography>
    </Box>
  );
};

export default ProfilePhotoUploader; 