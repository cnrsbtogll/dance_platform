import { useState } from 'react';
import Button from '../common/Button';

interface User {
  displayName?: string;
  photoURL?: string;
  email?: string;
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
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileState>({
    name: user?.displayName || '',
    bio: '',
    danceStyles: [],
    level: 'Beginner'
  });

  if (!user) {
    return (
      <div className="text-center py-10">
        Please sign in to view your profile.
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update profile logic here
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-6 mb-6">
          <img
            src={user.photoURL || 'https://via.placeholder.com/100'}
            alt="Profile"
            className="h-24 w-24 rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold">{user.displayName || 'Dancer'}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Level</label>
                <select
                  value={profile.level}
                  onChange={(e) => setProfile({ ...profile, level: e.target.value as ProfileState['level'] })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div>
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfile; 