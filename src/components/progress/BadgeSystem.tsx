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

const BadgeSystem: React.FC = () => {
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
        sx={{ 
          height: 8, 
          borderRadius: 4,
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)'
          }
        }}
      />
    </Box>
  );

  // Badge card component
  const BadgeCard: React.FC<BadgeCardProps> = ({ badge, earned = false }) => (
    <Card
      component={motion.div}
      whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(99, 102, 241, 0.2)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        height: '100%',
        border: earned ? '2px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(0, 0, 0, 0.08)',
        position: 'relative',
        opacity: earned ? 1 : 0.7,
        filter: earned ? 'none' : 'grayscale(40%)',
        transition: 'all 0.3s ease',
      }}
    >
      {earned && (
        <Box
          component={motion.div}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            background: '#10B981',
            borderRadius: '50%',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(16, 185, 129, 0.4)'
          }}
        >
          <CheckIcon fontSize="small" sx={{ color: 'white' }} />
        </Box>
      )}

      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            position: 'relative',
            overflow: 'hidden',
            border: earned ? '2px solid rgba(139, 92, 246, 0.6)' : '2px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <img
            src={badge.gorsel}
            alt={badge.ad}
            style={{ 
              width: '100%', 
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.currentTarget;
              target.src = `https://ui-avatars.com/api/?name=${badge.ad}&background=8B5CF6&color=fff&size=80`;
            }}
          />
          
          {!earned && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              <LevelUpIcon />
            </Box>
          )}
        </Box>

        <Typography 
          variant="subtitle1" 
          component="h3" 
          align="center" 
          gutterBottom 
          fontWeight={600}
          color={earned ? 'text.primary' : 'text.secondary'}
        >
          {badge.ad}
        </Typography>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          align="center" 
          sx={{ mb: 'auto', flexGrow: 1 }}
        >
          {badge.aciklama}
        </Typography>

        {!earned && (
          <Chip
            label={`Seviye ${badge.seviye}'de açılır`}
            size="small"
            sx={{
              mt: 2,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: '#6366F1',
              fontWeight: 500,
              borderRadius: '12px'
            }}
          />
        )}
      </CardContent>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '70vh',
          flexDirection: 'column', 
          gap: 2 
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: '#8B5CF6' }} />
        <Typography variant="h6" color="text.secondary">İlerleme bilgileri yükleniyor...</Typography>
      </Box>
    );
  }

  // Calculate points needed for next level
  const pointsForNextLevel = 350 - (userProgress.puanlar % 350);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            fontWeight="bold"
            sx={{
              position: 'relative',
              display: 'inline-block',
              background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Dans İlerleme Durumum
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto' }}>
            Dans yolculuğunuzda kaydettiğiniz ilerlemeyi takip edin, rozetleri kazanın ve dans becerilerinizi geliştirin.
          </Typography>
        </Box>

        {/* Progress summary card */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: 6, 
            borderRadius: 4,
            background: 'linear-gradient(145deg, #ffffff, #f5f7ff)',
            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.1)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #6366F1)',
              backgroundSize: '200% 100%',
              animation: 'gradient-move 8s ease infinite',
              '@keyframes gradient-move': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' }
              }
            }}
          />
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-start', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'rgba(99, 102, 241, 0.9)',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  {userProgress.seviye}
                </Avatar>
                
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Seviye {userProgress.seviye}
                  </Typography>
                  
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Toplam {userProgress.puanlar} puan kazandınız
                  </Typography>
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: '#8B5CF6',
                      my: 1
                    }}
                  >
                    <LevelUpIcon fontSize="small" />
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      color="primary"
                    >
                      Bir sonraki seviye için {pointsForNextLevel} puan daha gerekiyor
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <ProgressBar value={userProgress.ilerlemeYuzdesi} label="Genel İlerleme" />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography 
                variant="subtitle1" 
                fontWeight="bold" 
                color="text.secondary" 
                sx={{ mb: 2, display: { xs: 'block', md: 'none' } }}
              >
                Dans İstatistiklerim
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      height: '100%',
                      background: 'linear-gradient(145deg, #f0f5ff, #ffffff)',
                      border: '1px solid rgba(99, 102, 241, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 5px 15px rgba(99, 102, 241, 0.15)',
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CourseIcon sx={{ fontSize: 40, color: '#6366F1', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="#6366F1">
                        {userProgress.tamamlananKurslar}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Tamamlanan Kurslar
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      height: '100%',
                      background: 'linear-gradient(145deg, #f3f0ff, #ffffff)',
                      border: '1px solid rgba(139, 92, 246, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 5px 15px rgba(139, 92, 246, 0.15)',
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <ActivityIcon sx={{ fontSize: 40, color: '#8B5CF6', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="#8B5CF6">
                        {userProgress.tamamlananDersler}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Katılınan Dersler
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      height: '100%',
                      background: 'linear-gradient(145deg, #eff6ff, #ffffff)',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 5px 15px rgba(59, 130, 246, 0.15)',
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <TimeIcon sx={{ fontSize: 40, color: '#3B82F6', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="#3B82F6">
                        {userProgress.toplamDansSuresi}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Dans Saati
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      height: '100%',
                      background: 'linear-gradient(145deg, #ecfdf5, #ffffff)',
                      border: '1px solid rgba(16, 185, 129, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 5px 15px rgba(16, 185, 129, 0.15)',
                        transform: 'translateY(-3px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <TrophyIcon sx={{ fontSize: 40, color: '#10B981', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="#10B981">
                        {userProgress.kazanilanRozetler.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Kazanılan Rozetler
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Badges section */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrophyIcon sx={{ color: '#8B5CF6', mr: 1, fontSize: 28 }} />
            <Typography 
              variant="h4" 
              component="h2" 
              fontWeight="bold"
              sx={{
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: '40px',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                  bottom: '-8px',
                  left: '0',
                }
              }}
            >
              Rozetlerim
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {badges.map((badge, index) => (
              <Grid 
                item 
                xs={6} 
                sm={4} 
                md={2.4} 
                key={badge.id}
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <BadgeCard 
                  badge={badge} 
                  earned={userProgress.kazanilanRozetler.includes(badge.id)} 
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Tips section */}
        <Paper 
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          elevation={0} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            borderRadius: 4,
            background: 'linear-gradient(145deg, #f5f7ff, #ffffff)',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.05)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '6px',
              height: '100%',
              background: 'linear-gradient(180deg, #6366F1, #8B5CF6)',
              borderTopLeftRadius: 4,
              borderBottomLeftRadius: 4
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TipIcon sx={{ color: '#8B5CF6', mr: 1, fontSize: 24 }} />
            <Typography variant="h5" fontWeight="bold">
              Dans Becerilerinizi Nasıl Geliştirebilirsiniz?
            </Typography>
          </Box>
          
          <List sx={{ pl: 2 }}>
            <ListItem sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon sx={{ color: '#8B5CF6' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Haftada en az 3 kez pratik yapın."
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
            
            <ListItem sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon sx={{ color: '#8B5CF6' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Dans partnerlerinizle düzenli olarak buluşun ve geri bildirim isteyin."
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
            
            <ListItem sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon sx={{ color: '#8B5CF6' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Dans videolarınızı çekin ve kendinizi izleyerek geliştirin."
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
            
            <ListItem sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon sx={{ color: '#8B5CF6' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Kendinize gerçekçi hedefler belirleyin ve ilerlemenizi takip edin."
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          </List>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              component={motion.button}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              variant="contained"
              color="primary"
              size="large"
              sx={{
                bgcolor: 'rgba(99, 102, 241, 0.9)',
                backgroundImage: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                borderRadius: '10px',
                textTransform: 'none',
                px: 4,
                py: 1.5,
                fontWeight: 600
              }}
            >
              Dans Kurslarına Göz At
            </Button>
          </Box>
        </Paper>
      </Container>
    </motion.div>
  );
};

export default BadgeSystem; 