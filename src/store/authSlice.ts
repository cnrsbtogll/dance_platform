// src/store/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  UserCredential
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../api/firebase/firebase';
import { User, UserRole } from '../types';

// Redux Toolkit için tip tanımlarını ekleyin
type AsyncThunkConfig = {
  rejectValue: string;
};

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

// User tipinin özelliklerini kontrol edelim ve genişletelim
type ExtendedUser = User & {
  phoneVerified?: boolean;
};

export const signInWithGoogle = createAsyncThunk<
  ExtendedUser,
  void,
  AsyncThunkConfig
>(
  'auth/signInWithGoogle',
  async (_: void, { rejectWithValue }) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        // User exists, return userData
        return userSnapshot.data() as ExtendedUser;
      } else {
        // New user, create basic profile
        const newUser: Partial<ExtendedUser> = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'student', // Default role
          phoneVerified: false
        };
        
        await setDoc(userDoc, {
          ...newUser,
          createdAt: serverTimestamp()
        });
        
        return newUser as ExtendedUser;
      }
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const signInWithFacebook = createAsyncThunk<
  ExtendedUser,
  void,
  AsyncThunkConfig
>(
  'auth/signInWithFacebook',
  async (_: void, { rejectWithValue }) => {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      
      if (userSnapshot.exists()) {
        // User exists, return userData
        return userSnapshot.data() as ExtendedUser;
      } else {
        // New user, create basic profile
        const newUser: Partial<ExtendedUser> = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'student', // Default role
          phoneVerified: false
        };
        
        await setDoc(userDoc, {
          ...newUser,
          createdAt: serverTimestamp()
        });
        
        return newUser as ExtendedUser;
      }
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const sendPhoneVerification = createAsyncThunk<
  string,
  string,
  AsyncThunkConfig
>(
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

interface VerifyPhoneCodeParams {
  verificationId: string;
  code: string;
  userId: string;
}

export const verifyPhoneCode = createAsyncThunk<
  boolean,
  VerifyPhoneCodeParams,
  AsyncThunkConfig
>(
  'auth/verifyPhoneCode',
  async ({ verificationId, code, userId }: VerifyPhoneCodeParams, { rejectWithValue }) => {
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

interface UpdateUserRoleParams {
  userId: string;
  role: UserRole;
}

export const updateUserRole = createAsyncThunk<
  UserRole,
  UpdateUserRoleParams,
  AsyncThunkConfig
>(
  'auth/updateUserRole',
  async ({ userId, role }: UpdateUserRoleParams, { rejectWithValue }) => {
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
    setUser: (state: AuthState, action: PayloadAction<ExtendedUser | null>) => {
      state.user = action.payload;
    },
    setLoading: (state: AuthState, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state: AuthState, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setUserRole: (state: AuthState, action: PayloadAction<UserRole>) => {
      state.userRole = action.payload;
    },
    setRegistrationComplete: (state: AuthState, action: PayloadAction<boolean>) => {
      state.isRegistrationComplete = action.payload;
    },
    clearPhoneVerificationId: (state: AuthState) => {
      state.phoneVerificationId = null;
    }
  },
  extraReducers: (builder: ActionReducerMapBuilder<AuthState>) => {
    builder
      .addCase(signInWithGoogle.pending, (state: AuthState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state: AuthState, action: PayloadAction<ExtendedUser>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signInWithGoogle.rejected, (state: AuthState, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Google ile giriş başarısız oldu';
      })
      .addCase(signInWithFacebook.pending, (state: AuthState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInWithFacebook.fulfilled, (state: AuthState, action: PayloadAction<ExtendedUser>) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(signInWithFacebook.rejected, (state: AuthState, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Facebook ile giriş başarısız oldu';
      })
      .addCase(sendPhoneVerification.pending, (state: AuthState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendPhoneVerification.fulfilled, (state: AuthState, action: PayloadAction<string>) => {
        state.loading = false;
        state.phoneVerificationId = action.payload;
      })
      .addCase(sendPhoneVerification.rejected, (state: AuthState, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Telefon doğrulama kodu gönderme başarısız oldu';
      })
      .addCase(verifyPhoneCode.pending, (state: AuthState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPhoneCode.fulfilled, (state: AuthState, action: PayloadAction<boolean>) => {
        state.loading = false;
        if (state.user) {
          (state.user as ExtendedUser).phoneVerified = true;
        }
      })
      .addCase(verifyPhoneCode.rejected, (state: AuthState, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Telefon doğrulama kodu onaylama başarısız oldu';
      })
      .addCase(updateUserRole.fulfilled, (state: AuthState, action: PayloadAction<UserRole>) => {
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