import React from 'react';
import { Search } from 'lucide-react';
import { mockTrends, mockSuggestions } from '../data/mockData';

export const Widgets: React.FC = () => {
  return (
    <div className="p-4 sticky top-0 h-screen overflow-y-auto no-scrollbar">
      {/* Search bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search Twitter"
          className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Trends */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl mb-4">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Trends for you</h2>
          
          {mockTrends.map((trend, index) => (
            <div key={index} className="py-3 px-4 hover-card rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {trend.category} · Trending
                  </p>
                  <p className="font-bold mt-0.5">{trend.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {trend.tweetCount.toLocaleString()} Tweets
                  </p>
                </div>
                <button className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          <button className="text-blue-500 p-4 hover:underline">
            Show more
          </button>
        </div>
      </div>
      
      {/* Who to follow */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Who to follow</h2>
          
          {mockSuggestions.map((suggestion, index) => (
            <div key={index} className="py-3 flex items-center justify-between hover-card rounded-lg px-4">
              <div className="flex items-center">
                <img 
                  src={suggestion.avatar} 
                  alt={`${suggestion.name}'s avatar`} 
                  className="w-12 h-12 rounded-full mr-3"
                />
                <div>
                  <p className="font-bold">{suggestion.name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{suggestion.handle}</p>
                </div>
              </div>
              <button className="btn-outline bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200">
                Follow
              </button>
            </div>
          ))}
          
          <button className="text-blue-500 p-4 hover:underline">
            Show more
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 px-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap gap-2">
          <a href="#" className="hover:underline">Terms of Service</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Cookie Policy</a>
          <a href="#" className="hover:underline">Accessibility</a>
          <a href="#" className="hover:underline">Ads info</a>
          <a href="#" className="hover:underline">More</a>
        </div>
        <p className="mt-2">© 2025 Twitter, Inc.</p>
      </div>
    </div>
  );
};