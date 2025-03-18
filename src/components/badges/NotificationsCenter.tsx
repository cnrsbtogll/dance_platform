import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../api/firebase/firebase';
import useAuth from '../../common/hooks/useAuth';
import BadgeNotification from './BadgeNotification';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  details: any;
  read: boolean;
  createdAt: Timestamp;
}

const NotificationsCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentBadgeNotification, setCurrentBadgeNotification] = useState<any>(null);
  const [showBadgeNotification, setShowBadgeNotification] = useState(false);

  // Kullanıcının bildirimlerini Firestore'dan dinle
  useEffect(() => {
    if (!user || !user.id) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.id),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications: Notification[] = [];
      
      snapshot.forEach((doc) => {
        newNotifications.push({
          id: doc.id,
          ...doc.data()
        } as Notification);
      });
      
      setNotifications(newNotifications);
      
      // Yeni bir rozet bildirimi varsa göster
      const badgeNotification = newNotifications.find(n => n.type === 'badge_earned');
      if (badgeNotification && !showBadgeNotification) {
        setCurrentBadgeNotification({
          id: badgeNotification.details.badgeId,
          name: badgeNotification.details.badgeName,
          description: badgeNotification.message,
          iconUrl: badgeNotification.details.badgeUrl,
          points: badgeNotification.details.points
        });
        setShowBadgeNotification(true);
        
        // Bildirimi okundu olarak işaretle
        markNotificationAsRead(badgeNotification.id);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Bildirimi okundu olarak işaretle
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Bildirim durumu güncellenirken hata:', error);
    }
  };

  // Bildirim kapatıldığında
  const handleCloseBadgeNotification = () => {
    setShowBadgeNotification(false);
    setCurrentBadgeNotification(null);
  };

  return (
    <>
      {/* Rozet Bildirimleri */}
      {showBadgeNotification && currentBadgeNotification && (
        <BadgeNotification
          badge={currentBadgeNotification}
          open={showBadgeNotification}
          onClose={handleCloseBadgeNotification}
        />
      )}
    </>
  );
};

export default NotificationsCenter; 