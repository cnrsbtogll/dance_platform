import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon,
  EmojiEvents as EmojiEventsIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';

interface SchoolInfo {
  id: string;
  displayName: string;
  [key: string]: any;
}

const BadgeSystem: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
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
          Rozet Sistemi
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Öğrencilerinizin motivasyonunu artırmak için rozetler oluşturun ve başarılarını ödüllendirin.
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
          Yeni Rozet Oluştur
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
          <EmojiEventsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Bu bileşen henüz yapım aşamasındadır. Yakında burada rozetleri yönetebileceksiniz.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Rozet sistemi ile öğrencilerinizin başarılarını ödüllendirebilecek, özel rozetler oluşturabilecek ve onların motivasyonunu artırabileceksiniz.
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default BadgeSystem; 