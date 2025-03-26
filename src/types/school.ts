export interface DanceSchool {
  id: string;
  displayName: string;
  name?: string;
  description: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  website?: string;
  photoURL?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  danceStyles?: string[];
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
  courseCount?: number;
  rating?: number;
} 