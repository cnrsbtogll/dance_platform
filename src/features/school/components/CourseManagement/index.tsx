import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon
} from '@mui/icons-material';

interface SchoolInfo {
  id: string;
  displayName: string;
  [key: string]: any;
}

const CourseManagement: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom fontWeight="bold">
          Kurs Yönetimi
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Okulunuzun dans kurslarını yönetin, yeni kurslar ekleyin ve mevcut kursları düzenleyin.
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
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          sx={{ 
            bgcolor: 'primary.main', 
            '&:hover': { bgcolor: 'primary.dark' } 
          }}
        >
          Yeni Kurs Ekle
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 1
        }}>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Bu bileşen henüz yapım aşamasındadır. Yakında burada kurslarınızı yönetebileceksiniz.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Kurs yönetim paneli ile okulunuzun dans kurslarını ekleyebilecek, düzenleyebilecek ve yönetebileceksiniz.
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default CourseManagement; 