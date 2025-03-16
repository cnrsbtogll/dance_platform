// src/components/progress/BadgeSystem.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Badge } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../App';

const BadgeSystem: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchBadges = async () => {
      try {
        setLoading(true);
        const badgesRef = collection(db, 'badges');
        const querySnapshot = await getDocs(badgesRef);
        const fetchedBadges: Badge[] = [];
        querySnapshot.forEach((doc) => {
          fetchedBadges.push({
            id: doc.id,
            ...doc.data() as Omit<Badge, 'id'>
          });
        });
        setBadges(fetchedBadges);

        // Fetch user's earned badges
        const userBadgesRef = collection(db, 'userBadges');
        const userBadgesQuery = query(userBadgesRef, where('userId', '==', user.id));
        const userBadgesSnapshot = await getDocs(userBadgesQuery);
        const earnedBadgeIds: string[] = [];
        userBadgesSnapshot.forEach((doc) => {
          earnedBadgeIds.push(doc.data().badgeId);
        });
        setUserBadges(earnedBadgeIds);
      } catch (error) {
        console.error('Error fetching badges:', error);
        setError('Failed to load badges. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [user]);

  const getDanceStyleEmoji = (style: string): string => {
    switch (style) {
      case 'salsa':
        return '💃';
      case 'bachata':
        return '🕺';
      case 'kizomba':
        return '👫';
      default:
        return '🎭';
    }
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'professional':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const beginnerBadges = badges.filter(b => b.level === 'beginner');
  const intermediateBadges = badges.filter(b => b.level === 'intermediate');
  const advancedBadges = badges.filter(b => b.level === 'advanced');
  const professionalBadges = badges.filter(b => b.level === 'professional');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Your Progress</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track your dance journey and earn badges as you improve
        </p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{userBadges.length}</div>
              <div className="text-sm text-gray-500">Badges Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{badges.length}</div>
              <div className="text-sm text-gray-500">Total Badges</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {Math.round((userBadges.length / (badges.length || 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-500">Completion</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-5">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full" 
                style={{ width: `${Math.round((userBadges.length / (badges.length || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Beginner Badges */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800 mr-2">
              1
            </span>
            Beginner Badges
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            First steps in your dance journey
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {beginnerBadges.length > 0 ? beginnerBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 border-2 rounded-lg text-center ${userBadges.includes(badge.id) ? 'border-green-500' : 'border-gray-200'}`}
              >
                <div className="text-4xl mb-2">{getDanceStyleEmoji(badge.danceStyle)}</div>
                <h3 className="font-medium">{badge.name}</h3>
                <div className={`inline-block px-2 py-1 mt-2 text-xs rounded-full ${getLevelColor(badge.level)}`}>
                  {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                </div>
                <p className="text-sm text-gray-600 mt-2">{badge.description}</p>
                {userBadges.includes(badge.id) && (
                  <span className="inline-block px-2 py-1 mt-2 text-xs text-green-600 bg-green-100 rounded-full">
                    Earned
                  </span>
                )}
              </div>
            )) : (
              <div className="col-span-full text-center py-4 text-gray-500">
                No beginner badges available yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intermediate Badges */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-2">
              2
            </span>
            Intermediate Badges
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Developing your dance skills
          </p>
        </div>
        <div className="border-t border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {intermediateBadges.length > 0 ? intermediateBadges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 border-2 rounded-lg text-center ${userBadges.includes(badge.id) ? 'border-blue-500' : 'border-gray-200'}`}
              >
                <div className="text-4xl mb-2">{getDanceStyleEmoji(badge.danceStyle)}</div>
                <h3 className="font-medium">{badge.name}</h3>
                <div className={`inline-block px-2 py-1 mt-2 text-xs rounded-full ${getLevelColor(badge.level)}`}>
                  {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                </div>
                <p className="text-sm text-gray-600 mt-2">{badge.description}</p>
                {userBadges.includes(badge.id) && (
                  <span className="inline-block px-2 py-1 mt-2 text-xs text-blue-600 bg-blue-100 rounded-full">
                    Earned
                  </span>
                )}
              </div>
            )) : (
              <div className="col-span-full text-center py-4 text-gray-500">
                No intermediate badges available yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced and Professional Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Advanced Badges */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-purple-100 text-purple-800 mr-2">
                3
              </span>
              Advanced Badges
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {advancedBadges.length > 0 ? advancedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 border-2 rounded-lg text-center ${userBadges.includes(badge.id) ? 'border-purple-500' : 'border-gray-200'}`}
                >
                  <div className="text-4xl mb-2">{getDanceStyleEmoji(badge.danceStyle)}</div>
                  <h3 className="font-medium">{badge.name}</h3>
                  <div className={`inline-block px-2 py-1 mt-2 text-xs rounded-full ${getLevelColor(badge.level)}`}>
                    {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{badge.description}</p>
                  {userBadges.includes(badge.id) && (
                    <span className="inline-block px-2 py-1 mt-2 text-xs text-purple-600 bg-purple-100 rounded-full">
                      Earned
                    </span>
                  )}
                </div>
              )) : (
                <div className="col-span-full text-center py-4 text-gray-500">
                  No advanced badges available yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Professional Badges */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-pink-100 text-pink-800 mr-2">
                4
              </span>
              Professional Badges
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {professionalBadges.length > 0 ? professionalBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 border-2 rounded-lg text-center ${userBadges.includes(badge.id) ? 'border-pink-500' : 'border-gray-200'}`}
                >
                  <div className="text-4xl mb-2">{getDanceStyleEmoji(badge.danceStyle)}</div>
                  <h3 className="font-medium">{badge.name}</h3>
                  <div className={`inline-block px-2 py-1 mt-2 text-xs rounded-full ${getLevelColor(badge.level)}`}>
                    {badge.level.charAt(0).toUpperCase() + badge.level.slice(1)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{badge.description}</p>
                  {userBadges.includes(badge.id) && (
                    <span className="inline-block px-2 py-1 mt-2 text-xs text-pink-600 bg-pink-100 rounded-full">
                      Earned
                    </span>
                  )}
                </div>
              )) : (
                <div className="col-span-full text-center py-4 text-gray-500">
                  No professional badges available yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeSystem;