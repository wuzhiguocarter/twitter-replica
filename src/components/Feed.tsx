import React, { useState } from 'react';
import { TweetComposer } from './TweetComposer';
import { Tweet } from './Tweet';
import { mockTweets } from '../data/mockData';

export const Feed: React.FC = () => {
  const [tweets, setTweets] = useState(mockTweets);
  
  const addTweet = (content: string) => {
    const newTweet = {
      id: Date.now().toString(),
      author: {
        name: 'John Doe',
        handle: '@johndoe',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300'
      },
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      retweets: 0,
      replies: 0,
      isLiked: false,
      isRetweeted: false,
      isBookmarked: false
    };
    
    setTweets([newTweet, ...tweets]);
  };
  
  const toggleLike = (id: string) => {
    setTweets(tweets.map(tweet => {
      if (tweet.id === id) {
        return {
          ...tweet,
          likes: tweet.isLiked ? tweet.likes - 1 : tweet.likes + 1,
          isLiked: !tweet.isLiked
        };
      }
      return tweet;
    }));
  };
  
  const toggleRetweet = (id: string) => {
    setTweets(tweets.map(tweet => {
      if (tweet.id === id) {
        return {
          ...tweet,
          retweets: tweet.isRetweeted ? tweet.retweets - 1 : tweet.retweets + 1,
          isRetweeted: !tweet.isRetweeted
        };
      }
      return tweet;
    }));
  };

  const toggleBookmark = (id: string) => {
    setTweets(tweets.map(tweet => {
      if (tweet.id === id) {
        return {
          ...tweet,
          isBookmarked: !tweet.isBookmarked
        };
      }
      return tweet;
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold">Home</h1>
      </div>
      
      {/* Tweet composer */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <TweetComposer onTweet={addTweet} />
      </div>
      
      {/* Tweets */}
      <div>
        {tweets.map(tweet => (
          <Tweet 
            key={tweet.id} 
            tweet={tweet} 
            onLike={() => toggleLike(tweet.id)}
            onRetweet={() => toggleRetweet(tweet.id)}
            onBookmark={() => toggleBookmark(tweet.id)}
          />
        ))}
      </div>
    </div>
  );
};