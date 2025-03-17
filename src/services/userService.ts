import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, DanceLevel, UserWithProfile } from '../types';

/**
 * Fetch user profile data from Firestore
 */
export const fetchUserProfile = async (userId: string): Promise<UserWithProfile> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    
    if (!userSnapshot.exists()) {
      throw new Error('User profile not found');
    }
    
    return userSnapshot.data() as UserWithProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Utility function to resize an image to a specified maximum width/height
 * Also applies compression to reduce file size
 */
export const resizeImageFromBase64 = (
  base64Data: string,
  maxWidth: number = 300,
  maxHeight: number = 300,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
      }
      
      // Create canvas with new dimensions
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to WebP if supported for better compression
      const isWebPSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      // Get base64 data URL from canvas
      const resizedBase64 = isWebPSupported 
        ? canvas.toDataURL('image/webp', quality) 
        : canvas.toDataURL('image/jpeg', quality);
        
      resolve(resizedBase64);
    };
    
    img.onerror = (error) => {
      reject(error);
    };
    
    img.src = base64Data;
  });
};

/**
 * Updates user profile information in both Firebase Auth and Firestore
 */
export const updateUserProfile = async (
  userId: string,
  profileData: {
    displayName?: string;
    bio?: string;
    danceStyles?: string[];
    level?: DanceLevel;
    phoneNumber?: string;
  }
): Promise<void> => {
  try {
    // Update Auth profile if displayName is provided
    if (profileData.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
      });
    }

    // Update Firestore document with all provided fields
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...profileData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Updates profile picture directly in Firestore without using Firebase Storage
 * This is a workaround for base64 storage directly in Firestore
 * Note: Does not update Auth profile due to URL length limitations
 */
export const updateProfilePhotoDirectly = async (
  userId: string,
  base64Data: string
): Promise<string> => {
  try {
    // Resize the image to reduce its size
    const resizedImage = await resizeImageFromBase64(base64Data, 300, 300, 0.75);
    
    // Only update Firestore document with base64 image data
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      photoURL: resizedImage,
      updatedAt: Timestamp.now(),
    });
    
    // Skip updating Auth profile because base64 images are typically too large
    // Firebase Auth has a limit on the length of profile photo URLs
    
    return resizedImage;
  } catch (error) {
    console.error('Error updating profile photo directly:', error);
    throw error;
  }
}; 