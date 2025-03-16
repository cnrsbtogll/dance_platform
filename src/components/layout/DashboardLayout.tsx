// src/components/layout/DashboardLayout.tsx
import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../App';
import { User } from '../../types';

const DashboardLayout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Define navigation links based on user role
  const getNavLinks = (role: string) => {
    const commonLinks = [
      { name: 'Progress', path: '/progress', icon: '🏆' },
    ];
    
    switch(role) {
      case 'student':
        return [
          ...commonLinks,
          { name: 'Find Partners', path: '/partners', icon: '👥' },
          { name: 'Find Classes', path: '/classes', icon: '💃' },
          { name: 'My Schedule', path: '/schedule', icon: '📅' },
        ];
      case 'instructor':
        return [
          ...commonLinks,
          { name: 'Calendar', path: '/calendar', icon: '📆' },
          { name: 'My Students', path: '/students', icon: '👨‍🎓' },
          { name: 'My Classes', path: '/my-classes', icon: '📚' },
        ];
      case 'school':
        return [
          { name: 'Dashboard', path: '/school-dashboard', icon: '📊' },
          { name: 'Instructors', path: '/instructors', icon: '👩‍🏫' },
          { name: 'Classes', path: '/school-classes', icon: '🕺' },
          { name: 'Students', path: '/school-students', icon: '👨‍👩‍👧‍👦' },
        ];
      default:
        return commonLinks;
    }
  };

  const navLinks = user ? getNavLinks(user.role) : [];
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <img 
                className="w-auto h-8" 
                src="/logo.svg" 
                alt="Dance Platform Logo" 
              />
              <span className="ml-2 text-xl font-semibold">Dance Platform</span>
            </div>
            <div className="flex flex-col flex-grow px-4 mt-5">
              <nav className="flex-1 space-y-1">
                {navLinks.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`${
                      location.pathname === item.path
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex flex-shrink-0 p-4 border-t">
              <Link to="/profile" className="flex-shrink-0 block w-full group">
                <div className="flex items-center">
                  <div>
                    <img
                      className="inline-block rounded-full h-9 w-9"
                      src={user.photoURL || "https://via.placeholder.com/36"}
                      alt="User"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user.displayName}
                    </p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <div className="relative z-10 flex flex-shrink-0 h-16 bg-white border-b shadow-sm md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="px-4 text-gray-500 border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center justify-center flex-1 px-4">
            <img 
              className="w-auto h-8" 
              src="/logo.svg" 
              alt="Dance Platform Logo" 
            />
          </div>
          <div className="flex items-center px-4">
            <Link to="/profile">
              <img
                className="inline-block rounded-full h-8 w-8"
                src={user.photoURL || "https://via.placeholder.com/32"}
                alt="User"
              />
            </Link>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={toggleMobileMenu}
            ></div>
            <div className="relative flex flex-col flex-1 w-full max-w-xs pt-5 pb-4 bg-white">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center">
                  <img 
                    className="w-auto h-8" 
                    src="/logo.svg" 
                    alt="Dance Platform Logo" 
                  />
                  <span className="ml-2 text-lg font-semibold">Dance Platform</span>
                </div>
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 text-gray-400 rounded-md hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col flex-grow mt-5">
                <nav className="flex-1 px-2 space-y-1">
                  {navLinks.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={toggleMobileMenu}
                      className={`${
                        location.pathname === item.path
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="flex flex-shrink-0 p-4 border-t">
                <Link
                  to="/profile"
                  onClick={toggleMobileMenu}
                  className="flex-shrink-0 block w-full group"
                >
                  <div className="flex items-center">
                    <div>
                      <img
                        className="inline-block rounded-full h-9 w-9"
                        src={user.photoURL || "https://via.placeholder.com/36"}
                        alt="User"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {user.displayName}
                      </p>
                      <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700 capitalize">
                        {user.role}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;