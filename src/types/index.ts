// src/types/index.ts

export type DanceStyle = 'salsa' | 'bachata' | 'kizomba' | 'other';

export type DanceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export type UserRole = 'student' | 'instructor' | 'school' | 'school_admin' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole[];
  danceStyles?: DanceStyle[];
  level?: DanceLevel;
  createdAt: string;
  updatedAt: string;
  schoolId?: string;  // Kullanıcının bağlı olduğu okul ID'si
  instructorId?: string; // Öğrencinin bağlı olduğu eğitmen ID'si
}

export interface UserWithProfile extends User {
  bio?: string;
}

export interface Instructor {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  role: string[];
  specialties: string[];
  experience: string;
  bio: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  danceStyle: DanceStyle;
  level: DanceLevel;
  criteria: string;
  requiredClasses?: number;
  requiredEvents?: number;
  iconUrl?: string;
}

export interface PartnerPreference {
  userId: string;
  danceStyles: DanceStyle[];
  level: DanceLevel;
  location: {
    latitude: number;
    longitude: number;
  };
  availability: Record<string, { start: string; end: string }[]>;
  ageRange: {
    min: number;
    max: number;
  };
  gender: 'male' | 'female' | 'any';
}

export interface PartnerMatch {
  id: string;
  user1Id: string;
  user2Id: string;
  matchScore: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface DanceClass {
  id: string;
  name: string;
  description: string;
  danceStyle: DanceStyle;
  level: DanceLevel;
  instructorId: string;
  instructorName: string;
  schoolId?: string;
  schoolName?: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: number;
    longitude: number;
  };
  price: number;
  currency: 'TRY' | 'USD' | 'EUR';
  duration: number; // Minutes
  maxParticipants: number;
  currentParticipants: number;
  date: Date | any; // FireStore Timestamp için esneklik
  time: string;
  recurring: boolean;
  daysOfWeek?: string[];
  imageUrl?: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  status?: 'active' | 'cancelled' | 'completed' | 'draft';
  tags?: string[]; // Ek etiketler
  highlights?: string[]; // Öne çıkan bilgiler
  // İletişim bilgileri
  phoneNumber?: string;
  email?: string;
}

export interface DanceSchool {
  id: string;
  name: string;
  description?: string;
  aciklama?: string; // Türkçe alternatif - description
  logo?: string;
  gorsel?: string; // Türkçe alternatif - logo
  images?: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  konum?: string; // Türkçe alternatif - city
  ulke?: string; // Türkçe alternatif - country
  contactInfo?: {
    phone: string;
    email: string;
    website?: string;
  };
  iletisim?: string; // Türkçe alternatif - email
  telefon?: string; // Türkçe alternatif - phone
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
  danceStyles?: DanceStyle[];
  instructors?: string[]; // Instructor IDs
  rating?: number;
  reviewCount?: number;
  established?: number; // Kuruluş yılı
  adminId?: string; // Okul yöneticisi kullanıcı ID'si
  userId?: string; // Alternatif yönetici ID alanı
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  status?: 'active' | 'pending' | 'inactive';
  features?: string[]; // Okuldaki imkanlar (ör: "Ücretsiz Park", "Duş", "Soyunma Odası")
  businessHours?: Record<string, { open: string; close: string; }>;
}

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  danceStyle: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  capacity: number;
  price: number;
  schedule: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  location: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}