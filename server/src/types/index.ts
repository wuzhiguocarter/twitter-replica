// User types
export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  email: string;
  password: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate: Date;
  coverImage?: string;
}

// Tweet types
export interface Tweet {
  id: string;
  author: User | string; // Can be User object or userId reference
  content: string;
  timestamp: Date;
  likes: string[]; // Array of user IDs
  retweets: string[]; // Array of user IDs
  replies: string[]; // Array of tweet IDs
  isBookmarked?: boolean; // Computed field, not stored
}

// Notification types
export interface Notification {
  id: string;
  type: 'like' | 'retweet' | 'reply' | 'follow' | 'mention';
  timestamp: Date;
  isRead: boolean;
  actor: User | string; // User who triggered the notification
  recipient: User | string; // User receiving the notification
  tweet?: Tweet | string; // Optional tweet reference
}

// Message types
export interface Message {
  id?: string;
  sender: User | string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: (User | string)[]; // Array of exactly 2 users
  messages: Message[];
  lastMessageTimestamp: Date;
  unreadCount?: number; // Computed field
}

// Follow relationship
export interface Follow {
  id?: string;
  follower: User | string; // User following another user
  following: User | string; // User being followed
  timestamp: Date;
}

// Bookmark type
export interface Bookmark {
  id?: string;
  user: User | string;
  tweet: Tweet | string;
  timestamp: Date;
}
