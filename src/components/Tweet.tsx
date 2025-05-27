import React from 'react';
import { Heart, Repeat, MessageCircle, Share, Bookmark } from 'lucide-react';
import { formatRelativeTime } from '../utils/formatters';
import { TweetType } from '../types';

interface TweetProps {
  tweet: TweetType;
  onLike: () => void;
  onRetweet: () => void;
  onBookmark: () => void;
}

export const Tweet: React.FC<TweetProps> = ({ tweet, onLike, onRetweet, onBookmark }) => {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-800 hover-card">
      <div className="flex">
        {/* Avatar */}
        <img 
          src={tweet.author.avatar} 
          alt={`${tweet.author.name}'s avatar`} 
          className="w-12 h-12 rounded-full mr-3"
        />
        
        {/* Tweet content */}
        <div className="flex-grow">
          {/* Author info and timestamp */}
          <div className="flex items-start">
            <div className="flex flex-wrap items-center">
              <span className="font-bold mr-1">{tweet.author.name}</span>
              <span className="text-gray-500 dark:text-gray-400">{tweet.author.handle}</span>
              <span className="mx-1 text-gray-500 dark:text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400">
                {formatRelativeTime(new Date(tweet.timestamp))}
              </span>
            </div>
          </div>
          
          {/* Tweet text */}
          <p className="mt-1 mb-2 text-gray-900 dark:text-white whitespace-pre-wrap">{tweet.content}</p>
          
          {/* Tweet actions */}
          <div className="flex justify-between mt-3 max-w-md">
            {/* Reply */}
            <button className="flex items-center group">
              <div className="p-2 rounded-full group-hover:bg-blue-100 group-hover:text-blue-500 dark:group-hover:bg-blue-900/30">
                <MessageCircle size={18} />
              </div>
              <span className="ml-1 text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-500">
                {tweet.replies > 0 ? tweet.replies : ''}
              </span>
            </button>
            
            {/* Retweet */}
            <button 
              className={`flex items-center group ${tweet.isRetweeted ? 'text-green-500' : ''}`}
              onClick={onRetweet}
            >
              <div className={`p-2 rounded-full ${
                tweet.isRetweeted 
                  ? 'text-green-500' 
                  : 'group-hover:bg-green-100 group-hover:text-green-500 dark:group-hover:bg-green-900/30'
              }`}>
                <Repeat size={18} />
              </div>
              <span className={`ml-1 text-sm ${
                tweet.isRetweeted 
                  ? 'text-green-500' 
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-green-500'
              }`}>
                {tweet.retweets > 0 ? tweet.retweets : ''}
              </span>
            </button>
            
            {/* Like */}
            <button 
              className={`flex items-center group ${tweet.isLiked ? 'text-red-500' : ''}`}
              onClick={onLike}
            >
              <div className={`p-2 rounded-full ${
                tweet.isLiked 
                  ? 'text-red-500' 
                  : 'group-hover:bg-red-100 group-hover:text-red-500 dark:group-hover:bg-red-900/30'
              }`}>
                <Heart size={18} className={tweet.isLiked ? 'fill-current' : ''} />
              </div>
              <span className={`ml-1 text-sm ${
                tweet.isLiked 
                  ? 'text-red-500' 
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500'
              }`}>
                {tweet.likes > 0 ? tweet.likes : ''}
              </span>
            </button>
            
            {/* Bookmark */}
            <button 
              className={`flex items-center group ${tweet.isBookmarked ? 'text-blue-500' : ''}`}
              onClick={onBookmark}
            >
              <div className={`p-2 rounded-full ${
                tweet.isBookmarked 
                  ? 'text-blue-500' 
                  : 'group-hover:bg-blue-100 group-hover:text-blue-500 dark:group-hover:bg-blue-900/30'
              }`}>
                <Bookmark size={18} className={tweet.isBookmarked ? 'fill-current' : ''} />
              </div>
            </button>
            
            {/* Share */}
            <button className="flex items-center group">
              <div className="p-2 rounded-full group-hover:bg-blue-100 group-hover:text-blue-500 dark:group-hover:bg-blue-900/30">
                <Share size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};