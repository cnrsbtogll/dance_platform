import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  LinearProgress,
  Container, 
  Card, 
  CardContent, 
  Avatar, 
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  School as CourseIcon,
  Timer as TimeIcon,
  CheckCircle as CheckIcon,
  ArrowUpward as LevelUpIcon,
  DirectionsRun as ActivityIcon,
  Lightbulb as TipIcon
} from '@mui/icons-material';
import { dansRozet } from '../../data/dansVerileri';

// Type definitions
interface UserProgress {
  tamamlananKurslar: number;
  tamamlananDersler: number;
  toplamDansSuresi: number; // saat
  kazanilanRozetler: number[]; // rozet id'leri
  ilerlemeYuzdesi: number;
  seviye: number;
  puanlar: number;
}

interface Rozet {
  id: number;
  ad: string;
  aciklama: string;
  gorsel: string;
  seviye: number;
}

interface ProgressBarProps {
  value: number;
  label: string;
  color?: string;
}

interface BadgeCardProps {
  badge: Rozet;
  earned?: boolean;
}

const ProgressPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // User progress state (in a real app, this would come from Firebase/Supabase)
  const [userProgress, setUserProgress] = useState<UserProgress>({
    tamamlananKurslar: 3,
    tamamlananDersler: 24,
    toplamDansSuresi: 36, // saat
    kazanilanRozetler: [1, 2], // rozet id'leri
    ilerlemeYuzdesi: 65,
    seviye: 2,
    puanlar: 650
  });

  // All badges
  const [badges, setBadges] = useState<Rozet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // In a real app, this would be fetched from an API
    setBadges(dansRozet);
    setLoading(false);
  }, []);

  // Progress bar component
  const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, color = 'primary' }) => (
    <Box sx={{ mb: 3, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          {label}
        </Typography>
        <Typography variant="body2" color="primary" fontWeight={600}>
          {value}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        color={color as any}
        sx={{ height: 8, borderRadius: 4 }}
      />
    </Box>
  );

  // Badge card component
  const BadgeCard: React.FC<BadgeCardProps> = ({ badge, earned = false }) => (
    <Card 
      variant="outlined" 
      sx={{ 
        borderRadius: 2, 
        transition: '0.3s',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 8px 16px 0 rgba(0,0,0,0.1)',
          transform: 'translateY(-5px)'
        },
        opacity: earned ? 1 : 0.7,
        filter: earned ? 'none' : 'grayscale(0.5)',
      }}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        {earned && (
          <Chip 
            label="Kazanıldı" 
            color="success" 
            size="small" 
            sx={{ 
              position: 'absolute', 
              top: 10, 
              right: 10,
              fontWeight: 'bold' 
            }} 
          />
        )}
        
        <Avatar 
          src={badge.gorsel} 
          alt={badge.ad} 
          sx={{ 
            width: 80, 
            height: 80, 
            margin: '0 auto 16px auto',
            border: earned ? '3px solid #4caf50' : '3px solid #e0e0e0'
          }} 
        />
        
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          {badge.ad}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {badge.aciklama}
        </Typography>
        
        <Chip 
          label={`Seviye ${badge.seviye}`}
          color="primary" 
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
        />
      </CardContent>
    </Card>
  );

  // Next level details
  const nextLevelDetails = {
    level: userProgress.seviye + 1,
    pointsRequired: 1000,
    pointsRemaining: 1000 - userProgress.puanlar,
    benefits: [
      'Daha zorlu hareketlere erişim',
      'Gelişmiş dans teknikleri',
      'Özel grup etkinliklerine katılım hakkı'
    ]
  };
  
  // Calculate progress to next level
  const progressToNextLevel = Math.round((userProgress.puanlar / nextLevelDetails.pointsRequired) * 100);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show"
      >
        <motion.div variants={item}>
          <Typography 
            variant="h3" 
            component="h1" 
            fontWeight="bold" 
            align="center" 
            gutterBottom
            color="primary"
          >
            Dans İlerleme & Rozetler
          </Typography>
          
          <Typography 
            variant="subtitle1" 
            align="center" 
            color="text.secondary" 
            paragraph 
            sx={{ mb: 6, maxWidth: 700, mx: 'auto' }}
          >
            Dans yolculuğunuzdaki ilerlemelerinizi takip edin, yeni rozetler kazanın ve dans becerilerinizi geliştirin.
          </Typography>
        </motion.div>

        {/* Main Progress Section */}
        <motion.div variants={item}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 6,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 150,
              height: 150,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }} />
            
            <Box sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 200,
              height: 200,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }} />

            <Grid container spacing={4}>
              <Grid item xs={12} md={8} sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold">
                  Dans Seviyesi {userProgress.seviye}
                </Typography>
                
                <Typography variant="subtitle1" sx={{ mb: 3, opacity: 0.9 }}>
                  Toplam {userProgress.puanlar} puan kazandınız
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="h4" fontWeight="bold">
                        {userProgress.tamamlananKurslar}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Tamamlanan Kurs
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="h4" fontWeight="bold">
                        {userProgress.tamamlananDersler}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Tamamlanan Ders
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="h4" fontWeight="bold">
                        {userProgress.toplamDansSuresi}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Dans Saati
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                      <Typography variant="h4" fontWeight="bold">
                        {userProgress.kazanilanRozetler.length}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Kazanılan Rozet
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={4} sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: { xs: 'center', md: 'right' }
                }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Genel İlerleme
                  </Typography>
                  
                  <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
                    <CircularProgress 
                      variant="determinate" 
                      value={userProgress.ilerlemeYuzdesi} 
                      size={isMobile ? 100 : 120} 
                      thickness={5}
                      sx={{ 
                        color: 'white',
                        '& .MuiCircularProgress-circle': {
                          strokeLinecap: 'round',
                        }
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h4" fontWeight="bold">
                        {`${userProgress.ilerlemeYuzdesi}%`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
        
        {/* Next Level Progress */}
        <motion.div variants={item}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              mb: 6, 
              borderRadius: 4,
              borderLeft: '5px solid #2575fc'
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={7}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LevelUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Sonraki Seviye: {nextLevelDetails.level}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      İlerleme
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {userProgress.puanlar} / {nextLevelDetails.pointsRequired} puan
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressToNextLevel} 
                    sx={{ height: 10, borderRadius: 5 }} 
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Seviye {nextLevelDetails.level} için {nextLevelDetails.pointsRemaining} puan daha kazanmanız gerekiyor.
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <List dense sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                  <ListItem>
                    <ListItemIcon>
                      <TipIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Seviye Avantajları" 
                      secondary="Bir sonraki seviyede sizi bekleyen özellikler:"
                    />
                  </ListItem>
                  
                  {nextLevelDetails.benefits.map((benefit, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={benefit} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* Badges Section */}
        <motion.div variants={item}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Rozetleriniz
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Dans yolculuğunuzda kazandığınız ve hedeflediğiniz rozetler
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {badges.map((badge) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
                <BadgeCard 
                  badge={badge} 
                  earned={userProgress.kazanilanRozetler.includes(badge.id)} 
                />
              </Grid>
            ))}
          </Grid>
        </motion.div>
        
        {/* How to Earn More Badges */}
        <motion.div variants={item}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              mt: 6,
              borderRadius: 4,
              bgcolor: 'primary.50',
              border: '1px dashed',
              borderColor: 'primary.main'
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Nasıl Daha Fazla Rozet Kazanabilirsiniz?
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CourseIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Dans derslerine düzenli katılın" 
                  secondary="Haftalık ders kotanızı doldurmak size ekstra puanlar kazandırır"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <TimeIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Dans pratiği yapın" 
                  secondary="Pratik yaparak dans saatinizi arttırın ve yeni rozetlerin kilidini açın"
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <ActivityIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Dans etkinliklerine katılın" 
                  secondary="Sosyal dans etkinlikleri ve yarışmalar size özel rozetler kazandırır"
                />
              </ListItem>
            </List>
            
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              endIcon={<TrophyIcon />}
            >
              Rozet Görevlerini Göster
            </Button>
          </Paper>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default ProgressPage; 