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
  useMediaQuery,
  Alert
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  School as CourseIcon,
  Timer as TimeIcon,
  CheckCircle as CheckIcon,
  ArrowUpward as LevelUpIcon,
  DirectionsRun as ActivityIcon,
  Lightbulb as TipIcon,
  Info as InfoIcon
} from '@mui/icons-material';
// import { useAuth } from '../../contexts/AuthContext';
import useAuth from '../../common/hooks/useAuth';
import { getUserProgressSummary, getAchievements, UserProgressSummary, Achievement } from '../../api/services/progressService';
import { dansRozet } from '../../data/dansVerileri';

// Type definitions for props
interface ProgressBarProps {
  value: number;
  label: string;
  color?: string;
}

interface BadgeCardProps {
  badge: Achievement;
  earned?: boolean;
}

const ProgressPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // common/hooks/useAuth user döndürüyor, currentUser değil
  const { user, loading: authLoading } = useAuth();
  
  console.log("ProgressPage: Auth durumu", { user, authLoading });
  
  // State for progress and badges
  const [progressSummary, setProgressSummary] = useState<UserProgressSummary | null>(null);
  const [allBadges, setAllBadges] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      console.log("fetchData başlıyor, auth durumu:", { authLoading, userExists: !!user });
      if (authLoading) {
        console.log("Auth yükleniyor, veri çekme işlemi erteleniyor");
        return;
      }
      
      if (!user) {
        console.log("Kullanıcı oturum açmamış, hata gösteriliyor");
        setError('Bu sayfayı görüntülemek için giriş yapmalısınız.');
        setLoading(false);
        return;
      }
      
      console.log("Kullanıcı bilgileri:", { userId: user.uid, email: user.email });
      
      setLoading(true);
      setError(null);
      
      try {
        console.log("Rozetleri getirme işlemi başlıyor");
        // Tüm başarı rozetlerini getir
        const badges = await getAchievements();
        console.log("Getirilen rozet sayısı:", badges.length);
        setAllBadges(badges);
        
        console.log("Kullanıcı ilerleme özeti getirme işlemi başlıyor, userId:", user.uid);
        // Kullanıcının ilerleme özetini getir
        const summary = await getUserProgressSummary(user.uid);
        console.log("Kullanıcı ilerleme özeti:", { 
          completedCourses: summary.completedCourses,
          earnedAchievements: summary.earnedAchievements.length,
          courseProgress: summary.courseProgress.length
        });
        setProgressSummary(summary);
      } catch (err: any) {
        console.error('İlerleme verileri getirilirken hata:', err);
        console.log("Hata detayları:", {
          code: err.code,
          message: err.message,
          stack: err.stack
        });
        
        // Hata mesajını daha detaylı hale getir
        if (err.code === 'permission-denied') {
          setError('Bu verilere erişim izniniz bulunmuyor. Yönetici ile iletişime geçin.');
        } else if (err.code === 'not-found') {
          setError('İlerleme verileri bulunamadı. Henüz herhangi bir kursa kaydolmamış olabilirsiniz.');
        } else if (err.message && err.message.includes('index')) {
          setError('Veri yapısı sorunu: Firebase indeks hatası. Yönetici ile iletişime geçin.');
        } else if (err.message && err.message.includes('network')) {
          setError('Ağ bağlantısı sorunu: Lütfen internet bağlantınızı kontrol edin.');
        } else {
          setError(`İlerleme verileri yüklenirken bir hata oluştu: ${err.message || 'Bilinmeyen hata'}. Lütfen daha sonra tekrar deneyin.`);
        }
      } finally {
        console.log("Veri yükleme işlemi tamamlandı, loading:", false);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, authLoading]);

  // Başarıların mevcut olmaması veya hata durumunda örnek verilerle geri dönüş
  useEffect(() => {
    if (!loading && allBadges.length === 0 && !error) {
      // Örnek verileri dansVerileri'nden al
      const sampleBadges = dansRozet.map(badge => ({
        id: badge.id.toString(),
        name: badge.ad,
        description: badge.aciklama,
        danceStyle: "all",
        iconUrl: badge.gorsel,
        points: badge.seviye * 10,
        level: badge.seviye.toString()
      })) as Achievement[];
      
      setAllBadges(sampleBadges);
    }
  }, [loading, allBadges, error]);

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
          src={badge.iconUrl} 
          alt={badge.name} 
          sx={{ 
            width: 80, 
            height: 80, 
            margin: '0 auto 16px auto',
            border: earned ? '3px solid #4caf50' : '3px solid #e0e0e0'
          }} 
        />
        
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          {badge.name}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          {badge.description}
        </Typography>
        
        <Chip 
          label={`Seviye ${badge.level || '1'}`}
          color="primary" 
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
        />
      </CardContent>
    </Card>
  );

  // Check if a badge is earned
  const isBadgeEarned = (badge: Achievement): boolean => {
    if (!progressSummary || !progressSummary.earnedAchievements) return false;
    return progressSummary.earnedAchievements.some(earned => earned.id === badge.id);
  };

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

  if (authLoading || loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>İlerleme durumunuz yükleniyor...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          Yeniden Dene
        </Button>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="info" sx={{ mb: 4 }}>
          İlerleme durumunuzu görmek için lütfen giriş yapın.
        </Alert>
        
        <Button 
          variant="contained" 
          color="primary" 
          href="/signin"
        >
          Giriş Yap
        </Button>
      </Container>
    );
  }

  // Veri yoksa veya yeni kullanıcı ise gösterilecek içerik
  if (!progressSummary || 
      (!progressSummary.completedLessons && 
       !progressSummary.earnedAchievements?.length)) {
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

          <motion.div variants={item}>
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 6,
                borderRadius: 4,
                backgroundColor: '#f5f5f5',
                border: '1px dashed #ccc',
                textAlign: 'center'
              }}
            >
              <InfoIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Henüz ilerleme kaydı bulunamadı
              </Typography>
              
              <Typography variant="body1" paragraph>
                Dans kurslarına katılarak ve dersleri tamamlayarak ilerleme kaydetmeye başlayabilirsiniz.
                Rozetler kazanarak seviyenizi yükseltebilirsiniz.
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary" 
                href="/courses"
                sx={{ mt: 2 }}
              >
                Kursları Keşfet
              </Button>
            </Paper>
          </motion.div>
          
          {/* Mevcut tüm başarı rozetleri */}
          <motion.div variants={item}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mt: 6, mb: 3 }}>
              Kazanabileceğin Rozetler
            </Typography>
            
            <Grid container spacing={3}>
              {allBadges.map((badge) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
                  <BadgeCard badge={badge} earned={false} />
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </motion.div>
      </Container>
    );
  }

  // Next level details
  const nextLevelDetails = {
    level: progressSummary.level + 1,
    pointsRequired: progressSummary.nextLevelPoints,
    pointsRemaining: progressSummary.nextLevelPoints - progressSummary.points,
    benefits: [
      'Daha zorlu hareketlere erişim',
      'Gelişmiş dans teknikleri',
      'Özel grup etkinliklerine katılım hakkı'
    ]
  };
  
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
            {/* Background decoration */}
            <Box 
              sx={{ 
                position: 'absolute', 
                top: -25, 
                right: -25, 
                width: 150, 
                height: 150, 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.1)' 
              }} 
            />
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: -50, 
                left: -50, 
                width: 200, 
                height: 200, 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.05)' 
              }} 
            />
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={7}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  Dans Seviyeniz: {progressSummary.level}
                </Typography>
                
                <Typography variant="subtitle1" sx={{ mb: 3, opacity: 0.9 }}>
                  Bir sonraki seviyeye {nextLevelDetails.pointsRemaining} puan kaldı!
                </Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      İlerleme: {progressSummary.points} / {progressSummary.nextLevelPoints} puan
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {progressSummary.progressPercentage}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressSummary.progressPercentage} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'white'
                      }
                    }} 
                  />
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h4" fontWeight="bold">{progressSummary.completedCourses}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Tamamlanan Kurslar</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h4" fontWeight="bold">{progressSummary.completedLessons}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Tamamlanan Dersler</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h4" fontWeight="bold">{progressSummary.totalDanceHours}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Dans Saati</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h4" fontWeight="bold">{progressSummary.earnedAchievements.length}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Kazanılan Rozetler</Typography>
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} md={5}>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  justifyContent: 'center',
                  borderLeft: { xs: 'none', md: '1px solid rgba(255,255,255,0.2)' },
                  pl: { xs: 0, md: 4 },
                  pt: { xs: 2, md: 0 }
                }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Seviye {nextLevelDetails.level} Avantajları:
                  </Typography>
                  
                  <List sx={{ opacity: 0.9 }}>
                    {nextLevelDetails.benefits.map((benefit, index) => (
                      <ListItem key={index} sx={{ p: 0, mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36, color: 'white' }}>
                          <CheckIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={benefit} />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    startIcon={<LevelUpIcon />}
                    sx={{ 
                      mt: 2,
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    Seviye Nasıl Yükseltilir?
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        {/* Course Progress */}
        <motion.div variants={item}>
          <Paper elevation={0} sx={{ p: 4, mb: 6, borderRadius: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              <CourseIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Kurs İlerlemeleri
            </Typography>
            
            {progressSummary.courseProgress.length > 0 ? (
              <Box sx={{ mt: 3 }}>
                {progressSummary.courseProgress.map((course, index) => (
                  <Box key={index} sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {course.courseName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {course.completedLessons} / {course.totalLessons} ders tamamlandı
                    </Typography>
                    <ProgressBar 
                      value={course.progress} 
                      label={`${Math.round(course.progress)}% tamamlandı`} 
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Henüz hiçbir kursa kaydolmadınız veya ders tamamlamadınız.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  href="/courses"
                  sx={{ mt: 2 }}
                >
                  Kursları Keşfet
                </Button>
              </Box>
            )}
          </Paper>
        </motion.div>
        
        {/* Recent Activity */}
        <motion.div variants={item}>
          <Paper elevation={0} sx={{ p: 4, mb: 6, borderRadius: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              <ActivityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Son Aktiviteler
            </Typography>
            
            {progressSummary.recentAttendance && progressSummary.recentAttendance.length > 0 ? (
              <List sx={{ mt: 2 }}>
                {progressSummary.recentAttendance.map((attendance, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: attendance.status === 'attended' ? 'success.light' : 
                                  attendance.status === 'late' ? 'warning.light' : 'error.light' 
                        }}
                      >
                        {attendance.status === 'attended' ? 
                          <CheckIcon /> : 
                          <TimeIcon />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={attendance.courseName}
                      secondary={`${new Date(attendance.date).toLocaleDateString('tr-TR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}, ${attendance.status === 'attended' ? 'Katıldı' : 
                              attendance.status === 'late' ? 'Geç Kaldı' : 'Katılmadı'}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Henüz kaydedilmiş katılım bilginiz bulunmuyor.
                </Typography>
              </Box>
            )}
          </Paper>
        </motion.div>

        {/* Badges Section */}
        <motion.div variants={item}>
          <Paper elevation={0} sx={{ p: 4, mb: 6, borderRadius: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Kazanılan Rozetler
            </Typography>
            
            {progressSummary.earnedAchievements && progressSummary.earnedAchievements.length > 0 ? (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {progressSummary.earnedAchievements.map((badge) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
                    <BadgeCard badge={badge} earned={true} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Henüz rozet kazanmadınız. Derslerinizi tamamlayarak rozetler kazanabilirsiniz.
                </Typography>
              </Box>
            )}
            
            {/* Upcoming Badges */}
            <Typography variant="h6" fontWeight="bold" sx={{ mt: 6, mb: 3 }}>
              Kazanabileceğin Diğer Rozetler
            </Typography>
            
            <Grid container spacing={3}>
              {allBadges
                .filter(badge => !isBadgeEarned(badge))
                .slice(0, 4)
                .map((badge) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
                    <BadgeCard badge={badge} earned={false} />
                  </Grid>
                ))}
            </Grid>
            
            {allBadges.filter(badge => !isBadgeEarned(badge)).length > 4 && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button variant="outlined" color="primary">
                  Tüm Rozetleri Görüntüle
                </Button>
              </Box>
            )}
          </Paper>
        </motion.div>
        
        {/* Tip Section */}
        <motion.div variants={item}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4,
              borderRadius: 4,
              backgroundColor: 'rgba(106, 17, 203, 0.05)',
              border: '1px solid rgba(106, 17, 203, 0.1)'
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
                <TipIcon sx={{ fontSize: 80, color: 'primary.main', opacity: 0.8 }} />
              </Grid>
              <Grid item xs={12} sm={10}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Dans İpucu
                </Typography>
                <Typography variant="body1">
                  Dansınızı geliştirmek için sadece kurslara katılmak yeterli değildir. Derslerin dışında da 
                  düzenli olarak pratik yapın. Her gün 15-20 dakika ayırarak dans hareketlerini tekrar etmek, 
                  hızlı ilerlemenize yardımcı olacaktır.
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default ProgressPage; 