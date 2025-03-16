// src/components/search/SearchFilters.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../App';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { DanceStyle, DanceLevel, User, Instructor } from '../../types';

interface ClassData {
  id: string;
  name: string;
  danceStyle: DanceStyle;
  level: DanceLevel;
  instructorId: string;
  instructorName: string;
  instructorPhoto?: string;
  location: {
    address: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  price: number;
  duration: number;
  maxParticipants: number;
  currentParticipants: number;
  date: Date;
  time: string;
}

const SearchFilters: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // States
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedStyles, setSelectedStyles] = useState<DanceStyle[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<DanceLevel | ''>('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(200);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Dynamic data
  const [cities, setCities] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        
        // Fetch classes
        const classesRef = collection(db, 'classes');
        const classesQuery = query(
          classesRef,
          orderBy('date', 'asc'),
          limit(100)
        );
        
        const querySnapshot = await getDocs(classesQuery);
        const fetchedClasses: ClassData[] = [];
        const citiesSet = new Set<string>();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const classData: ClassData = {
            id: doc.id,
            name: data.name,
            danceStyle: data.danceStyle,
            level: data.level,
            instructorId: data.instructorId,
            instructorName: data.instructorName,
            instructorPhoto: data.instructorPhoto,
            location: data.location,
            price: data.price,
            duration: data.duration,
            maxParticipants: data.maxParticipants,
            currentParticipants: data.currentParticipants,
            date: data.date.toDate(),
            time: data.time
          };
          fetchedClasses.push(classData);
          citiesSet.add(data.location.city);
        });
        
        setClasses(fetchedClasses);
        setCities(Array.from(citiesSet).sort());
        
        // Fetch instructors
        const instructorsRef = collection(db, 'instructors');
        const instructorsSnapshot = await getDocs(instructorsRef);
        const fetchedInstructors: Instructor[] = [];
        
        instructorsSnapshot.forEach((doc) => {
          fetchedInstructors.push({
            id: doc.id,
            ...doc.data() as Omit<Instructor, 'id'>
          });
        });
        
        setInstructors(fetchedInstructors);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load classes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, []);
  
  // Filter classes based on criteria
  const filteredClasses = classes.filter((classItem) => {
    // Filter by dance style
    if (selectedStyles.length > 0 && !selectedStyles.includes(classItem.danceStyle)) {
      return false;
    }
    
    // Filter by level
    if (selectedLevel && classItem.level !== selectedLevel) {
      return false;
    }
    
    // Filter by instructor
    if (selectedInstructor && classItem.instructorId !== selectedInstructor) {
      return false;
    }
    
    // Filter by city
    if (selectedCity && classItem.location.city !== selectedCity) {
      return false;
    }
    
    // Filter by price
    if (classItem.price > maxPrice) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        classItem.name.toLowerCase().includes(query) ||
        classItem.instructorName.toLowerCase().includes(query) ||
        classItem.location.address.toLowerCase().includes(query) ||
        classItem.location.city.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
  
  // Helper function to format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Toggle dance style selection
  const toggleDanceStyle = (style: DanceStyle) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedStyles([]);
    setSelectedLevel('');
    setSelectedInstructor('');
    setSelectedCity('');
    setMaxPrice(200);
    setSearchQuery('');
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
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Find Dance Classes</h2>
        <p className="mt-1 text-sm text-gray-500">
          Search for classes that match your preferences and level
        </p>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 space-y-4">
          {/* Search input */}
          <div>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search by class name, instructor, or location"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {/* Dance Style Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dance Styles
              </label>
              <div className="flex flex-wrap gap-2">
                {['salsa', 'bachata', 'kizomba', 'other'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleDanceStyle(style as DanceStyle)}
                    className={`rounded-md py-1 px-2 text-xs font-medium ${selectedStyles.includes(style as DanceStyle) 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as DanceLevel | '')}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            
            {/* Instructor Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instructor
              </label>
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Instructors</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.userId /* This would need to be replaced with actual instructor name */}
                  </option>
                ))}
              </select>
            </div>
            
            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price ($): {maxPrice}
              </label>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="mt-1 block w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>$200+</span>
              </div>
            </div>
          </div>
          
          {/* Filter actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetFilters}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Results */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Available Classes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'} found
            </p>
          </div>
        </div>
        <div className="border-t border-gray-200">
          {filteredClasses.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 text-lg">
                No classes match your filters.
              </p>
              <p className="text-gray-500">
                Try adjusting your filters or search criteria.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredClasses.map((classItem) => (
                <div key={classItem.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-indigo-600">
                        {classItem.name}
                      </h4>
                      <div className="mt-1 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-2">
                          {classItem.danceStyle.charAt(0).toUpperCase() + classItem.danceStyle.slice(1)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {classItem.level.charAt(0).toUpperCase() + classItem.level.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(classItem.date)} • {classItem.time} • {classItem.duration} min</span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{classItem.location.address}, {classItem.location.city}</span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{classItem.instructorName}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="text-lg font-medium text-gray-900">
                        ${classItem.price}
                      </div>
                      <div className="text-sm text-gray-500">
                        {classItem.currentParticipants}/{classItem.maxParticipants} spots filled
                      </div>
                      <div className="mt-2">
                        <button
                          type="button"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;