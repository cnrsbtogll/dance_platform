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
  maxSizeKB = 10240,
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
    // Check file size
    if (file.size > maxSizeKB * 1024) {
      return {
        valid: false,
        error: `Dosya boyutu ${maxSizeKB}KB'dan küçük olmalıdır.`
      };
    }

    return { valid: true };
  };

  const validateAndSetImage = (file: File) => {
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
      
      // Reset after successful upload
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
        whileHover={{ scale: 1.03 }}
        sx={{ 
          position: 'relative',
          mb: 2
        }}
      >
        {/* Edit button overlay - Moved outside the inner Box */}
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
              zIndex: 2,
              '&:hover': {
                backgroundColor: '#7C3AED',
              }
            }}
          >
            <Edit fontSize="small" />
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
            borderRadius: shape === 'circle' ? '50%' : '8px',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '3px solid #8B5CF6',
            boxShadow: '0 8px 24px rgba(149, 157, 165, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 28px rgba(149, 157, 165, 0.3)',
              '& .overlay': {
                opacity: 1
              }
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
              backgroundColor: '#e0e7ff',
              backgroundImage: `url(${getDisplayImage()})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          {/* Gradient overlay on hover */}
          {!previewURL && currentPhotoURL && !uploadSuccess && (
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
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
              }}
            >
              <AddAPhoto sx={{ color: 'white', fontSize: 32 }} />
            </Box>
          )}

          {/* Upload success animation */}
          {uploadSuccess && (
            <Box
              component={motion.div}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Check sx={{ color: 'white', fontSize: 40 }} />
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
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: shape === 'circle' ? '50%' : '8px',
              padding: 2,
              zIndex: 1
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                size="small"
                onClick={handleConfirmUpload}
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                sx={{
                  backgroundColor: 'white',
                  color: '#8B5CF6',
                  '&:hover': {
                    backgroundColor: '#f9fafb',
                  }
                }}
              >
                <Check />
              </IconButton>
              <IconButton 
                size="small"
                onClick={cancelUpload}
                component={motion.button}
                whileHover={{ scale: 1.1 }}
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

      {/* Helper text */}
      {!previewURL && !currentPhotoURL && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mt: 1,
            textAlign: 'center',
            fontWeight: 500
          }}
        >
          Fotoğraf yüklemek için tıklayın veya sürükleyip bırakın
        </Typography>
      )}

      {/* Error message */}
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
    </Box>
  );
};

export default ImageUploader; 