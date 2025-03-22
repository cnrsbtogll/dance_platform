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
        whileHover={{ scale: 1.05 }}
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
          '&:hover': {
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
            backgroundPosition: 'center',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'scale(1.1)'
            }
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
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
              opacity: 0,
              transition: 'opacity 0.3s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Edit sx={{ color: 'white', fontSize: 24 }} />
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

      {/* Action buttons */}
      {previewURL && (
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1,
            mt: 1
          }}
        >
          <IconButton 
            size="small"
            onClick={handleConfirmUpload}
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            sx={{
              backgroundColor: 'success.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'success.dark'
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
              backgroundColor: 'error.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'error.dark'
              }
            }}
          >
            <Close />
          </IconButton>
        </Box>
      )}
      
      {/* Error message */}
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      
      {/* User guidance message */}
      {!previewURL && !currentPhotoURL && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Fotoğraf yüklemek için tıklayın veya sürükleyip bırakın
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader; 