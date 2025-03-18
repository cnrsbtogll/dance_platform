import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { 
  Save as SaveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface SchoolInfo {
  id: string;
  displayName: string;
  [key: string]: any;
}

const SchoolSettings: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
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
          Okul Ayarları
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Okulunuzun profilini düzenleyin, ayarları yapılandırın ve dans okulunuzun genel bilgilerini yönetin.
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
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ boxShadow: 2, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="medium">
                    Okul Bilgileri
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled
                    sx={{ 
                      bgcolor: 'primary.main', 
                      '&:hover': { bgcolor: 'primary.dark' } 
                    }}
                  >
                    Kaydet
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 1
                }}>
                  <SettingsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
                    Bu bileşen henüz yapım aşamasındadır. Yakında burada okul ayarlarınızı düzenleyebileceksiniz.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Okul ayarları paneli ile okul profil bilgilerinizi, iletişim detaylarınızı, konum bilgilerinizi ve diğer ayarlarınızı düzenleyebileceksiniz.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </div>
  );
};

export default SchoolSettings; 