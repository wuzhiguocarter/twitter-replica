import React, { useState } from 'react';
import { Image, BarChart, Smile, Calendar } from 'lucide-react';

interface TweetComposerProps {
  onTweet: (content: string) => void;
}

export const TweetComposer: React.FC<TweetComposerProps> = ({ onTweet }) => {
  const [content, setContent] = useState('');
  const maxLength = 280;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && content.length <= maxLength) {
      onTweet(content);
      setContent('');
    }
  };
  
  const charactersLeft = maxLength - content.length;
  const isOverLimit = charactersLeft < 0;
  const isNearLimit = charactersLeft <= 20 && charactersLeft >= 0;
  
  return (
    <div className="p-4">
      <div className="flex">
        <img 
          src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300" 
          alt="User avatar" 
          className="w-12 h-12 rounded-full mr-4"
        />
        <div className="flex-grow">
          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full bg-transparent resize-none outline-none text-xl placeholder-gray-500 dark:placeholder-gray-400 mb-3"
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex text-blue-500 space-x-2">
                <button type="button" className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  <Image size={20} />
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  <BarChart size={20} />
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  <Smile size={20} />
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30">
                  <Calendar size={20} />
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Character count circle */}
                {content.length > 0 && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isOverLimit 
                      ? 'text-red-500' 
                      : isNearLimit 
                        ? 'text-yellow-500' 
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    <span className="text-xs font-bold">{charactersLeft}</span>
                  </div>
                )}
                
                <button 
                  type="submit"
                  disabled={content.length === 0 || isOverLimit}
                  className={`btn-primary ${
                    content.length === 0 || isOverLimit 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  Tweet
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};