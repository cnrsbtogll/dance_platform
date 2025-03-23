import { Timestamp } from 'firebase/firestore';
import { DanceLevel, UserRole } from '../../../../types';

// Ortak kullanıcı alanları
export interface BaseUserData {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  photoURL: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Öğrenci özellikleri
export interface StudentData extends BaseUserData {
  level: DanceLevel;
  instructorId?: string;
  instructorName?: string;
  schoolId?: string;
  schoolName?: string;
  danceStyles?: string[];
}

// Eğitmen özellikleri
export interface InstructorData extends BaseUserData {
  level: DanceLevel;
  specialties?: string[];
  experience?: number;
  bio?: string;
  schoolId?: string;
  schoolName?: string;
  availability?: {
    days: string[];
    hours: string[];
  };
}

// Okul özellikleri
export interface SchoolData extends BaseUserData {
  address?: string;
  city?: string;
  district?: string;
  description?: string;
  facilities?: string[];
  contactPerson?: string;
  website?: string;
}

// Base form data interface
export interface BaseFormData {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  photoURL: string;
  role: UserRole;
}

// Student form data
export interface StudentFormData extends BaseFormData {
  level: DanceLevel;
  instructorId: string;
  schoolId: string;
  danceStyles?: string[];
}

// Instructor form data
export interface InstructorFormData extends BaseFormData {
  level: DanceLevel;
  specialties: string[];
  experience: number;
  bio: string;
  schoolId: string;
  availability: {
    days: string[];
    hours: string[];
  };
}

// School form data
export interface SchoolFormData extends BaseFormData {
  address: string;
  city: string;
  district: string;
  description: string;
  facilities: string[];
  contactPerson: string;
  website: string;
}

// Form errors
export interface FormErrors {
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  [key: string]: string | undefined;
}

// Firebase user type
export interface FirebaseUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber: string;
  role: UserRole | UserRole[];
  level: DanceLevel;
  instructorId?: string;
  instructorName?: string;
  schoolId?: string;
  schoolName?: string;
  danceStyles?: string[];
  specialties?: string[];
  experience?: number;
  bio?: string;
  availability?: {
    days: string[];
    hours: string[];
  };
  address?: string;
  city?: string;
  district?: string;
  description?: string;
  facilities?: string[];
  contactPerson?: string;
  website?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
} 