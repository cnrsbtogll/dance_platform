import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  IconButton,
  Button
} from '@mui/material';
import { Close as CloseIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import confetti from 'canvas-confetti';

interface BadgeNotificationProps {
  badge: {
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    points: number;
  };
  onClose: () => void;
  open: boolean;
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({ 
  badge, 
  onClose, 
  open 
}) => {
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    setIsVisible(open);
    
    // Bildirim açıldığında konfeti efekti
    if (open) {
      // Canvas konfeti kütüphanesini kullan
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const runConfetti = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF4500']
        });
        
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF4500']
        });

        if (Date.now() < end) {
          requestAnimationFrame(runConfetti);
        }
      };
      
      runConfetti();
    }
    
    // Otomatik kapanma
    if (open) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Animasyon tamamlandıktan sonra
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
            style={{ width: '100%', maxWidth: 400, margin: '0 16px' }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 0,
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Üst Kısım - Gradient Arka Plan */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                  p: 3,
                  textAlign: 'center',
                  color: 'white',
                }}
              >
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Tebrikler!
                  </Typography>
                </motion.div>
                
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <Typography variant="subtitle1">
                    Yeni Bir Rozet Kazandınız
                  </Typography>
                </motion.div>
              </Box>
              
              {/* Rozet İçeriği */}
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5, type: 'spring', bounce: 0.5 }}
                >
                  <Avatar
                    src={badge.iconUrl}
                    alt={badge.name}
                    sx={{
                      width: 100,
                      height: 100,
                      mx: 'auto',
                      mb: 2,
                      border: '4px solid #4caf50',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  />
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {badge.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {badge.description}
                  </Typography>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2
                    }}
                  >
                    <TrophyIcon sx={{ color: '#FFD700', mr: 1 }} />
                    <Typography variant="subtitle1" color="primary" fontWeight="bold">
                      +{badge.points} Puan Kazandınız!
                    </Typography>
                  </Box>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onClose}
                    sx={{ mt: 1 }}
                  >
                    Harika!
                  </Button>
                </motion.div>
              </Box>
              
              {/* Kapatma Butonu */}
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'white',
                }}
                onClick={onClose}
              >
                <CloseIcon />
              </IconButton>
            </Paper>
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default BadgeNotification; 