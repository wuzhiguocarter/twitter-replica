import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Widgets } from './Widgets';
import { MobileNav } from './MobileNav';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block md:w-64 lg:w-72 flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main content area */}
      <main className="flex-grow max-w-full md:max-w-[600px] border-x border-gray-200 dark:border-gray-800">
        <Outlet />
      </main>
      
      {/* Widgets - hidden on mobile and small tablets */}
      <div className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
        <Widgets />
      </div>
      
      {/* Mobile navigation - visible only on mobile */}
      <div className="block md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <MobileNav />
      </div>
    </div>
  );
};