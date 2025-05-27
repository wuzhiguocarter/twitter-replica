import { TweetType, TrendType, SuggestionType, NotificationType } from '../types';

// Mock tweets
export const mockTweets: TweetType[] = [
  {
    id: '1',
    author: {
      name: 'Elon Musk',
      handle: '@elonmusk',
      avatar: 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    content: 'The most entertaining outcome is the most likely.',
    timestamp: '2025-04-10T14:48:00.000Z',
    likes: 42000,
    retweets: 8500,
    replies: 2700,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: true
  },
  {
    id: '2',
    author: {
      name: 'TechCrunch',
      handle: '@TechCrunch',
      avatar: 'https://images.pexels.com/photos/935756/pexels-photo-935756.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    content: 'AI tools are revolutionizing how developers write code. Studies show 60% productivity increase across teams using AI pair programming.',
    timestamp: '2025-04-10T12:30:00.000Z',
    likes: 3200,
    retweets: 1100,
    replies: 340,
    isLiked: true,
    isRetweeted: false,
    isBookmarked: false
  },
  {
    id: '3',
    author: {
      name: 'NASA',
      handle: '@NASA',
      avatar: 'https://images.pexels.com/photos/41162/moon-landing-apollo-11-nasa-buzz-aldrin-41162.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    content: 'Our James Webb Space Telescope has captured the most detailed and sharpest images to date of the Orion Nebula, a stellar nursery located 1,350 light-years away. These breathtaking images reveal unprecedented details of how stars and planetary systems form.',
    timestamp: '2025-04-09T22:15:00.000Z',
    likes: 15800,
    retweets: 4300,
    replies: 920,
    isLiked: false,
    isRetweeted: true,
    isBookmarked: true
  },
  {
    id: '4',
    author: {
      name: 'React',
      handle: '@reactjs',
      avatar: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    content: 'React 19 is now available! This version brings significant performance improvements and introduces the new React Compiler.',
    timestamp: '2025-04-09T18:22:00.000Z',
    likes: 7600,
    retweets: 2900,
    replies: 540,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false
  },
  {
    id: '5',
    author: {
      name: 'Taylor Swift',
      handle: '@taylorswift13',
      avatar: 'https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    content: "So excited to announce my world tour starting next month! Can't wait to see you all there! 🎵✨",
    timestamp: '2025-04-09T16:45:00.000Z',
    likes: 250000,
    retweets: 45000,
    replies: 32000,
    isLiked: false,
    isRetweeted: false,
    isBookmarked: false
  }
];

// Mock trends
export const mockTrends: TrendType[] = [
  {
    category: 'Technology',
    title: '#ReactJS',
    tweetCount: 34500
  },
  {
    category: 'Entertainment',
    title: '#TaylorSwiftTour',
    tweetCount: 145000
  },
  {
    category: 'Sports',
    title: 'Champions League',
    tweetCount: 89200
  },
  {
    category: 'Business',
    title: '#Bitcoin',
    tweetCount: 52700
  },
  {
    category: 'Politics',
    title: 'Election 2025',
    tweetCount: 76800
  }
];

// Mock who to follow suggestions
export const mockSuggestions: SuggestionType[] = [
  {
    name: 'Bill Gates',
    handle: '@BillGates',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300'
  },
  {
    name: 'SpaceX',
    handle: '@SpaceX',
    avatar: 'https://images.pexels.com/photos/23769/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=300'
  },
  {
    name: 'Vogue Magazine',
    handle: '@voguemagazine',
    avatar: 'https://images.pexels.com/photos/2682452/pexels-photo-2682452.jpeg?auto=compress&cs=tinysrgb&w=300'
  }
];

// Mock notifications
export const mockNotifications: NotificationType[] = [
  {
    id: '1',
    type: 'like',
    timestamp: '2025-04-10T15:30:00.000Z',
    isRead: false,
    actor: {
      name: 'Bill Gates',
      handle: '@BillGates',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    tweet: mockTweets[0]
  },
  {
    id: '2',
    type: 'retweet',
    timestamp: '2025-04-10T14:45:00.000Z',
    isRead: true,
    actor: {
      name: 'Elon Musk',
      handle: '@elonmusk',
      avatar: 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    tweet: mockTweets[1]
  },
  {
    id: '3',
    type: 'follow',
    timestamp: '2025-04-10T12:15:00.000Z',
    isRead: false,
    actor: {
      name: 'SpaceX',
      handle: '@SpaceX',
      avatar: 'https://images.pexels.com/photos/23769/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=300'
    }
  },
  {
    id: '4',
    type: 'mention',
    timestamp: '2025-04-09T23:30:00.000Z',
    isRead: true,
    actor: {
      name: 'NASA',
      handle: '@NASA',
      avatar: 'https://images.pexels.com/photos/41162/moon-landing-apollo-11-nasa-buzz-aldrin-41162.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    tweet: mockTweets[2]
  },
  {
    id: '5',
    type: 'reply',
    timestamp: '2025-04-09T20:00:00.000Z',
    isRead: false,
    actor: {
      name: 'React',
      handle: '@reactjs',
      avatar: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    tweet: mockTweets[3]
  }
];