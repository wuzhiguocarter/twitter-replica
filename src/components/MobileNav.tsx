import React from 'react';
import { Home, Search, Bell, Mail } from 'lucide-react';

export const MobileNav: React.FC = () => {
  return (
    <div className="py-2 px-6 flex justify-around">
      <button className="p-3">
        <Home size={24} />
      </button>
      <button className="p-3">
        <Search size={24} />
      </button>
      <button className="p-3">
        <Bell size={24} />
      </button>
      <button className="p-3">
        <Mail size={24} />
      </button>
    </div>
  );
};