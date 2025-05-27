import React, { useState } from 'react';
import { Heart, Repeat2, MessageCircle, UserPlus, AtSign } from 'lucide-react';
import { mockNotifications } from '../data/mockData';
import { NotificationType } from '../types';
import { formatRelativeTime } from '../utils/formatters';

export const Notifications: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'mentions'>('all');
  const [notifications, setNotifications] = useState(mockNotifications);

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === 'mention');

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: NotificationType['type']) => {
    switch (type) {
      case 'like':
        return <Heart size={16} className="text-red-500" />;
      case 'retweet':
        return <Repeat2 size={16} className="text-green-500" />;
      case 'reply':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'follow':
        return <UserPlus size={16} className="text-purple-500" />;
      case 'mention':
        return <AtSign size={16} className="text-blue-500" />;
    }
  };

  const getNotificationText = (notification: NotificationType) => {
    switch (notification.type) {
      case 'like':
        return 'liked your Tweet';
      case 'retweet':
        return 'Retweeted your Tweet';
      case 'reply':
        return 'replied to your Tweet';
      case 'follow':
        return 'followed you';
      case 'mention':
        return 'mentioned you';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <div className="flex mt-3 border-b border-gray-200 dark:border-gray-800">
              <button
                className={`px-4 py-3 font-medium ${
                  filter === 'all'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`px-4 py-3 font-medium ${
                  filter === 'mentions'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                onClick={() => setFilter('mentions')}
              >
                Mentions
              </button>
            </div>
          </div>
          <button
            onClick={markAllAsRead}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div>
        {filteredNotifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
              !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
            }`}
          >
            <div className="flex items-start">
              <div className="mr-3 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-grow">
                <div className="flex items-center mb-2">
                  <img
                    src={notification.actor.avatar}
                    alt={notification.actor.name}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <div>
                    <span className="font-bold hover:underline">
                      {notification.actor.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      {getNotificationText(notification)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">·</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      {formatRelativeTime(new Date(notification.timestamp))}
                    </span>
                  </div>
                </div>
                {notification.tweet && (
                  <div className="ml-12 text-gray-500 dark:text-gray-400">
                    {notification.tweet.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};