// src/scripts/seedUsers.js
import { 
  doc, 
  collection,
  setDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Sample data for creating users
const sampleUsers = [
  {
    displayName: "Ayla Yılmaz",
    email: "ayla.yilmaz@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/1.jpg",
    role: "student",
    gender: "Kadın",
    age: 24,
    city: "İstanbul, Kadıköy",
    level: "beginner",
    danceStyles: ["salsa", "bachata"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 165,
    weight: 55,
    rating: 4.2
  },
  {
    displayName: "Mehmet Kaya",
    email: "mehmet.kaya@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/2.jpg",
    role: "student",
    gender: "Erkek",
    age: 29,
    city: "İstanbul, Beşiktaş",
    level: "intermediate",
    danceStyles: ["tango", "vals"],
    availableTimes: ["Akşam"],
    height: 180,
    weight: 78,
    rating: 4.5
  },
  {
    displayName: "Zeynep Demir",
    email: "zeynep.demir@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/3.jpg",
    role: "student",
    gender: "Kadın",
    age: 22,
    city: "İstanbul, Beşiktaş",
    level: "beginner",
    danceStyles: ["hiphop", "modern-dans"],
    availableTimes: ["Öğlen", "Hafta Sonu"],
    height: 162,
    weight: 53,
    rating: 4.0
  },
  {
    displayName: "Burak Yıldız",
    email: "burak.yildiz@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/4.jpg",
    role: "student",
    gender: "Erkek",
    age: 31,
    city: "Ankara, Çankaya",
    level: "intermediate",
    danceStyles: ["salsa", "bachata"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 185,
    weight: 82,
    rating: 4.7
  },
  {
    displayName: "Ayşe Öztürk",
    email: "ayse.ozturk@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/5.jpg",
    role: "student",
    gender: "Kadın",
    age: 26,
    city: "İzmir, Karşıyaka",
    level: "beginner",
    danceStyles: ["flamenko"],
    availableTimes: ["Hafta Sonu"],
    height: 168,
    weight: 57,
    rating: 3.9
  },
  {
    displayName: "Emre Çelik",
    email: "emre.celik@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/6.jpg",
    role: "student",
    gender: "Erkek",
    age: 27,
    city: "İstanbul, Şişli",
    level: "advanced",
    danceStyles: ["salsa", "bachata", "kizomba"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 178,
    weight: 75,
    rating: 4.8
  },
  {
    displayName: "Selin Aksoy",
    email: "selin.aksoy@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/7.jpg",
    role: "student",
    gender: "Kadın",
    age: 23,
    city: "İstanbul, Üsküdar",
    level: "intermediate",
    danceStyles: ["bale", "modern-dans"],
    availableTimes: ["Sabah", "Öğlen"],
    height: 170,
    weight: 56,
    rating: 4.3
  },
  {
    displayName: "Okan Koç",
    email: "okan.koc@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/8.jpg",
    role: "student",
    gender: "Erkek",
    age: 32,
    city: "Bursa, Nilüfer",
    level: "beginner",
    danceStyles: ["tango"],
    availableTimes: ["Hafta Sonu"],
    height: 182,
    weight: 85,
    rating: 4.0
  },
  {
    displayName: "Elif Şahin",
    email: "elif.sahin@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/9.jpg",
    role: "student",
    gender: "Kadın",
    age: 25,
    city: "Antalya, Muratpaşa",
    level: "intermediate",
    danceStyles: ["salsa", "bachata"],
    availableTimes: ["Akşam"],
    height: 165,
    weight: 54,
    rating: 4.4
  },
  {
    displayName: "Can Özdemir",
    email: "can.ozdemir@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/10.jpg",
    role: "student",
    gender: "Erkek",
    age: 28,
    city: "İzmir, Bornova",
    level: "advanced",
    danceStyles: ["vals", "tango"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 183,
    weight: 80,
    rating: 4.6
  },
  {
    displayName: "Deniz Arslan",
    email: "deniz.arslan@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/11.jpg",
    role: "student",
    gender: "Kadın",
    age: 27,
    city: "İstanbul, Maltepe",
    level: "professional",
    danceStyles: ["salsa", "bachata", "kizomba"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 172,
    weight: 58,
    rating: 4.9
  },
  {
    displayName: "Berk Aydın",
    email: "berk.aydin@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/12.jpg",
    role: "student",
    gender: "Erkek",
    age: 30,
    city: "Eskişehir, Tepebaşı",
    level: "intermediate",
    danceStyles: ["hiphop", "breakdance"],
    availableTimes: ["Öğlen", "Akşam"],
    height: 178,
    weight: 76,
    rating: 4.2
  },
  {
    displayName: "Ecem Çetin",
    email: "ecem.cetin@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/13.jpg",
    role: "student",
    gender: "Kadın",
    age: 24,
    city: "Ankara, Kızılay",
    level: "beginner",
    danceStyles: ["jazz", "modern-dans"],
    availableTimes: ["Sabah", "Öğlen"],
    height: 167,
    weight: 55,
    rating: 4.1
  },
  {
    displayName: "Serkan Kara",
    email: "serkan.kara@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/14.jpg",
    role: "student",
    gender: "Erkek",
    age: 33,
    city: "İstanbul, Beylikdüzü",
    level: "intermediate",
    danceStyles: ["salsa", "tango"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 186,
    weight: 88,
    rating: 4.3
  },
  {
    displayName: "Melis Yıldırım",
    email: "melis.yildirim@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/15.jpg",
    role: "student",
    gender: "Kadın",
    age: 26,
    city: "İstanbul, Ataşehir",
    level: "advanced",
    danceStyles: ["salsa", "bachata", "kizomba"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 169,
    weight: 56,
    rating: 4.7
  },
  {
    displayName: "Tolga Demir",
    email: "tolga.demir@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/16.jpg",
    role: "student",
    gender: "Erkek",
    age: 29,
    city: "İzmir, Konak",
    level: "beginner",
    danceStyles: ["salsa"],
    availableTimes: ["Hafta Sonu"],
    height: 180,
    weight: 79,
    rating: 3.8
  },
  {
    displayName: "İrem Güneş",
    email: "irem.gunes@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/17.jpg",
    role: "student",
    gender: "Kadın",
    age: 23,
    city: "Ankara, Çankaya",
    level: "intermediate",
    danceStyles: ["bale", "modern-dans"],
    availableTimes: ["Sabah", "Öğlen"],
    height: 166,
    weight: 53,
    rating: 4.5
  },
  {
    displayName: "Yiğit Öztürk",
    email: "yigit.ozturk@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/18.jpg",
    role: "student",
    gender: "Erkek",
    age: 31,
    city: "İstanbul, Bahçelievler",
    level: "advanced",
    danceStyles: ["hiphop", "breakdance"],
    availableTimes: ["Akşam"],
    height: 181,
    weight: 83,
    rating: 4.6
  },
  {
    displayName: "Ceyda Yılmaz",
    email: "ceyda.yilmaz@example.com",
    photoURL: "https://randomuser.me/api/portraits/women/19.jpg",
    role: "student",
    gender: "Kadın",
    age: 25,
    city: "Antalya, Konyaaltı",
    level: "professional",
    danceStyles: ["salsa", "bachata", "kizomba", "tango"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 171,
    weight: 57,
    rating: 4.9
  },
  {
    displayName: "Mert Kılıç",
    email: "mert.kilic@example.com",
    photoURL: "https://randomuser.me/api/portraits/men/20.jpg",
    role: "student",
    gender: "Erkek",
    age: 28,
    city: "İstanbul, Sarıyer",
    level: "intermediate",
    danceStyles: ["salsa", "bachata"],
    availableTimes: ["Akşam", "Hafta Sonu"],
    height: 179,
    weight: 77,
    rating: 4.4
  }
];

// Function to seed users to Firestore
async function seedUsers() {
  console.log('Starting to seed users...');
  
  try {
    for (const user of sampleUsers) {
      // Generate a unique ID for the user
      const userId = doc(collection(db, 'users')).id;
      
      // Add timestamp
      const userData = {
        ...user,
        id: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add the user to Firestore
      await setDoc(doc(db, 'users', userId), userData);
      console.log(`Added user: ${user.displayName}`);
    }
    
    console.log('Successfully seeded all users!');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

// Call the function to seed users
seedUsers();

// To run this script, use: node src/scripts/seedUsers.js
// Make sure you have the proper Firebase credentials set up 