import { useEffect, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import useAuth from './useAuth';
import { logUserActivity } from '../../api/services/badgeService';

/**
 * Kullanıcı aktivitelerini izleyen ve kaydeden custom hook
 */
const useActivityTracking = () => {
  const { user } = useAuth();
  const location = useLocation();
  const params = useParams();

  // Sayfa görüntüleme aktivitesini kaydet
  useEffect(() => {
    if (user && user.id) {
      trackPageView(location.pathname);
    }
  }, [user, location.pathname]);

  /**
   * Sayfa görüntüleme aktivitesini kaydeder
   */
  const trackPageView = useCallback(async (path: string) => {
    if (!user || !user.id) return;

    // Sayfa türünü belirle
    if (path.includes('/courses/') && params.id) {
      // Kurs detay sayfası
      logUserActivity(user.id, 'view_course', { courseId: params.id });
    } 
    else if (path.includes('/instructors/') && params.id) {
      // Eğitmen detay sayfası
      logUserActivity(user.id, 'view_instructor', { instructorId: params.id });
    }
    else if (path.includes('/schools/') && params.id) {
      // Dans okulu detay sayfası
      logUserActivity(user.id, 'view_school', { schoolId: params.id });
    }
    else if (path.includes('/profile') && path.includes('/edit')) {
      // Profil düzenleme sayfası - burada form gönderimi ayrıca izlenmeli
    }
    else if (path.includes('/partners')) {
      // Partner arama sayfası
      logUserActivity(user.id, 'search_partners');
    }
    else if (path.includes('/events')) {
      // Etkinlikler sayfası
      logUserActivity(user.id, 'view_events');
    }
  }, [user, params]);

  /**
   * Profil tamamlama aktivitesini kaydeder
   */
  const trackProfileCompletion = useCallback(() => {
    if (!user || !user.id) return;
    logUserActivity(user.id, 'complete_profile', { completionRate: 100 });
  }, [user]);

  /**
   * Partner iletişim talebi gönderme aktivitesini kaydeder
   */
  const trackPartnerRequest = useCallback((partnerId: string, message: string) => {
    if (!user || !user.id) return;
    logUserActivity(user.id, 'send_partner_request', { partnerId, message });
  }, [user]);

  /**
   * Dans etkinliği planlama aktivitesini kaydeder
   */
  const trackDanceEventPlan = useCallback((partnerId: string, eventDetails: any) => {
    if (!user || !user.id) return;
    logUserActivity(user.id, 'plan_dance_event', {
      partnerId,
      eventType: eventDetails.eventType,
      location: eventDetails.location,
      date: eventDetails.date
    });
  }, [user]);

  /**
   * Etkinliğe katılım aktivitesini kaydeder
   */
  const trackEventRegistration = useCallback((eventId: string) => {
    if (!user || !user.id) return;
    logUserActivity(user.id, 'register_event', { eventId });
  }, [user]);

  /**
   * Platform paylaşım aktivitesini kaydeder
   */
  const trackPlatformShare = useCallback((shareMethod: string) => {
    if (!user || !user.id) return;
    logUserActivity(user.id, 'share_platform', { method: shareMethod });
  }, [user]);

  /**
   * Ders tamamlama aktivitesini kaydeder
   */
  const trackLessonCompletion = useCallback((courseId: string, lessonId: string, danceType: string) => {
    if (!user || !user.id) return;
    logUserActivity(user.id, 'complete_lesson', { courseId, lessonId, danceType });
  }, [user]);

  return {
    trackPageView,
    trackProfileCompletion,
    trackPartnerRequest,
    trackDanceEventPlan,
    trackEventRegistration,
    trackPlatformShare,
    trackLessonCompletion
  };
};

export default useActivityTracking; 