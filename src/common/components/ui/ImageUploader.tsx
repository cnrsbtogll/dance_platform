import React, { useState, useRef } from 'react';
import { Box, IconButton, Button, Typography } from '@mui/material';
import { AddAPhoto, Edit, DeleteOutline, Check, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { generateInitialsAvatar } from '../../utils/imageUtils';

type UserType = 'school' | 'instructor' | 'student';

interface ImageUploaderProps {
  currentPhotoURL?: string;
  onImageChange: (base64Image: string | null) => void;
  displayName?: string;
  userType?: UserType;
  maxSizeKB?: number;
  maxWidth?: number;
  maxHeight?: number;
  shape?: 'circle' | 'square';
  width?: number;
  height?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentPhotoURL,
  onImageChange,
  displayName = '?',
  userType = 'student',
  maxSizeKB = 1024,
  maxWidth = 3840,
  maxHeight = 2160,
  shape = 'circle',
  width = 150,
  height = 150
}) => {
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [resetState, setResetState] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when component unmounts or when reset is triggered
  React.useEffect(() => {
    if (resetState) {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
      setPreviewURL(null);
      setError(null);
      setUploadSuccess(false);
      setResetState(false);
    }
  }, [resetState, previewURL]);

  // Cleanup URLs on unmount
  React.useEffect(() => {
    return () => {
      if (previewURL && previewURL.startsWith('blob:')) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const validateImage = (file: File): { valid: boolean; error?: string } => {
    const FIRESTORE_DOC_SIZE_LIMIT = 1048487; // ~1MB Firestore document size limit

    // Convert size to MB for display
    const fileSizeMB = file.size / (1024 * 1024);
    const maxSizeMB = maxSizeKB / 1024;

    // Check file size for Firestore limit
    if (file.size > FIRESTORE_DOC_SIZE_LIMIT) {
      return {
        valid: false,
        error: `Fotoğraf boyutu Firestore limiti olan 1MB'ı aşıyor (Yüklenen: ${fileSizeMB.toFixed(2)}MB). Lütfen daha küçük bir fotoğraf seçin.`
      };
    }

    // Check file size for general limit
    if (file.size > maxSizeKB * 1024) {
      return {
        valid: false,
        error: `Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır. Yüklemeye çalıştığınız dosya: ${fileSizeMB.toFixed(2)}MB`
      };
    }

    return { valid: true };
  };

  const validateAndSetImage = (file: File) => {
    // First validate the image
    const validationResult = validateImage(file);
    if (!validationResult.valid) {
      setError(validationResult.error || 'Geçersiz dosya.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewURL(result);
      setError(null);
    };
    reader.readAsDataURL(file);
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
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setIsUploading(false);
        return;
      }

      validateAndSetImage(file);
    } catch (err) {
      setError('Fotoğraf yüklenirken bir hata oluştu.');
      console.error('Fotoğraf yükleme hatası:', err);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetImage(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (previewURL) {
      onImageChange(previewURL);
      setUploadSuccess(true);
      
      setTimeout(() => {
        setUploadSuccess(false);
        setResetState(true);
      }, 2000);
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

  // Get the current display image
  const getDisplayImage = () => {
    if (previewURL) return previewURL;
    if (currentPhotoURL) return currentPhotoURL;
    return generateInitialsAvatar(displayName, userType);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
    >
      <input
        type="file"
        hidden
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
      />
      
      <Box
        component={motion.div}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        sx={{ 
          position: 'relative',
          mb: 2
        }}
      >
        {/* Edit button overlay */}
        {!previewURL && currentPhotoURL && (
          <IconButton 
            size="small"
            onClick={triggerFileSelect}
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              position: 'absolute',
              right: -8,
              bottom: -8,
              backgroundColor: '#8B5CF6',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              border: '2px solid white',
              zIndex: 2,
              padding: '8px',
              '&:hover': {
                backgroundColor: '#7C3AED',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(139, 92, 246, 0.5)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <Edit sx={{ fontSize: 16 }} />
          </IconButton>
        )}

        <Box
          onClick={handleImageClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          sx={{
            position: 'relative',
            width: width,
            height: height,
            borderRadius: shape === 'circle' ? '50%' : '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '2px dashed #8B5CF6',
            background: 'linear-gradient(45deg, #F5F3FF 0%, #EEF2FF 100%)',
            boxShadow: '0 8px 24px rgba(149, 157, 165, 0.1)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              borderColor: '#7C3AED',
              boxShadow: '0 12px 28px rgba(139, 92, 246, 0.15)',
              transform: 'translateY(-2px)',
              '& .overlay': {
                opacity: 1
              }
            },
            '&:active': {
              transform: 'translateY(0px)'
            }
          }}
        >
          {/* Background image */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#EEF2FF',
              backgroundImage: `url(${getDisplayImage()})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          />

          {/* Gradient overlay on hover */}
          {!previewURL && !currentPhotoURL && (
            <Box
              component={motion.div}
              className="overlay"
              initial={{ opacity: 0 }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.2) 100%)',
                backdropFilter: 'blur(4px)',
                opacity: 0,
                transition: 'all 0.3s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              <AddAPhoto sx={{ color: '#8B5CF6', fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
            </Box>
          )}

          {/* Upload success animation */}
          {uploadSuccess && (
            <Box
              component={motion.div}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: shape === 'circle' ? '50%' : '12px',
              }}
            >
              <Check sx={{ color: 'white', fontSize: 40, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
            </Box>
          )}
        </Box>

        {/* Action buttons for preview */}
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
              background: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5))',
              backdropFilter: 'blur(4px)',
              borderRadius: shape === 'circle' ? '50%' : '12px',
              padding: 2,
              zIndex: 1
            }}
          >
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <IconButton 
                size="small"
                onClick={handleConfirmUpload}
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                sx={{
                  backgroundColor: '#8B5CF6',
                  color: 'white',
                  padding: '8px',
                  '&:hover': {
                    backgroundColor: '#7C3AED',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Check sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton 
                size="small"
                onClick={cancelUpload}
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                sx={{
                  backgroundColor: '#EF4444',
                  color: 'white',
                  padding: '8px',
                  '&:hover': {
                    backgroundColor: '#DC2626',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Close sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Helper text */}
      {!previewURL && !currentPhotoURL && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: 1,
            textAlign: 'center',
            fontWeight: 500,
            color: '#6B7280',
            fontSize: '0.875rem',
            letterSpacing: '0.01em'
          }}
        >
          Fotoğraf yüklemek için tıklayın veya sürükleyip bırakın
        </Typography>
      )}

      {/* Loading indicator */}
      {isUploading && (
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 1,
            textAlign: 'center',
            color: '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            backgroundColor: '#F5F3FF',
            padding: '6px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}
        >
          <Box
            component="span"
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              animation: 'pulse 1s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 0.4, transform: 'scale(0.8)' },
                '50%': { opacity: 1, transform: 'scale(1.2)' },
                '100%': { opacity: 0.4, transform: 'scale(0.8)' },
              }
            }}
          />
          Fotoğraf yükleniyor...
        </Typography>
      )}

      {/* Error message */}
      {error && (
        <Typography 
          component={motion.p}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          color="error" 
          variant="caption" 
          sx={{ 
            mt: 1, 
            textAlign: 'center', 
            maxWidth: 250,
            backgroundColor: '#FEF2F2',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '0.875rem',
            lineHeight: 1.4,
            color: '#DC2626',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader; 