import React from 'react';
import { Tweet } from './Tweet';
import { mockTweets } from '../data/mockData';

export const Bookmarks: React.FC = () => {
  const bookmarkedTweets = mockTweets.filter(tweet => tweet.isBookmarked);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold">Bookmarks</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">@johndoe</p>
      </div>

      {/* Bookmarked Tweets */}
      {bookmarkedTweets.length > 0 ? (
        <div>
          {bookmarkedTweets.map(tweet => (
            <Tweet
              key={tweet.id}
              tweet={tweet}
              onLike={() => {}}
              onRetweet={() => {}}
              onBookmark={() => {}}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Save Tweets for later</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Don't let the good ones fly away! Bookmark Tweets to easily find them again in the future.
          </p>
        </div>
      )}
    </div>
  );
};