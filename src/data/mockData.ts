import { TweetType, TrendType, SuggestionType, NotificationType, MessageType, ConversationType } from '../types';

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

// Mock messages
export const mockMessages: MessageType[] = [
  {
    id: '1',
    content: 'Hey, how are you doing?',
    timestamp: '2025-04-10T15:30:00.000Z',
    isRead: true,
    isSent: false
  },
  {
    id: '2',
    content: 'I\'m good, thanks! Working on some new projects. How about you?',
    timestamp: '2025-04-10T15:32:00.000Z',
    isRead: true,
    isSent: true
  },
  {
    id: '3',
    content: 'That sounds exciting! I\'m just preparing for our upcoming conference next week.',
    timestamp: '2025-04-10T15:35:00.000Z',
    isRead: true,
    isSent: false
  },
  {
    id: '4',
    content: 'Would you like to meet up for coffee sometime to discuss potential collaborations?',
    timestamp: '2025-04-10T15:40:00.000Z',
    isRead: true,
    isSent: false
  },
  {
    id: '5',
    content: 'That sounds great! How about Friday afternoon?',
    timestamp: '2025-04-10T15:45:00.000Z',
    isRead: true,
    isSent: true
  },
  {
    id: '6',
    content: 'Perfect! Let\'s meet at the usual place at 3 PM.',
    timestamp: '2025-04-10T15:50:00.000Z',
    isRead: false,
    isSent: false
  }
];

// Mock conversations
export const mockConversations: ConversationType[] = [
  {
    id: '1',
    participant: {
      name: 'Elon Musk',
      handle: '@elonmusk',
      avatar: 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    messages: mockMessages,
    lastMessageTimestamp: '2025-04-10T15:50:00.000Z',
    unreadCount: 1,
    isActive: true
  },
  {
    id: '2',
    participant: {
      name: 'Bill Gates',
      handle: '@BillGates',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    messages: [
      {
        id: '7',
        content: 'Have you seen the latest AI research paper?',
        timestamp: '2025-04-09T14:20:00.000Z',
        isRead: true,
        isSent: false
      },
      {
        id: '8',
        content: 'Yes, it\'s fascinating! The progress in generative models is incredible.',
        timestamp: '2025-04-09T14:25:00.000Z',
        isRead: true,
        isSent: true
      }
    ],
    lastMessageTimestamp: '2025-04-09T14:25:00.000Z',
    unreadCount: 0,
    isActive: false
  },
  {
    id: '3',
    participant: {
      name: 'NASA',
      handle: '@NASA',
      avatar: 'https://images.pexels.com/photos/41162/moon-landing-apollo-11-nasa-buzz-aldrin-41162.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    messages: [
      {
        id: '9',
        content: 'We\'d like to invite you to our upcoming space tech exhibition!',
        timestamp: '2025-04-08T10:15:00.000Z',
        isRead: true,
        isSent: false
      }
    ],
    lastMessageTimestamp: '2025-04-08T10:15:00.000Z',
    unreadCount: 0,
    isActive: false
  },
  {
    id: '4',
    participant: {
      name: 'Taylor Swift',
      handle: '@taylorswift13',
      avatar: 'https://images.pexels.com/photos/1644888/pexels-photo-1644888.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    messages: [
      {
        id: '10',
        content: 'Thanks for the support on my new album!',
        timestamp: '2025-04-07T18:30:00.000Z',
        isRead: true,
        isSent: false
      },
      {
        id: '11',
        content: 'It\'s amazing! I\'ve been listening to it on repeat.',
        timestamp: '2025-04-07T18:35:00.000Z',
        isRead: true,
        isSent: true
      },
      {
        id: '12',
        content: 'That means a lot! Would you like VIP tickets to my next concert?',
        timestamp: '2025-04-07T18:40:00.000Z',
        isRead: false,
        isSent: false
      }
    ],
    lastMessageTimestamp: '2025-04-07T18:40:00.000Z',
    unreadCount: 1,
    isActive: false
  },
  {
    id: '5',
    participant: {
      name: 'React',
      handle: '@reactjs',
      avatar: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    messages: [
      {
        id: '13',
        content: 'We\'ve just released React 19 with significant performance improvements!',
        timestamp: '2025-04-06T09:10:00.000Z',
        isRead: true,
        isSent: false
      },
      {
        id: '14',
        content: 'That\'s great news! I\'ll update my projects right away.',
        timestamp: '2025-04-06T09:15:00.000Z',
        isRead: true,
        isSent: true
      }
    ],
    lastMessageTimestamp: '2025-04-06T09:15:00.000Z',
    unreadCount: 0,
    isActive: false
  }
];