// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase konfigürasyonu
// NOT: Gerçek uygulamada bu bilgiler çevresel değişkenlerden gelmelidir
const firebaseConfig = {
  apiKey: "AIzaSyABCdefGHIjklMNOpqrSTUvwxyz12345678",
  authDomain: "dans-platformu.firebaseapp.com",
  projectId: "dans-platformu",
  storageBucket: "dans-platformu.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Supabase için yapılandırma
// eğer ilerleyen aşamalarda Supabase'e geçilirse kullanılabilir
/*
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://example.supabase.co';
const supabaseKey = 'public-anon-key';
export const supabase = createClient(supabaseUrl, supabaseKey);
*/

export default app;