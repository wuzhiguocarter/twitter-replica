import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Bell, Mail, User, Hash, Bookmark, List, MoreHorizontal, Twitter, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Sidebar: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  
  const navItems = [
    { icon: <Home size={24} />, text: 'Home', path: '/' },
    { icon: <Hash size={24} />, text: 'Explore', path: '/explore' },
    { icon: <Bell size={24} />, text: 'Notifications', path: '/notifications' },
    { icon: <Mail size={24} />, text: 'Messages', path: '/messages' },
    { icon: <Bookmark size={24} />, text: 'Bookmarks', path: '/bookmarks' },
    { icon: <List size={24} />, text: 'Lists', path: '/lists' },
    { icon: <User size={24} />, text: 'Profile', path: '/@johndoe' },
    { icon: <MoreHorizontal size={24} />, text: 'More', path: '/more' }
  ];

  return (
    <div className="fixed h-screen p-2 flex flex-col justify-between">
      <div className="space-y-2">
        {/* Twitter logo */}
        <Link to="/" className="p-3 block">
          <Twitter className="h-8 w-8 text-blue-500" />
        </Link>
        
        {/* Navigation items */}
        <nav className="mt-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'nav-item-active' : ''}`}
            >
              {item.icon}
              <span className="ml-4 text-xl hidden xl:inline-block">{item.text}</span>
            </Link>
          ))}
        </nav>
        
        {/* Tweet button */}
        <button className="btn-primary w-full mt-4 py-3 flex items-center justify-center xl:justify-start">
          <span className="xl:hidden">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </span>
          <span className="hidden xl:block text-lg">Tweet</span>
        </button>
      </div>
      
      {/* Profile and theme toggle */}
      <div className="mb-4">
        {/* Theme toggle button */}
        <button onClick={toggleDarkMode} className="nav-item">
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          <span className="ml-4 text-xl hidden xl:inline-block">
            {darkMode ? 'Light mode' : 'Dark mode'}
          </span>
        </button>
        
        {/* User profile button */}
        <Link to="/@johndoe" className="mt-2 p-3 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 flex items-center">
          <img 
            src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300" 
            alt="User avatar" 
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-3 hidden xl:block">
            <p className="font-bold">John Doe</p>
            <p className="text-gray-500 dark:text-gray-400">@johndoe</p>
          </div>
        </Link>
      </div>
    </div>
  );
};