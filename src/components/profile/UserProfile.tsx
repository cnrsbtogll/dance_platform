import { useState } from 'react';
import Button from '../common/Button';

interface User {
  displayName?: string;
  photoURL?: string;
  email?: string;
  id?: string;
  role?: string;
}

interface UserProfileProps {
  user: User | null;
}

interface ProfileState {
  name: string;
  bio: string;
  danceStyles: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

function UserProfile({ user }: UserProfileProps) {
  const [profile, setProfile] = useState<ProfileState>({
    name: user?.displayName || '',
    bio: '',
    danceStyles: [],
    level: 'Beginner'
  });

  const [isEditing, setIsEditing] = useState(false);

  // Profil düzenleme durumunu değiştir
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Formu gönderme işlemi
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Burada API'ye profil güncellemesi gönderme işlemi yapılacak
    console.log('Profile updated:', profile);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="text-center py-10">
        Please sign in to view your profile.
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 sm:px-8">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-20 w-20">
            <img
              className="h-full w-full rounded-full"
              src={user?.photoURL || "https://via.placeholder.com/80?text=Kullanıcı"}
              alt="Profile"
            />
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold">{user?.displayName || 'Dancer'}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
          <button
            onClick={toggleEdit}
            className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
          >
            {isEditing ? 'İptal' : 'Düzenle'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="px-6 py-4 sm:px-8 border-t border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ad Soyad</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Hakkımda</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Dans Seviyesi</label>
                <select
                  value={profile.level}
                  onChange={(e) => setProfile({ ...profile, level: e.target.value as ProfileState['level'] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="Beginner">Başlangıç</option>
                  <option value="Intermediate">Orta Seviye</option>
                  <option value="Advanced">İleri Seviye</option>
                </select>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="px-6 py-4 sm:px-8 border-t border-gray-200">
          <h3 className="text-lg font-medium">Dans Bilgileri</h3>
          <p className="mt-2 text-gray-600">
            {profile.bio || 'Henüz bir bio eklenmemiş.'}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            <span className="font-medium">Seviye:</span> {profile.level}
          </p>
        </div>
      )}
    </div>
  );
}

export default UserProfile; 