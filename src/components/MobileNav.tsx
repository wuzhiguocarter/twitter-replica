import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bell, Mail } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className="py-2 px-6 flex justify-around">
      <Link to="/" className={`p-3 ${location.pathname === '/' ? 'text-blue-500' : ''}`}>
        <Home size={24} />
      </Link>
      <Link to="/explore" className={`p-3 ${location.pathname === '/explore' ? 'text-blue-500' : ''}`}>
        <Search size={24} />
      </Link>
      <Link to="/notifications" className={`p-3 ${location.pathname === '/notifications' ? 'text-blue-500' : ''}`}>
        <Bell size={24} />
      </Link>
      <Link to="/messages" className={`p-3 ${location.pathname === '/messages' ? 'text-blue-500' : ''}`}>
        <Mail size={24} />
      </Link>
    </div>
  );
};