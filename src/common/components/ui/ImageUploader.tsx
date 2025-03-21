import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, CircularProgress, IconButton, Button } from '@mui/material';
import { AddAPhoto, Edit, DeleteOutline, Check, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ImageUploaderProps {
  currentPhotoURL?: string;
  onImageChange: (base64Image: string | null) => void;
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  title?: string;
  shape?: 'circle' | 'square';
  width?: number;
  height?: number;
  resetState?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentPhotoURL,
  onImageChange,
  maxSizeKB = 10240,
  maxWidth = 3840,
  maxHeight = 2160,
  title = 'Fotoğraf',
  shape = 'circle',
  width = 200,
  height = 200,
  resetState = false,
}) => {
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 20; // Maximum file size in MB
  const MAX_DIMENSIONS = 4096; // Maximum width/height in pixels

  // Reset state when resetState prop changes
  useEffect(() => {
    if (resetState) {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
      setPreviewURL(null);
      setError(null);
      setUploadSuccess(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [resetState]);

  // Clean up any blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const validateImage = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSizeKB * 1024) {
      return { valid: false, error: `Dosya boyutu çok büyük. Lütfen ${maxSizeKB/1024}MB'dan küçük bir görsel seçin.` };
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Lütfen geçerli bir görsel dosyası seçin (JPEG, PNG, GIF, vs.)' };
    }

    return { valid: true };
  };

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
      if (img.width > MAX_DIMENSIONS || img.height > MAX_DIMENSIONS) {
        URL.revokeObjectURL(objectUrl);
        setError(`Görsel boyutları çok büyük. Lütfen maksimum ${MAX_DIMENSIONS}x${MAX_DIMENSIONS} piksel boyutunda bir görsel seçin.`);
        return;
      }
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreviewURL(result);
        setError(null);
      };
      reader.readAsDataURL(file);
      
      URL.revokeObjectURL(objectUrl);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setError('Görsel yüklenirken bir hata oluştu. Lütfen başka bir görsel deneyin.');
    };
    
    img.src = objectUrl;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      // Validate file
      const validationResult = validateImage(file);
      if (!validationResult.valid) {
        setError(validationResult.error || 'Geçersiz dosya.');
        return;
      }

      validateAndSetImage(file);
    } catch (err) {
      setError('Fotoğraf yüklenirken bir hata oluştu.');
      console.error('Fotoğraf yükleme hatası:', err);
    } finally {
      setIsUploading(false);
    }
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

  const confirmUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (previewURL) {
      onImageChange(previewURL);
      setUploadSuccess(true);
      
      // Sadece başarı durumunu sıfırla, preview'ı temizleme
      setTimeout(() => {
        setUploadSuccess(false);
      }, 1500);
    }
  };

  const cancelUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (previewURL && previewURL.startsWith('blob:')) {
      URL.revokeObjectURL(previewURL);
    }
    setPreviewURL(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveCurrentPhoto = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    onImageChange(null);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!previewURL) {
      triggerFileSelect();
    }
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        {title}
      </Typography>
      
      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <Box
        component={motion.div}
        whileHover={{ scale: 1.03 }}
        sx={{ position: 'relative', mb: 3 }}
      >
        {/* Image preview with overlay */}
        <Box
          onDragEnter={handleDrag}
          onClick={handleImageClick}
          sx={{
            position: 'relative',
            width: width,
            height: height,
            borderRadius: shape === 'circle' ? '50%' : '8px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)',
            cursor: 'pointer',
            border: uploadSuccess ? '3px solid #22C55E' : (dragActive ? '3px dashed #8B5CF6' : '3px solid #8B5CF6'),
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 28px rgba(149, 157, 165, 0.3)',
            }
          }}
        >
          {/* Görsel veya yükleme alanı gösterimi */}
          {(previewURL || currentPhotoURL) ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                backgroundColor: '#e0e7ff',
                backgroundImage: previewURL || currentPhotoURL ? `url(${previewURL || currentPhotoURL})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ) : (
            <Box sx={{
              width: '100%',
              height: '100%',
              backgroundColor: '#e0e7ff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2
            }}>
              <AddAPhoto sx={{ fontSize: 40, color: '#8B5CF6', mb: 2 }} />
              <Typography variant="body1" align="center" sx={{ color: '#4F46E5', fontWeight: 500 }}>
                {title} Yükle
              </Typography>
            </Box>
          )}
          
          {/* Success overlay */}
          {uploadSuccess && (
            <Box
              component={motion.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.6) 0%, rgba(21, 128, 61, 0.6) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                zIndex: 2
              }}
            >
              <Check sx={{ fontSize: 48 }} />
            </Box>
          )}
          
          {/* Gradient overlay on hover */}
          {!previewURL && currentPhotoURL && !uploadSuccess && (
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

        {/* Düzenleme butonu */}
        {!previewURL && currentPhotoURL && (
          <IconButton 
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              triggerFileSelect();
            }}
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
              },
              zIndex: 10
            }}
          >
            <Edit fontSize="small" />
          </IconButton>
        )}

        {/* Silme butonu */}
        {!previewURL && currentPhotoURL && (
          <IconButton 
            size="small"
            onClick={handleRemoveCurrentPhoto}
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            sx={{
              position: 'absolute',
              right: -5,
              top: 10,
              backgroundColor: '#EF4444',
              color: 'white',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
              border: '2px solid white',
              '&:hover': {
                backgroundColor: '#DC2626',
              },
              zIndex: 10
            }}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        )}
      </Box>
      
      {/* Preview controls and user guidance */}
      {previewURL && (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: 2,
            mt: 2 
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            Seçilen fotoğrafı kaydetmek için onaylayın veya farklı bir fotoğraf seçin.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color={uploadSuccess ? "success" : "primary"}
              startIcon={uploadSuccess ? <Check /> : null}
              onClick={confirmUpload}
              disabled={isUploading || uploadSuccess}
              sx={{
                backgroundColor: uploadSuccess ? '#22C55E' : '#8B5CF6',
                '&:hover': {
                  backgroundColor: uploadSuccess ? '#15803D' : '#7C3AED',
                },
                transition: 'all 0.3s ease',
                position: 'relative',
                minWidth: 140
              }}
            >
              {uploadSuccess ? 'Kaydedildi!' : 'Fotoğrafı Onayla'}
              {isUploading && (
                <CircularProgress
                  size={24}
                  sx={{
                    color: 'white',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px',
                  }}
                />
              )}
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<Close />}
              onClick={cancelUpload}
              disabled={isUploading || uploadSuccess}
            >
              İptal
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      
      {/* Loading indicator */}
      {isUploading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} sx={{ color: '#8B5CF6' }} />
        </Box>
      )}
      
      {/* User guidance message */}
      {!previewURL && !currentPhotoURL && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {title} yüklemek için yukarıdaki alana tıklayın veya bir dosyayı sürükleyip bırakın.
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader; 