// src/types/index.ts

export type DanceStyle = 'salsa' | 'bachata' | 'kizomba' | 'other';

export type DanceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export type UserRole = 'student' | 'instructor' | 'school' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole;
  danceStyles?: DanceStyle[];
  level?: DanceLevel;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserWithProfile extends User {
  bio?: string;
}

export interface Instructor {
  id: string;
  userId: string;
  biography: string;
  specialties: DanceStyle[];
  experience: number; // Years
  certifications: string[];
  socialMediaLinks: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
  };
  rating: number;
  reviewCount: number;
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
  currency: string;
  duration: number; // Minutes
  maxParticipants: number;
  currentParticipants: number;
  date: Date;
  time: string;
  recurring: boolean;
  daysOfWeek?: string[];
  imageUrl?: string;
}