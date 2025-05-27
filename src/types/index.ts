// Tweet types
export interface Author {
  name: string;
  handle: string;
  avatar: string;
}

export interface TweetType {
  id: string;
  author: Author;
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  isLiked: boolean;
  isRetweeted: boolean;
  isBookmarked: boolean;
}

// Trend types
export interface TrendType {
  category: string;
  title: string;
  tweetCount: number;
}

// User suggestion types
export interface SuggestionType {
  name: string;
  handle: string;
  avatar: string;
}

// Notification types
export interface NotificationType {
  id: string;
  type: 'like' | 'retweet' | 'reply' | 'follow' | 'mention';
  timestamp: string;
  isRead: boolean;
  actor: Author;
  tweet?: TweetType;
}