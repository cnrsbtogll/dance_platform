import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

interface SchoolInfo {
  id: string;
  displayName: string;
  [key: string]: any;
}

const ProgressTracking: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
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
          İlerleme Takibi
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Öğrencilerinizin dans becerilerindeki gelişimlerini takip edin ve ilerleme raporları oluşturun.
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
          startIcon={<TimelineIcon />}
          sx={{ 
            bgcolor: 'primary.main', 
            '&:hover': { bgcolor: 'primary.dark' } 
          }}
        >
          Rapor Oluştur
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
          <DashboardIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Bu bileşen henüz yapım aşamasındadır. Yakında burada öğrenci ilerlemelerini takip edebileceksiniz.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            İlerleme takip paneli ile öğrencilerinizin dans becerilerindeki gelişimlerini izleyebilecek, seviye ilerlemelerini kaydedebilecek ve performans raporları oluşturabileceksiniz.
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default ProgressTracking; 