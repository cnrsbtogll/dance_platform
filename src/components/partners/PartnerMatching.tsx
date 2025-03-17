// src/components/partners/PartnerMatching.tsx
import React, { useState, useEffect, Fragment, ChangeEvent, FormEvent } from 'react';
import { Transition } from '@headlessui/react';
import { Link, useNavigate } from 'react-router-dom';
import CustomSelect from '../common/CustomSelect';
import { collection, getDocs, query, orderBy, where, limit, DocumentData, addDoc, deleteDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth'; 
import { User, DanceStyle as DanceStyleType, DanceLevel } from '../../types';
import { motion } from 'framer-motion';
import { fetchSignInMethodsForEmail } from 'firebase/auth';

// Placeholder görüntü yolları - 404 hatasını önlemek için var olan bir görsele yönlendirelim
const PLACEHOLDER_PARTNER_IMAGE = '/assets/images/dance/egitmen1.jpg';

// Extended User interface with partner matching properties
interface ExtendedUser extends User {
  city?: string;
  availableTimes?: string[];
  gender?: string;
  age?: number;
  rating?: number;
  height?: number;
  weight?: number;
}

// Partner veri tipi
interface Partner {
  id: string;
  ad: string;
  yas: number;
  cinsiyet: string;
  seviye: string;
  dans: string[];
  konum: string;
  saatler: string[];
  foto: string;
  puan: number;
  relevanceScore?: number;
  boy?: number;
  kilo?: number;
}

// PartnerKarti bileşeni için prop tipi
interface PartnerKartiProps {
  partner: Partner;
}

// Dans stili interface
interface DanceStyle {
  id: string;
  label: string;
  value: string;
}

// Firestore User interface
interface FirestoreUser {
  id: string;
  displayName: string;
  photoURL?: string;
  level?: string;
  danceStyles?: string[];
  city?: string;
  availableTimes?: string[];
  gender?: string;
  age?: number;
  rating?: number;
  createdAt?: any;
  role?: string;
  height?: number;
  weight?: number;
}

function PartnerMatching(): JSX.Element {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [dansTuru, setDansTuru] = useState<string>('');
  const [cinsiyet, setCinsiyet] = useState<string>('');
  const [seviye, setSeviye] = useState<string>('');
  const [yas, setYas] = useState<string>('');
  const [konum, setKonum] = useState<string>('');
  const [uygunSaatler, setUygunSaatler] = useState<string[]>([]);
  const [partnerler, setPartnerler] = useState<Partner[]>([]);
  const [allPartnerler, setAllPartnerler] = useState<Partner[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [aramaTamamlandi, setAramaTamamlandi] = useState<boolean>(false);
  const [danceStyles, setDanceStyles] = useState<DanceStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false);
  const [contactStatus, setContactStatus] = useState<{partnerId: string, sent: boolean, message: string, contactId?: string} | null>(null);
  // Toast bildirim durumu
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error' | 'info'} | null>(null);
  // İletişim talebi gönderme veya iptal etme yükleniyor durumu
  const [contactActionLoading, setContactActionLoading] = useState<boolean>(false);

  // Dans stilleri eşleştirme haritası - danceStyles ile users tablosundaki değerler arasında
  const [styleMapping, setStyleMapping] = useState<{[key: string]: DanceStyle}>({});

  // Convert Firestore user to Partner format
  const convertUserToPartner = (user: FirestoreUser): Partner => {
    // User'ın dans stillerini standartlaştır - danceStyles tablosundaki değerlere eşleştir
    const standardizedDanceStyles = user.danceStyles?.map(style => {
      if (typeof style === 'string') {
        const styleLower = style.toLowerCase();
        // StyleMapping'den eşleşen dans stilini bul
        const matchedStyle = styleMapping[styleLower];
        if (matchedStyle) {
          console.log(`Dans stili '${style}' eşleştirildi:`, matchedStyle.label);
          return matchedStyle.label; // Standart label değerini döndür
        }
      }
      // Eşleşme bulunamadıysa orijinal değeri döndür
      return style;
    }) || [];

    return {
      id: user.id,
      ad: user.displayName || 'İsimsiz Kullanıcı',
      yas: user.age || 0,
      cinsiyet: user.gender || 'Belirtilmemiş',
      seviye: user.level === 'beginner' ? 'Başlangıç' : 
              user.level === 'intermediate' ? 'Orta' : 
              user.level === 'advanced' ? 'İleri' : 
              user.level === 'professional' ? 'Profesyonel' : 'Belirtilmemiş',
      dans: standardizedDanceStyles, // Standartlaştırılmış dans stilleri
      konum: user.city || 'Belirtilmemiş',
      saatler: user.availableTimes || [],
      foto: user.photoURL || PLACEHOLDER_PARTNER_IMAGE,
      puan: user.rating || 4.0,
      boy: user.height,
      kilo: user.weight,
    };
  };

  // Calculate relevance score between current user and potential partner
  const calculateRelevanceScore = (partner: Partner, currentUser: FirestoreUser | null): number => {
    if (!currentUser) return 0;
    
    let score = 0;
    
    // Match on dance styles (high importance)
    if (currentUser.danceStyles && partner.dans) {
      const matchingStyles = currentUser.danceStyles.filter(style => 
        partner.dans.includes(style)
      );
      score += matchingStyles.length * 20; // 20 points per matching style
    }
    
    // Match on level (medium importance)
    if (currentUser.level && partner.seviye) {
      const currentUserLevel = currentUser.level;
      const partnerLevel = partner.seviye === 'Başlangıç' ? 'beginner' : 
                          partner.seviye === 'Orta' ? 'intermediate' : 
                          partner.seviye === 'İleri' ? 'advanced' : 
                          partner.seviye === 'Profesyonel' ? 'professional' : '';
      
      if (currentUserLevel === partnerLevel) {
        score += 15; // Exact level match
      } else if (
        (currentUserLevel === 'beginner' && partnerLevel === 'intermediate') ||
        (currentUserLevel === 'intermediate' && (partnerLevel === 'beginner' || partnerLevel === 'advanced')) ||
        (currentUserLevel === 'advanced' && (partnerLevel === 'intermediate' || partnerLevel === 'professional')) ||
        (currentUserLevel === 'professional' && partnerLevel === 'advanced')
      ) {
        score += 10; // Adjacent level
      }
    }
    
    // Match on location (medium importance)
    if (currentUser.city && partner.konum) {
      if (partner.konum.includes(currentUser.city)) {
        score += 15;
      }
    }
    
    // Match on available times (low importance)
    if (currentUser.availableTimes && partner.saatler) {
      const matchingTimes = currentUser.availableTimes.filter(time => 
        partner.saatler.includes(time)
      );
      score += matchingTimes.length * 5; // 5 points per matching time slot
    }
    
    return score;
  };

  // Dans stilleri bilgilerini getiren fonksiyon
  const fetchAndSetDanceStyles = async () => {
    setLoadingStyles(true);
    try {
      const danceStylesRef = collection(db, 'danceStyles');
      const q = query(danceStylesRef, orderBy('label'));
      const querySnapshot = await getDocs(q);
      
      const styles: DanceStyle[] = [];
      const mapping: {[key: string]: DanceStyle} = {};
      
      querySnapshot.forEach((doc) => {
        const styleData = doc.data() as Omit<DanceStyle, 'id'>;
        const style = {
          id: doc.id,
          label: styleData.label,
          value: styleData.value
        };
        
        styles.push(style);
        
        // Farklı yazım şekillerine göre eşleştirme haritasına ekle
        mapping[style.id.toLowerCase()] = style;
        mapping[style.value.toLowerCase()] = style;
        mapping[style.label.toLowerCase()] = style;
      });
      
      setStyleMapping(mapping);
      console.log("Dans stilleri eşleştirme haritası oluşturuldu:", mapping);
      
      if (styles.length === 0) {
        // If no styles in Firestore, use default styles
        const defaultStyles = [
          { id: 'default-1', label: 'Salsa', value: 'salsa' },
          { id: 'default-2', label: 'Bachata', value: 'bachata' },
          { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
          { id: 'default-4', label: 'Tango', value: 'tango' },
          { id: 'default-5', label: 'Vals', value: 'vals' },
          { id: 'default-6', label: 'Hip Hop', value: 'hiphop' },
          { id: 'default-7', label: 'Modern Dans', value: 'modern-dans' },
          { id: 'default-8', label: 'Bale', value: 'bale' },
          { id: 'default-9', label: 'Flamenko', value: 'flamenko' },
          { id: 'default-10', label: 'Zeybek', value: 'zeybek' },
          { id: 'default-11', label: 'Jazz', value: 'jazz' }
        ];
        
        setDanceStyles(defaultStyles);
        
        // Varsayılan stiller için eşleştirme haritası oluştur
        const defaultMapping: {[key: string]: DanceStyle} = {};
        defaultStyles.forEach(style => {
          defaultMapping[style.id.toLowerCase()] = style;
          defaultMapping[style.value.toLowerCase()] = style;
          defaultMapping[style.label.toLowerCase()] = style;
        });
        
        setStyleMapping(defaultMapping);
      } else {
        setDanceStyles(styles);
      }
    } catch (err) {
      console.error('Error fetching dance styles:', err);
      // Fallback to default styles on error
      const defaultStyles = [
        { id: 'default-1', label: 'Salsa', value: 'salsa' },
        { id: 'default-2', label: 'Bachata', value: 'bachata' },
        { id: 'default-3', label: 'Kizomba', value: 'kizomba' },
        { id: 'default-4', label: 'Tango', value: 'tango' },
        { id: 'default-5', label: 'Vals', value: 'vals' },
        { id: 'default-6', label: 'Hip Hop', value: 'hiphop' },
        { id: 'default-7', label: 'Modern Dans', value: 'modern-dans' },
        { id: 'default-8', label: 'Bale', value: 'bale' },
        { id: 'default-9', label: 'Flamenko', value: 'flamenko' },
        { id: 'default-10', label: 'Zeybek', value: 'zeybek' },
        { id: 'default-11', label: 'Jazz', value: 'jazz' }
      ];
      
      setDanceStyles(defaultStyles);
      
      // Varsayılan stiller için eşleştirme haritası oluştur
      const defaultMapping: {[key: string]: DanceStyle} = {};
      defaultStyles.forEach(style => {
        defaultMapping[style.id.toLowerCase()] = style;
        defaultMapping[style.value.toLowerCase()] = style;
        defaultMapping[style.label.toLowerCase()] = style;
      });
      
      setStyleMapping(defaultMapping);
    } finally {
      setLoadingStyles(false);
    }
  };

  // Fetch dance styles from Firestore
  useEffect(() => {
    fetchAndSetDanceStyles();
  }, []);

  // Kullanıcıları getiren fonksiyon - Dans stillerini daha doğru hale getirmek için
  const fetchAndProcessUsers = async () => {
    setInitialLoading(true);
    try {
      // Get current user data
      const extendedCurrentUser = currentUser as ExtendedUser | null;
      const currentUserData: FirestoreUser | null = extendedCurrentUser ? {
        id: extendedCurrentUser.id || '',
        displayName: extendedCurrentUser.displayName || '',
        photoURL: extendedCurrentUser.photoURL,
        level: extendedCurrentUser.level,
        danceStyles: extendedCurrentUser.danceStyles || [],
        city: extendedCurrentUser.city || '',
        availableTimes: extendedCurrentUser.availableTimes || [],
        gender: extendedCurrentUser.gender || '',
        age: extendedCurrentUser.age || 0,
        role: extendedCurrentUser.role,
        height: extendedCurrentUser.height,
        weight: extendedCurrentUser.weight,
      } : null;

      // Fetch all users who are students (regardless of current user login status)
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      
      const users: FirestoreUser[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as DocumentData;
        
        // Check if user has student role and does not have admin or instructor role
        let isOnlyStudent = false;
        
        if (Array.isArray(userData.role)) {
          // If role is an array, check it includes 'student' but not 'admin' or 'instructor'
          isOnlyStudent = userData.role.includes('student') && 
                         !userData.role.includes('admin') && 
                         !userData.role.includes('instructor');
        } else {
          // If role is a string, it should be exactly 'student'
          isOnlyStudent = userData.role === 'student';
        }
        
        // Include students & exclude current user if logged in
        if ((!currentUser || doc.id !== currentUser.id) && isOnlyStudent) {
          users.push({
            id: doc.id,
            displayName: userData.displayName || '',
            photoURL: userData.photoURL,
            level: userData.level,
            danceStyles: userData.danceStyles || [],
            city: userData.city || '',
            availableTimes: userData.availableTimes || [],
            gender: userData.gender || '',
            age: userData.age || 0,
            rating: userData.rating || 4.0,
            role: userData.role,
            height: userData.height,
            weight: userData.weight,
          });
        }
      });
      
      // Convert to Partner format
      const partners = users.map(user => {
        const partner = convertUserToPartner(user);
        
        // Calculate relevance score if user is logged in
        if (currentUserData) {
          partner.relevanceScore = calculateRelevanceScore(partner, currentUserData);
        } else {
          // No relevance score for anonymous users
          partner.relevanceScore = 0;
        }
        
        return partner;
      });
      
      // Sort by relevance score for logged in users, otherwise randomly
      const sortedPartners = currentUserData 
        ? [...partners].sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        : [...partners].sort(() => Math.random() - 0.5); // Shuffle for anonymous users
      
      setAllPartnerler(sortedPartners);
      setPartnerler(sortedPartners.slice(0, 12)); // Show top 12 initially
      setAramaTamamlandi(true);
      
    } catch (err) {
      console.error('Error fetching users:', err);
      setPartnerler([]);
      setAllPartnerler([]);
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch users from Firestore when component mounts
  useEffect(() => {
    fetchAndProcessUsers();
  }, [currentUser]);

  // Kullanıcının mevcut iletişim taleplerini kontrol et
  useEffect(() => {
    if (currentUser) {
      checkExistingContactRequests();
    } else {
      // Kullanıcı çıkış yapmışsa iletişim talebi bilgilerini temizle
      setContactStatus(null);
      localStorage.removeItem('contactStatus');
    }
  }, [currentUser, partnerler]);

  // Mevcut iletişim taleplerini kontrol et
  const checkExistingContactRequests = async () => {
    if (!currentUser || partnerler.length === 0) return;
    
    try {
      const contactRequestsRef = collection(db, 'contactRequests');
      const q = query(contactRequestsRef, 
        where('senderId', '==', currentUser.id),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const contactRequest = querySnapshot.docs[0].data();
        const partnerId = contactRequest.receiverId;
        
        // İlgili partneri bul
        const partner = partnerler.find(p => p.id === partnerId);
        
        if (partner) {
          setContactStatus({
            partnerId: partnerId,
            sent: true,
            message: `${partner.ad} adlı partnere iletişim talebiniz gönderildi. Yanıt bekleyin.`,
            contactId: querySnapshot.docs[0].id
          });
          
          // LocalStorage'a kaydet
          localStorage.setItem('contactStatus', JSON.stringify({
            partnerId: partnerId,
            sent: true,
            message: `${partner.ad} adlı partnere iletişim talebiniz gönderildi. Yanıt bekleyin.`,
            contactId: querySnapshot.docs[0].id,
            timestamp: new Date().getTime()
          }));
        }
      }
    } catch (error) {
      console.error('İletişim talepleri kontrol edilirken hata oluştu:', error);
    }
  };

  // Sayfa yüklendiğinde local storage'dan contactStatus'u kontrol et
  useEffect(() => {
    const savedContactStatus = localStorage.getItem('contactStatus');
    
    // Kullanıcı giriş yapmamışsa localStorage'da iletişim bilgisi olmamalı
    if (!currentUser) {
      localStorage.removeItem('contactStatus');
      return;
    }
    
    if (savedContactStatus) {
      try {
        const parsedStatus = JSON.parse(savedContactStatus);
        
        // 24 saatten eski kayıtları temizle
        const isStillValid = (new Date().getTime() - parsedStatus.timestamp) < 24 * 60 * 60 * 1000;
        
        if (isStillValid && currentUser) {
          setContactStatus({
            partnerId: parsedStatus.partnerId,
            sent: parsedStatus.sent,
            message: parsedStatus.message,
            contactId: parsedStatus.contactId
          });
        } else {
          // Süresi dolmuş veya kullanıcı giriş yapmamış, localStorage'dan temizle
          localStorage.removeItem('contactStatus');
        }
      } catch (error) {
        console.error('LocalStorage contact status parse hatası:', error);
        localStorage.removeItem('contactStatus');
      }
    }
  }, [currentUser]);

  // Seviye seçenekleri
  const seviyeler: string[] = ['Başlangıç', 'Orta', 'İleri', 'Profesyonel'];

  // Cinsiyet seçenekleri
  const cinsiyetler: string[] = ['Kadın', 'Erkek'];

  // Dans partneri arama fonksiyonu
  const partnerAra = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    applyFilters();
  };

  // Dans filtreleme debug fonksiyonu
  const debugDansStilleri = () => {
    console.log("---- DANS STİLLERİ DEBUG ----");
    console.log("Tüm dans stilleri:", danceStyles);
    console.log("Dans stilleri eşleştirme haritası:", styleMapping);
    allPartnerler.forEach(partner => {
      console.log(`Partner: ${partner.ad}, Dans Stilleri:`, partner.dans);
    });
    console.log("---- DANS STİLLERİ SONU ----");
  };

  // Debug amaçlı partnerları loglama fonksiyonu
  const debugPartnerLocations = () => {
    console.log("---- PARTNER KONUMLARI DEBUG ----");
    allPartnerler.forEach(partner => {
      console.log(`Partner: ${partner.ad}, Konum: ${partner.konum}`);
    });
    console.log("---- PARTNER KONUMLARI SONU ----");
  };

  // Türkçe karakterleri İngilizce karakterlere dönüştüren yardımcı fonksiyon
  const normalizeText = (text: string): string => {
    if (!text) return '';
    
    // Önce tüm metni küçük harfe çevir
    let normalizedText = text.toLowerCase();
    
    // Türkçe karakterleri İngilizce karakterlere dönüştür
    normalizedText = normalizedText
      .replace(/ı/g, 'i')
      .replace(/ç/g, 'c')
      .replace(/ş/g, 's')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ö/g, 'o')
      .replace(/i̇/g, 'i') // Noktalı i ile ilgili sorunları gider
      .replace(/,/g, ' ') // Virgülleri boşluğa çevir
      .replace(/\s+/g, ' ') // Birden fazla boşluğu tek boşluğa indir
      .trim();
    
    console.log(`Normalize edildi: "${text}" → "${normalizedText}"`);
    return normalizedText;
  };
  
  // Şehir ismi eşleştirmesi için akıllı kontrol
  const cityMatches = (location: string, searchText: string): boolean => {
    if (!location || !searchText) return false;
    
    // Metinleri normalize et
    const normalizedLocation = normalizeText(location);
    const normalizedSearch = normalizeText(searchText);
    
    console.log(`Kontrol ediliyor: '${normalizedSearch}' aranıyor, konum: '${normalizedLocation}'`);
    
    // İstanbul için özel koşullar
    // İstanbul için birçok yazım şekli ve kısaltma kontrolü
    if (normalizedSearch === 'ist' || normalizedSearch === 'istanbul' || 
        normalizedSearch === 'ista' || normalizedSearch === 'İstanbul' || 
        normalizedSearch === 'İst' || normalizedSearch === 'İsta' ||
        searchText.toUpperCase() === 'İST' || searchText.toUpperCase() === 'IST') {
      
      // istanbul kelimesi geçiyor mu - hem i hem de İ karakterleri için kontrol
      const containsIstanbul = normalizedLocation.includes('istanbul');
      
      if (containsIstanbul) {
        console.log(`✅ İSTANBUL EŞLEŞTİ: "${location}"`);
        return true;
      } else {
        console.log(`❌ İstanbul eşleşmedi: "${location}"`);
      }
    }
    
    // Ankara için özel durum
    if (normalizedSearch === 'ank' || normalizedSearch === 'ankara' || 
        normalizedSearch === 'Ankara' || normalizedSearch === 'Ank' ||
        searchText.toUpperCase() === 'ANK') {
      
      const containsAnkara = normalizedLocation.includes('ankara');
      
      if (containsAnkara) {
        console.log(`✅ ANKARA EŞLEŞTİ: "${location}"`);
        return true;
      }
    }
    
    // İzmir için özel durum
    if (normalizedSearch === 'izm' || normalizedSearch === 'izmir' || 
        normalizedSearch === 'İzmir' || normalizedSearch === 'İzm' ||
        searchText.toUpperCase() === 'İZM' || searchText.toUpperCase() === 'IZM') {
      
      const containsIzmir = normalizedLocation.includes('izmir');
      
      if (containsIzmir) {
        console.log(`✅ İZMİR EŞLEŞTİ: "${location}"`);
        return true;
      }
    }
    
    // Kelime bazlı eşleştirme - tam kelime olarak içeriyor mu kontrol et
    const words = normalizedLocation.split(' ');
    const hasWord = words.some(word => word === normalizedSearch || word.startsWith(normalizedSearch));
    
    if (hasWord) {
      console.log(`✅ KELİME BAZLI EŞLEŞME: '${searchText}' kelimesi burada: '${location}'`);
      return true;
    }
    
    // Normal substring kontrolü
    const hasSubstring = normalizedLocation.includes(normalizedSearch);
    if (hasSubstring) {
      console.log(`✅ ALT DİZE EŞLEŞME: '${searchText}' burada: '${location}'`);
      return true;
    }
    
    console.log(`❌ Hiçbir eşleşme bulunamadı: '${searchText}' için: '${location}'`);
    return false;
  };

  // Belirli değerlerle filtreleme yapan yardımcı fonksiyon
  const applyFiltersWithValues = (
    dansTuruValue: string,
    cinsiyetValue: string,
    seviyeValue: string, 
    konumValue: string,
    uygunSaatlerValue: string[]
  ): void => {
    setLoading(true);
    
    try {
      // Prompt for login after applying filters if not logged in
      if (!currentUser) {
        setShowLoginPrompt(true);
      }
      
      // Apply filters
      let filteredResults = [...allPartnerler];
      
      if (dansTuruValue) {
        // Seçilen dans türünü bulalım
        const selectedDanceStyle = danceStyles.find(style => style.value === dansTuruValue);
        
        if (selectedDanceStyle) {
          console.log("Seçilen dans stili bulundu:", selectedDanceStyle);
          
          // Filtreleme için kullanılacak değerler
          const selectedId = selectedDanceStyle.id;
          const selectedValue = selectedDanceStyle.value;
          const selectedLabel = selectedDanceStyle.label;
          
          console.log("Filtreleme değerleri - ID:", selectedId, "Value:", selectedValue, "Label:", selectedLabel);
          
          // Dans stillerini kontrol et
          filteredResults = filteredResults.filter(partner => {
            // Küçük harf ile karşılaştırma yapalım
            const partnerDansStilleri = partner.dans.map(dans => 
              typeof dans === 'string' ? dans.toLowerCase() : dans
            );
            
            // Seçilen dans stilinin farklı değerleriyle eşleşebilir
            const selectedLabelLower = selectedLabel.toLowerCase();
            const selectedValueLower = selectedValue.toLowerCase();
            
            const hasMatch = partnerDansStilleri.some(dans => {
              if (typeof dans !== 'string') return false;
              
              const dansLower = dans.toLowerCase();
              return dansLower === selectedLabelLower || 
                     dansLower === selectedValueLower || 
                     dansLower === selectedId.toLowerCase();
            });
            
            console.log(`Partner ${partner.ad} dans stilleri:`, partner.dans);
            console.log(`Partner ${partner.ad} dans stilinde '${selectedLabel}' var mı:`, hasMatch);
            
            return hasMatch;
          });
        } else {
          console.warn("Seçilen dans stili bulunamadı:", dansTuruValue);
        }
      }

      if (cinsiyetValue) {
        filteredResults = filteredResults.filter(partner => 
          partner.cinsiyet === cinsiyetValue
        );
      }

      if (seviyeValue) {
        filteredResults = filteredResults.filter(partner => 
          partner.seviye === seviyeValue
        );
      }

      if (konumValue && konumValue.trim() !== '') {
        // Çok basitleştirilmiş konum eşleştirme mantığı
        const normalizedKonum = normalizeText(konumValue);
        console.log("Arama için normalize edilmiş konum:", normalizedKonum);
        
        filteredResults = filteredResults.filter(partner => {
          if (!partner.konum) return false;
          
          const matches = cityMatches(partner.konum, konumValue);
          if (matches) {
            console.log(`Partner ${partner.ad}, Konum: ${partner.konum} - EŞLEŞME BULUNDU`);
          } else {
            console.log(`Partner ${partner.ad}, Konum: ${partner.konum} - Eşleşme bulunamadı`);
          }
          
          return matches;
        });
      }

      if (uygunSaatlerValue.length > 0) {
        filteredResults = filteredResults.filter(partner => 
          uygunSaatlerValue.some(saat => partner.saatler.includes(saat))
        );
      }

      console.log("Filtreleme sonrası partner sayısı:", filteredResults.length);
      
      // Eğer hiç partner bulunamadıysa ve konum filtresi kullanıldıysa, konumla ilgili uyarı ver
      if (filteredResults.length === 0 && konumValue && konumValue.trim() !== '') {
        console.warn(`"${konumValue}" konumu için hiç partner bulunamadı!`);
        console.log("Tüm partnerlerin konumları:");
        allPartnerler.forEach(p => console.log(`- ${p.ad}: ${p.konum}`));
      }
      
      setPartnerler(filteredResults);
      setLoading(false);
      setAramaTamamlandi(true);
    } catch (error) {
      console.error('Filtreleme sırasında hata oluştu:', error);
    }
  };

  // Mevcut state değerleriyle filtreleri uygulayan fonksiyon
  const applyFilters = (): void => {
    applyFiltersWithValues(dansTuru, cinsiyet, seviye, konum, uygunSaatler);
  };

  // Uygun saatleri işleme fonksiyonu
  const handleSaatChange = (saat: string): void => {
    const newSaatler = uygunSaatler.includes(saat) 
      ? uygunSaatler.filter(s => s !== saat) 
      : [...uygunSaatler, saat];
    
    setUygunSaatler(newSaatler);
    // Güncel değerlerle hemen filtreleme yapalım
    applyFiltersWithValues(dansTuru, cinsiyet, seviye, konum, newSaatler);
  };

  // Dans türü değiştiğinde filtreleri uygula
  const handleDansTuruChange = (value: string): void => {
    console.log("Dans türü değişti, yeni değer:", value);
    
    // Mevcut değer ile aynıysa ve boş değilse, filtreyi temizle
    if (value === dansTuru && value !== '') {
      console.log("Aynı dans türü tekrar seçildi, filtre sıfırlanıyor.");
      setDansTuru('');
      // Burada doğrudan boş değerle filtreleme yapalım
      applyFiltersWithValues('', cinsiyet, seviye, konum, uygunSaatler);
      return;
    }
    
    setDansTuru(value);
    // Güncel değerle hemen filtreleme yapalım
    applyFiltersWithValues(value, cinsiyet, seviye, konum, uygunSaatler);
  };

  // Cinsiyet değiştiğinde filtreleri uygula
  const handleCinsiyetChange = (value: string): void => {
    setCinsiyet(value);
    // Güncel değerle hemen filtreleme yapalım
    applyFiltersWithValues(dansTuru, value, seviye, konum, uygunSaatler);
  };

  // Seviye değiştiğinde filtreleri uygula
  const handleSeviyeChange = (value: string): void => {
    setSeviye(value);
    // Güncel değerle hemen filtreleme yapalım
    applyFiltersWithValues(dansTuru, cinsiyet, value, konum, uygunSaatler);
  };

  // Konum değiştiğinde filtreleri uygula
  const handleKonumChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newKonum = e.target.value;
    setKonum(newKonum);
    
    // Konum için debounce ekleyelim, kullanıcı yazarken sürekli filtreleme yapmasın
    if (newKonum.length > 2 || newKonum.length === 0) {
      // Güncel değerle hemen filtreleme yapalım
      applyFiltersWithValues(dansTuru, cinsiyet, seviye, newKonum, uygunSaatler);
    }
  };

  const resetFilters = () => {
    setDansTuru('');
    setCinsiyet('');
    setSeviye('');
    setKonum('');
    setUygunSaatler([]);
    setPartnerler(allPartnerler.slice(0, 12)); // Show top 12 again after reset
    setAramaTamamlandi(true);
  };

  // Kullanıcının partnere iletişim isteği göndermesini yönetir
  const handleContact = async (partner: Partner) => {
    // Kullanıcı giriş yapmamışsa
    if (!currentUser) {
      // Modal popup göster
      setShowLoginPrompt(true);
      return;
    }

    // İşlem sırasında yükleniyor durumunu aktifleştir
    setContactActionLoading(true);
    
    try {
      // Firebase'e iletişim talebini kaydet
      const contactRequestsRef = collection(db, 'contactRequests');
      
      // İletişim talebi verisini oluştur
      const contactRequestData = {
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL,
        receiverId: partner.id,
        receiverName: partner.ad,
        receiverPhoto: partner.foto,
        status: 'pending', // pending, accepted, rejected, cancelled
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Firebase'e kaydet
      const newContactRef = await addDoc(contactRequestsRef, contactRequestData);
      
      // Başarılı olunca durumu güncelle
      setContactStatus({
        partnerId: partner.id,
        sent: true,
        message: `${partner.ad} adlı partnere iletişim talebiniz gönderildi. Yanıt bekleyin.`,
        contactId: newContactRef.id
      });
      
      // LocalStorage'a kaydet - sayfa yenilendiğinde kaybolmaması için
      localStorage.setItem('contactStatus', JSON.stringify({
        partnerId: partner.id,
        sent: true,
        message: `${partner.ad} adlı partnere iletişim talebiniz gönderildi. Yanıt bekleyin.`,
        contactId: newContactRef.id,
        timestamp: new Date().getTime()
      }));
      
      // Toast bildirimini göster
      setToast({
        show: true,
        message: `${partner.ad} adlı partnere iletişim talebiniz gönderildi. Yanıt bekleyin.`,
        type: 'success'
      });
      
      // 5 saniye sonra toast'u kapat
      setTimeout(() => {
        setToast(null);
      }, 5000);
      
      console.log(`${partner.ad} adlı partnere iletişim talebi gönderildi!`);
    } catch (error) {
      console.error('İletişim talebi gönderilirken hata:', error);
      setToast({
        show: true,
        message: 'İletişim talebi gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
        type: 'error'
      });
    } finally {
      setContactActionLoading(false);
    }
  };

  // İletişim talebini iptal et
  const cancelContactRequest = async () => {
    if (!contactStatus || !contactStatus.contactId || !currentUser) return;
    
    // İşlem sırasında yükleniyor durumunu aktifleştir
    setContactActionLoading(true);
    
    try {
      // İlgili partner bilgisini bul
      const partner = partnerler.find(p => p.id === contactStatus.partnerId);
      const partnerName = partner ? partner.ad : 'Partner';
      
      // Firestore'dan iletişim talebini al
      const contactRef = doc(db, 'contactRequests', contactStatus.contactId);
      const contactSnap = await getDoc(contactRef);
      
      if (contactSnap.exists()) {
        // Talebin durumunu "cancelled" olarak güncelle (tamamen silmek yerine)
        await updateDoc(contactRef, {
          status: 'cancelled',
          updatedAt: serverTimestamp()
        });
        
        // ContactStatus durumunu temizle
        setContactStatus(null);
        
        // localStorage'dan da temizle
        localStorage.removeItem('contactStatus');
        
        // Başarı mesajı göster
        setToast({
          show: true,
          message: `${partnerName} adlı partnere gönderdiğiniz iletişim talebi iptal edildi.`,
          type: 'info'
        });
        
        // 5 saniye sonra toast'u kapat
        setTimeout(() => {
          setToast(null);
        }, 5000);
      } else {
        throw new Error('İletişim talebi bulunamadı');
      }
    } catch (error) {
      console.error('İletişim talebi iptal edilirken hata:', error);
      setToast({
        show: true,
        message: 'İletişim talebi iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.',
        type: 'error'
      });
    } finally {
      setContactActionLoading(false);
    }
  };

  // Toast bileşeni
  const Toast = () => {
    if (!toast || !toast.show) return null;
    
    const bgColorClass = toast.type === 'success' ? 'bg-green-500' : 
                          toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500';
                          
    return (
      <div className="fixed bottom-5 right-5 z-50 transform transition-all duration-300 ease-in-out">
        <div className={`${bgColorClass} text-white py-3 px-4 rounded-lg shadow-lg flex items-start max-w-md`}>
          {toast.type === 'success' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === 'error' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.type === 'info' && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="ml-auto text-white hover:text-gray-200 flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Replace the login prompt banner with a modal popup
  const LoginPromptModal = () => {
    if (!showLoginPrompt) return null;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowLoginPrompt(false)}></div>
          
          {/* Modal panel */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Üyelik Gerekli
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    İletişime geçmek için lütfen üye olun veya giriş yapın. Dans partnerlerinizle iletişime geçmek ve diğer özellikleri kullanabilmek için üyelik gereklidir.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-medium text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate('/signup');
                }}
              >
                Kayıt Ol
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate('/signin');
                }}
              >
                Giriş Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Partner kartı bileşeni - Modern tasarım
  const PartnerKarti: React.FC<PartnerKartiProps> = ({ partner }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full">
      {/* Profil fotoğrafı ve üst kısım */}
      <div className="relative h-64 overflow-hidden">
        {/* Profil fotoğrafı */}
        <img 
          src={partner.foto || PLACEHOLDER_PARTNER_IMAGE} 
          alt={partner.ad} 
          className="h-full w-full object-cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_PARTNER_IMAGE;
          }}
        />
        
        {/* Alt bilgiler için gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
          {/* İsim ve puan bilgisi */}
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-bold text-white">{partner.ad}</h2>
            {partner.puan && partner.puan > 0 && (
              <div className="flex items-center bg-white/90 px-2 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="ml-1 text-sm font-semibold">{partner.puan}</span>
              </div>
            )}
          </div>
          
          {/* Yaş ve cinsiyet bilgisi */}
          {(partner.yas > 0 || partner.cinsiyet !== 'Belirtilmemiş') && (
            <div className="flex items-center text-white/90 mb-1 text-sm">
              <span>
                {partner.yas > 0 ? `${partner.yas} yaşında` : ""} 
                {partner.yas > 0 && partner.cinsiyet !== 'Belirtilmemiş' ? '•' : ''} 
                {partner.cinsiyet !== 'Belirtilmemiş' ? partner.cinsiyet : ''}
              </span>
            </div>
          )}
          
          {/* Konum bilgisi */}
          {partner.konum !== 'Belirtilmemiş' && (
            <div className="flex items-center text-white/90 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{partner.konum}</span>
            </div>
          )}
        </div>
        
        {/* Seviye badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-full shadow-md">
            {partner.seviye}
          </span>
        </div>
        
        {/* Uyumlu badge */}
        {partner.relevanceScore && partner.relevanceScore > 50 && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 text-xs font-semibold bg-green-600 text-white rounded-full shadow-md flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Uyumlu
            </span>
          </div>
        )}
      </div>
      
      {/* Kart içeriği - alt kısım */}
      <div className="p-5 flex-grow flex flex-col">
        {/* Fiziksel özellikler */}
        {(partner.boy || partner.kilo) && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Fiziksel Özellikler</h3>
            <div className="flex flex-wrap gap-4">
              {partner.boy && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                  <span className="text-sm">{partner.boy} cm</span>
                </div>
              )}
              {partner.kilo && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                  <span className="text-sm">{partner.kilo} kg</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">Dans Stilleri</h3>
          <div className="flex flex-wrap gap-1">
            {partner.dans.length > 0 ? (
              partner.dans.map((dansTuru, index) => (
                <span 
                  key={index} 
                  className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
                >
                  {dansTuru}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">Belirtilmemiş</span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-medium text-gray-700 mb-2">Uygun Zamanlar</h3>
          <div className="flex flex-wrap gap-1">
            {partner.saatler.length > 0 ? (
              partner.saatler.map((saat, index) => (
                <span 
                  key={index}
                  className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                >
                  {saat}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">Belirtilmemiş</span>
            )}
          </div>
        </div>
        
        <div className="mt-auto">
          {contactStatus && contactStatus.partnerId === partner.id && contactStatus.sent ? (
            <div className="rounded-lg mb-4">
              <div className="p-3 bg-green-100 text-green-800 rounded-lg mb-2 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {contactStatus.message}
              </div>
              <button 
                className="w-full py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-300 flex items-center justify-center font-medium"
                onClick={cancelContactRequest}
                disabled={contactActionLoading}
              >
                {contactActionLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    İşlem yapılıyor...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    İletişim Talebini İptal Et
                  </>
                )}
              </button>
            </div>
          ) : (
            <button 
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors duration-300 flex items-center justify-center font-medium shadow-md"
              onClick={() => handleContact(partner)}
              disabled={contactActionLoading}
            >
              {contactActionLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  İşlem yapılıyor...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  İletişime Geç
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Render the login prompt modal */}
      <LoginPromptModal />
      
      {/* Toast bildirim */}
      <Toast />
      
      {/* Başlık ve filtreler */}
      <div className="mb-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 inline-block relative bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Dans Partneri Bul
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stilinize ve seviyenize uygun dans partnerleri bulun. Beraber dans etmek, teknik geliştirmek veya dans etkinliklerine katılmak için harika bir yol!
          </p>
        </motion.div>
        
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <button 
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {isFilterVisible ? 'Filtreleri Gizle' : 'Filtreler'}
          </button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter panel - Responsive */}
          <div className={`lg:w-1/4 ${isFilterVisible || window.innerWidth >= 1024 ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Partner Filtrele</h2>
                <button 
                  onClick={resetFilters}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sıfırla
                </button>
              </div>
              
              <form onSubmit={partnerAra} className="space-y-5">
                {loadingStyles ? (
                  <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
                    <span className="text-gray-600 text-sm">Dans stilleri yükleniyor...</span>
                  </div>
                ) : (
                  <CustomSelect 
                    label="Dans Türü"
                    options={danceStyles}
                    value={dansTuru}
                    onChange={handleDansTuruChange}
                    placeholder="Tüm dans türleri"
                  />
                )}
                
                <CustomSelect 
                  label="Cinsiyet"
                  options={cinsiyetler}
                  value={cinsiyet}
                  onChange={handleCinsiyetChange}
                  placeholder="Hepsi"
                />
                
                <CustomSelect 
                  label="Seviye"
                  options={seviyeler}
                  value={seviye}
                  onChange={handleSeviyeChange}
                  placeholder="Tüm seviyeler"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konum
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={konum}
                      onChange={handleKonumChange}
                      placeholder="Şehir, semt..."
                      className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uygun Saatler
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Sabah', 'Öğlen', 'Akşam', 'Hafta Sonu'].map(saat => (
                      <button
                        key={saat}
                        type="button"
                        onClick={() => handleSaatChange(saat)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          uygunSaatler.includes(saat)
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {saat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md flex items-center justify-center font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Aranıyor...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Partner Ara
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results section */}
          <div className="lg:w-3/4">
            {initialLoading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-lg text-gray-600">Partnerler yükleniyor...</span>
              </div>
            ) : (
              <>
                {aramaTamamlandi && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-800">
                        {partnerler.length > 0 
                          ? `${partnerler.length} Dans Partneri Bulundu` 
                          : "Uygun dans partneri bulunamadı"}
                      </h2>
                      <div className="text-sm text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Son güncelleme: {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {partnerler.map(partner => (
                    <PartnerKarti key={partner.id} partner={partner} />
                  ))}
                </div>
                
                {/* Empty state */}
                {aramaTamamlandi && partnerler.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Partner bulunamadı</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Seçtiğiniz kriterlere uygun dans partneri şu anda mevcut değil. Filtreleri değiştirerek tekrar deneyebilirsiniz.
                    </p>
                    <button 
                      onClick={resetFilters}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
                    >
                      Tüm Partnerleri Göster
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartnerMatching;