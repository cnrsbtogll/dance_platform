import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, Tab, Box, Typography, Paper } from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Person as PersonIcon, 
  School as SchoolIcon,
  EventNote as EventNoteIcon,
  Group as GroupIcon,
  Badge as BadgeIcon,
  Settings as SettingsIcon 
} from '@mui/icons-material';
import { useAuth } from '../../../common/hooks/useAuth';
import { db } from '../../../api/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import StudentManagement from '../components/StudentManagement';
import InstructorManagement from '../components/InstructorManagement';
import CourseManagement from '../components/CourseManagement';
import AttendanceManagement from '../components/AttendanceManagement';
import ProgressTracking from '../components/ProgressTracking';
import BadgeSystem from '../components/BadgeSystem';
import SchoolSettings from '../components/SchoolSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SchoolAdmin: React.FC = () => {
  const { user } = useAuth();
  const [value, setValue] = useState(0);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch school information
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user document to get school ID
        const userRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          setError('Kullanıcı bilgileri bulunamadı.');
          setLoading(false);
          return;
        }
        
        const userData = userDoc.data();
        
        // Check if user is a school - fix type checking logic with null checks
        const userRole = userData.role;
        
        // Safely check if the user has the school role
        const isSchool = userRole 
          ? (Array.isArray(userRole) 
              ? userRole.includes('school') 
              : userRole === 'school')
          : false;
            
        if (!isSchool) {
          setError('Bu sayfaya erişim yetkiniz bulunmamaktadır. Yalnızca dans okulu hesapları için erişilebilir.');
          setLoading(false);
          return;
        }
        
        // If this is the user's school account
        if (userData.schoolId) {
          const schoolRef = doc(db, 'dansOkullari', userData.schoolId);
          const schoolDoc = await getDoc(schoolRef);
          
          if (schoolDoc.exists()) {
            setSchoolInfo({
              id: schoolDoc.id,
              ...schoolDoc.data()
            });
          }
        } else {
          // If the user doc itself is for a school
          setSchoolInfo({
            id: userDoc.id,
            ...userData
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Okul bilgileri yüklenirken hata:', err);
        setError('Okul bilgileri yüklenirken bir hata oluştu.');
        setLoading(false);
      }
    };
    
    fetchSchoolInfo();
  }, [user]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Paper elevation={3} sx={{ p: 3, bgcolor: '#FEF2F2', borderLeft: '4px solid #EF4444' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      </Box>
    );
  }

  if (!schoolInfo) {
    return (
      <Box p={3}>
        <Paper elevation={3} sx={{ p: 3, bgcolor: '#FEF2F2', borderLeft: '4px solid #EF4444' }}>
          <Typography>Okul bilgileri bulunamadı. Lütfen yönetici ile iletişime geçin.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-6"
    >
      <Paper elevation={2} className="rounded-lg overflow-hidden">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="Okul Yönetim Paneli"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              '.MuiTab-root': { 
                minHeight: '72px',
                fontWeight: 500
              }
            }}
          >
            <Tab icon={<PersonIcon />} label="Öğrenciler" iconPosition="start" />
            <Tab icon={<SchoolIcon />} label="Eğitmenler" iconPosition="start" />
            <Tab icon={<EventNoteIcon />} label="Kurslar" iconPosition="start" />
            <Tab icon={<GroupIcon />} label="Yoklama" iconPosition="start" />
            <Tab icon={<DashboardIcon />} label="İlerleme Takibi" iconPosition="start" />
            <Tab icon={<BadgeIcon />} label="Rozetler" iconPosition="start" />
            <Tab icon={<SettingsIcon />} label="Ayarlar" iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <StudentManagement schoolInfo={schoolInfo} />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <InstructorManagement schoolInfo={schoolInfo} />
        </TabPanel>
        
        <TabPanel value={value} index={2}>
          <CourseManagement schoolInfo={schoolInfo} />
        </TabPanel>
        
        <TabPanel value={value} index={3}>
          <AttendanceManagement schoolInfo={schoolInfo} />
        </TabPanel>
        
        <TabPanel value={value} index={4}>
          <ProgressTracking schoolInfo={schoolInfo} />
        </TabPanel>
        
        <TabPanel value={value} index={5}>
          <BadgeSystem schoolInfo={schoolInfo} />
        </TabPanel>
        
        <TabPanel value={value} index={6}>
          <SchoolSettings schoolInfo={schoolInfo} />
        </TabPanel>
      </Paper>
    </motion.div>
  );
};

export default SchoolAdmin; 