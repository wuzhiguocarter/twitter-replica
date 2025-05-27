import React from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Link as LinkIcon, MapPin } from 'lucide-react';
import { mockTweets } from '../data/mockData';
import { Tweet } from './Tweet';

export const Profile: React.FC = () => {
  const { username } = useParams();
  const userTweets = mockTweets.filter(tweet => tweet.author.handle === username);
  
  // Mock user data
  const user = {
    name: 'John Doe',
    handle: '@johndoe',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
    bio: 'Software developer | Tech enthusiast | Coffee lover',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    joinDate: 'March 2020',
    following: 542,
    followers: 1289,
    coverImage: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=1260'
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold">{user.name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{userTweets.length} Tweets</p>
      </div>

      {/* Cover Image */}
      <div className="h-48 relative">
        <img
          src={user.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          {/* Avatar */}
          <img
            src={user.avatar}
            alt={user.name}
            className="absolute -top-16 border-4 border-white dark:border-gray-900 w-32 h-32 rounded-full"
          />
          
          {/* Edit Profile Button */}
          <div className="flex justify-end pt-4">
            <button className="btn-outline">
              Edit profile
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="mt-6">
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">{user.handle}</p>
          
          <p className="mt-3">{user.bio}</p>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
              {user.location && (
                <span className="flex items-center">
                  <MapPin size={16} className="mr-1" />
                  {user.location}
                </span>
              )}
              {user.website && (
                <a href={user.website} className="flex items-center text-blue-500 hover:underline">
                  <LinkIcon size={16} className="mr-1" />
                  {user.website.replace('https://', '')}
                </a>
              )}
              <span className="flex items-center">
                <Calendar size={16} className="mr-1" />
                Joined {user.joinDate}
              </span>
            </div>
            
            <div className="flex space-x-4">
              <span>
                <span className="font-bold">{user.following}</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">Following</span>
              </span>
              <span>
                <span className="font-bold">{user.followers}</span>
                <span className="ml-1 text-gray-500 dark:text-gray-400">Followers</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tweets */}
      <div>
        {userTweets.map(tweet => (
          <Tweet
            key={tweet.id}
            tweet={tweet}
            onLike={() => {}}
            onRetweet={() => {}}
          />
        ))}
      </div>
    </div>
  );
};