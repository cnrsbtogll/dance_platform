// src/components/partners/PartnerMatching.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PartnerPreference, User } from '../../types';

const PartnerMatching: React.FC = () => {
  const [preferences, setPreferences] = useState<PartnerPreference>({
    userId: 'current-user-id', // Replace with actual user ID
    danceStyles: [],
    level: 'beginner',
    location: { latitude: 0, longitude: 0 },
    availability: {}
  });
  const [matches, setMatches] = useState<User[]>([]);

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPreferences(prev => ({
          ...prev,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
        }));
      },
      (error) => console.error('Error getting location:', error)
    );
  }, []);

  const findMatches = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('danceStyles', 'array-contains-any', preferences.danceStyles)
      );
      const querySnapshot = await getDocs(q);
      const matchedUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        matchedUsers.push(doc.data() as User);
      });
      setMatches(matchedUsers);
    } catch (error) {
      console.error('Error finding matches:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Find Dance Partners</h2>
        <div>
          <label className="block text-sm font-medium">Dance Styles</label>
          <select
            multiple
            value={preferences.danceStyles}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              danceStyles: Array.from(e.target.selectedOptions, option => option.value)
            }))}
            className="mt-1 w-full px-4 py-2 border rounded-lg"
          >
            <option value="salsa">Salsa</option>
            <option value="bachata">Bachata</option>
            <option value="kizomba">Kizomba</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Level</label>
          <select
            value={preferences.level}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              level: e.target.value
            }))}
            className="mt-1 w-full px-4 py-2 border rounded-lg"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <button
          onClick={findMatches}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Find Partners
        </button>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-4">Matches</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <div key={match.id} className="p-4 border rounded-lg">
              <img
                src={match.photoURL || '/assets/default-avatar.png'}
                alt={match.displayName}
                className="w-16 h-16 rounded-full"
              />
              <h4 className="font-medium mt-2">{match.displayName}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnerMatching;