// src/store/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  phoneVerificationId: string | null;
  userRole: UserRole | null;
  isRegistrationComplete: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  phoneVerificationId: null,
  userRole: null,
  isRegistrationComplete: false
};

export const signInWithGoogle = createAsyncThunk(
  'auth/signInWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        // User exists, return userData
        return userSnapshot.data() as User;
      } else {
        // New user, create basic profile
        const newUser: Partial<User> = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          verified: false,
          role: 'student', // Default role
          phoneVerified: false
        };
        
        await setDoc(userDoc, {
          ...newUser,
          createdAt: serverTimestamp()
        });
        
        return newUser as User;
      }
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const signInWithFacebook = createAsyncThunk(
  'auth/signInWithFacebook',
  async (_, { rejectWithValue }) => {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        // User exists, return userData
        return userSnapshot.data() as User;
      } else {
        // New user, create basic profile
        const newUser: Partial<User> = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          verified: false,
          role: 'student', // Default role
          phoneVerified: false
        };
        
        await setDoc(userDoc, {
          ...newUser,
          createdAt: serverTimestamp()
        });
        
        return newUser as User;
      }
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const sendPhoneVerification = createAsyncThunk(
  'auth/sendPhoneVerification',
  async (phoneNumber: string, { rejectWithValue }) => {
    try {
      // Create a new RecaptchaVerifier instance
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
      
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier
      );
      
      return verificationId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const verifyPhoneCode = createAsyncThunk(
  'auth/verifyPhoneCode',
  async ({ verificationId, code, userId }: { verificationId: string, code: string, userId: string }, { rejectWithValue }) => {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      
      // Update the user document to mark phone as verified
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, {
        phoneVerified: true
      });
      
      return true;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'auth/updateUserRole',
  async ({ userId, role }: { userId: string, role: UserRole }, { rejectWithValue }) => {
    try {
      const userDoc = doc(db, 'users', userId);
      await updateDoc(userDoc, { role });
      return role;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setUserRole: (state, action: PayloadAction<UserRole>) => {
      state.userRole = action.payload;
    },
    setRegistrationComplete: (state, action: PayloadAction<boolean>) => {
      state.isRegistrationComplete = action.payload;
    },
    clearPhoneVerificationId: (state) => {
      state.phoneVerificationId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(signInWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(signInWithFacebook.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithFacebook.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signInWithFacebook.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendPhoneVerification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendPhoneVerification.fulfilled, (state, action) => {
        state.loading = false;
        state.phoneVerificationId = action.payload;
      })
      .addCase(sendPhoneVerification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyPhoneCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPhoneCode.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.phoneVerified = true;
        }
      })
      .addCase(verifyPhoneCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.userRole = action.payload;
        if (state.user) {
          state.user.role = action.payload;
        }
      });
  }
});

export const { 
  setUser, 
  setLoading, 
  setError, 
  setUserRole, 
  setRegistrationComplete,
  clearPhoneVerificationId
} = authSlice.actions;

export default authSlice.reducer;