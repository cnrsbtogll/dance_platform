import React, { useState, useEffect, Fragment, ChangeEvent, FormEvent } from 'react';
import { Transition } from '@headlessui/react';
import { Link, useNavigate } from 'react-router-dom';
import CustomSelect from '../../common/components/ui/CustomSelect';
import { collection, getDocs, query, orderBy, where, limit, DocumentData, addDoc, deleteDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../api/firebase/firebase';
import { useAuth } from '../../common/hooks/useAuth'; 
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

function PartnerSearchPage(): JSX.Element {
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
  const [contactStatuses, setContactStatuses] = useState<{partnerId: string, sent: boolean, message: string, contactId: string}[]>([]);
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
        const data = doc.data();
        const style: DanceStyle = {
          id: doc.id,
          label: data.label || '',
          value: data.value || data.label || ''
        };
        styles.push(style);
        
        // Eşleştirme haritası için id, label ve value değerlerini kullan
        mapping[style.id.toLowerCase()] = style;
        mapping[style.label.toLowerCase()] = style;
        mapping[style.value.toLowerCase()] = style;
      });
      
      setDanceStyles(styles);
      setStyleMapping(mapping);
      console.log("Dans stilleri yüklendi:", styles.length);
      console.log("Dans stilleri mapping:", mapping);
    } catch (error) {
      console.error("Dans stilleri yüklenirken hata oluştu:", error);
    } finally {
      setLoadingStyles(false);
    }
  };

  // Tüm kullanıcıları getir
  const fetchAllUsers = async () => {
    setInitialLoading(true);
    
    try {
      // Eğer danceStyles hazır değilse bekle
      if (danceStyles.length === 0) {
        console.log("Dans stilleri henüz yüklenmedi, fetchAllUsers bekletiliyor...");
        return;
      }
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, 
        where('role', 'array-contains-any', ['user', 'student']),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const querySnapshot = await getDocs(q);
      
      const users: FirestoreUser[] = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          displayName: userData.displayName || '',
          photoURL: userData.photoURL,
          level: userData.level,
          danceStyles: userData.danceStyles || [],
          city: userData.city,
          availableTimes: userData.availableTimes || [],
          gender: userData.gender,
          age: userData.age,
          rating: userData.rating,
          createdAt: userData.createdAt,
          role: Array.isArray(userData.role) ? userData.role.join(',') : userData.role,
          height: userData.height,
          weight: userData.weight
        });
      });
      
      console.log("Kullanıcılar yüklendi:", users.length);
      
      // Mevcut kullanıcıyı belirleyelim
      let currentUserData: FirestoreUser | null = null;
      
      if (currentUser && currentUser.uid) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          currentUserData = {
            id: currentUser.uid,
            displayName: userData.displayName || currentUser.displayName || '',
            photoURL: userData.photoURL || currentUser.photoURL,
            level: userData.level,
            danceStyles: userData.danceStyles || [],
            city: userData.city,
            availableTimes: userData.availableTimes || [],
            gender: userData.gender,
            age: userData.age,
            rating: userData.rating,
            createdAt: userData.createdAt,
            role: Array.isArray(userData.role) ? userData.role.join(',') : userData.role,
            height: userData.height,
            weight: userData.weight
          };
          console.log("Mevcut kullanıcı verisi:", currentUserData);
        }
      }
      
      // Partner'ları oluştur
      const partners = users
        .filter(user => user.id !== (currentUser?.uid || '')) // Exclude current user
        .map(user => {
          const partner = convertUserToPartner(user);
          // Relevance score hesapla
          partner.relevanceScore = calculateRelevanceScore(partner, currentUserData);
          return partner;
        })
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)); // Sort by relevance
      
      setAllPartnerler(partners);
      setPartnerler(partners);
      
      // Eğer partnerler yüklendiyse, kullanıcının iletişim durumlarını kontrol et
      if (currentUser && partners.length > 0) {
        checkContactStatuses(partners.map(p => p.id));
      }
      
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata oluştu:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Bileşen yüklendiğinde temel veri hazırlığı
  useEffect(() => {
    fetchAndSetDanceStyles();
  }, []);

  // Dans stilleri yüklendiğinde kullanıcıları çek
  useEffect(() => {
    if (danceStyles.length > 0) {
      fetchAllUsers();
    }
  }, [danceStyles, currentUser]);

  // ... diğer fonksiyonlar ve komponentler ...

  // Örnek olarak, sadece işlevselliği göstermek amacıyla bazı fonksiyonlar burada kısaltılabilir
  // Gerçek uygulamada tüm fonksiyonlar ve render kodu dahil edilmelidir

  // PartnerKarti bileşeni
  const PartnerKarti: React.FC<PartnerKartiProps> = ({ partner }) => {
    // Partner kartı implementasyonu
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="p-4">
          <h3 className="text-lg font-bold">{partner.ad}</h3>
          <p>Yaş: {partner.yas}</p>
          <p>Dans Türleri: {partner.dans.join(', ')}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dans Partneri Bul</h1>
      
      {/* Filtreleme formu */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Filtreler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dans Türü</label>
            <CustomSelect 
              options={danceStyles.map(style => ({ label: style.label, value: style.value }))} 
              value={dansTuru}
              onChange={(value) => setDansTuru(value)}
              placeholder="Dans türü seçin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
            <CustomSelect 
              options={[
                { label: 'Kadın', value: 'Kadın' },
                { label: 'Erkek', value: 'Erkek' }
              ]} 
              value={cinsiyet}
              onChange={(value) => setCinsiyet(value)}
              placeholder="Cinsiyet seçin"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seviye</label>
            <CustomSelect 
              options={[
                { label: 'Başlangıç', value: 'Başlangıç' },
                { label: 'Orta', value: 'Orta' },
                { label: 'İleri', value: 'İleri' },
                { label: 'Profesyonel', value: 'Profesyonel' }
              ]} 
              value={seviye}
              onChange={(value) => setSeviye(value)}
              placeholder="Seviye seçin"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <button 
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
            onClick={() => {
              // Filtreleri uygula
              console.log("Filtreler uygulanıyor...");
            }}
          >
            Filtrele
          </button>
          
          <button 
            className="ml-2 text-indigo-600 hover:text-indigo-800"
            onClick={() => {
              // Filtreleri temizle
              setDansTuru('');
              setCinsiyet('');
              setSeviye('');
            }}
          >
            Temizle
          </button>
        </div>
      </div>
      
      {/* Partner listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialLoading ? (
          <div className="col-span-3 text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Partnerler yükleniyor...</p>
          </div>
        ) : partnerler.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Uygun partner bulunamadı. Lütfen filtreleri değiştirip tekrar deneyin.</p>
          </div>
        ) : (
          partnerler.map(partner => (
            <PartnerKarti key={partner.id} partner={partner} />
          ))
        )}
      </div>
    </div>
  );
}

export default PartnerSearchPage2; 