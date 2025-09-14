import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { tweetAPI, handleApiError } from '../services/api';
import { Tweet } from '../types';

interface TweetState {
  tweets: Tweet[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
}

interface TweetContextType extends TweetState {
  loadFeed: (page?: number) => Promise<void>;
  loadUserTweets: (username: string, page?: number, includeReplies?: boolean) => Promise<void>;
  createTweet: (content: string, replyTo?: string, quoteTweet?: string) => Promise<void>;
  likeTweet: (tweetId: string) => Promise<void>;
  retweetTweet: (tweetId: string, comment?: string) => Promise<void>;
  bookmarkTweet: (tweetId: string, folder?: string, notes?: string) => Promise<void>;
  deleteTweet: (tweetId: string) => Promise<void>;
  searchTweets: (query: string, page?: number) => Promise<void>;
  clearTweets: () => void;
  clearError: () => void;
}

type TweetAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: { tweets: Tweet[]; hasMore: boolean; page: number; append?: boolean } }
  | { type: 'LOAD_FAILURE'; payload: string }
  | { type: 'CREATE_TWEET_SUCCESS'; payload: Tweet }
  | { type: 'UPDATE_TWEET'; payload: Tweet }
  | { type: 'DELETE_TWEET_SUCCESS'; payload: string }
  | { type: 'CLEAR_TWEETS' }
  | { type: 'CLEAR_ERROR' };

const initialState: TweetState = {
  tweets: [],
  isLoading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
};

const tweetReducer = (state: TweetState, action: TweetAction): TweetState => {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        tweets: action.payload.append 
          ? [...state.tweets, ...action.payload.tweets]
          : action.payload.tweets,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.page,
        isLoading: false,
        error: null,
      };
    case 'LOAD_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'CREATE_TWEET_SUCCESS':
      return {
        ...state,
        tweets: [action.payload, ...state.tweets],
        error: null,
      };
    case 'UPDATE_TWEET':
      return {
        ...state,
        tweets: state.tweets.map(tweet =>
          tweet.id === action.payload.id ? action.payload : tweet
        ),
        error: null,
      };
    case 'DELETE_TWEET_SUCCESS':
      return {
        ...state,
        tweets: state.tweets.filter(tweet => tweet.id !== action.payload),
        error: null,
      };
    case 'CLEAR_TWEETS':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

const TweetContext = createContext<TweetContextType | undefined>(undefined);

export const useTweets = (): TweetContextType => {
  const context = useContext(TweetContext);
  if (!context) {
    throw new Error('useTweets must be used within a TweetProvider');
  }
  return context;
};

interface TweetProviderProps {
  children: ReactNode;
}

export const TweetProvider: React.FC<TweetProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tweetReducer, initialState);

  const loadFeed = async (page: number = 1): Promise<void> => {
    try {
      dispatch({ type: 'LOAD_START' });
      
      const response = await tweetAPI.getFeed({ page, limit: 20 });
      
      if (response.data.success) {
        const { tweets, pagination } = response.data.data;
        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            tweets,
            hasMore: pagination.hasMore,
            page: pagination.page,
            append: page > 1,
          },
        });
      } else {
        dispatch({ type: 'LOAD_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      dispatch({ type: 'LOAD_FAILURE', payload: handleApiError(error) });
    }
  };

  const loadUserTweets = async (
    username: string,
    page: number = 1,
    includeReplies: boolean = false
  ): Promise<void> => {
    try {
      dispatch({ type: 'LOAD_START' });
      
      const response = await tweetAPI.getUserTweets(username, {
        page,
        limit: 20,
        replies: includeReplies,
      });
      
      if (response.data.success) {
        const { tweets, pagination } = response.data.data;
        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            tweets,
            hasMore: pagination.hasMore,
            page: pagination.page,
            append: page > 1,
          },
        });
      } else {
        dispatch({ type: 'LOAD_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      dispatch({ type: 'LOAD_FAILURE', payload: handleApiError(error) });
    }
  };

  const createTweet = async (
    content: string,
    replyTo?: string,
    quoteTweet?: string
  ): Promise<void> => {
    try {
      const response = await tweetAPI.createTweet({
        content,
        replyTo,
        quoteTweet,
      });
      
      if (response.data.success) {
        const tweet = response.data.data.tweet;
        dispatch({ type: 'CREATE_TWEET_SUCCESS', payload: tweet });
      } else {
        dispatch({ type: 'LOAD_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      dispatch({ type: 'LOAD_FAILURE', payload: handleApiError(error) });
    }
  };

  const likeTweet = async (tweetId: string): Promise<void> => {
    try {
      const response = await tweetAPI.likeTweet(tweetId);
      
      if (response.data.success) {
        // Update the tweet in the state
        const updatedTweets = state.tweets.map(tweet => {
          if (tweet.id === tweetId) {
            return {
              ...tweet,
              stats: {
                ...tweet.stats,
                likes: response.data.data.likesCount,
              },
              userInteractions: {
                ...tweet.userInteractions,
                isLiked: response.data.data.liked,
              },
            };
          }
          return tweet;
        });
        
        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            tweets: updatedTweets,
            hasMore: state.hasMore,
            page: state.currentPage,
          },
        });
      } else {
        dispatch({ type: 'LOAD_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      dispatch({ type: 'LOAD_FAILURE', payload: handleApiError(error) });
    }
  };

  const retweetTweet = async (tweetId: string, comment?: string): Promise<void> => {
    try {
      const response = await tweetAPI.retweetTweet(tweetId, comment);
      
      if (response.data.success) {
        // Update the tweet in the state
        const updatedTweets = state.tweets.map(tweet => {
          if (tweet.id === tweetId) {
            return {
              ...tweet,
              stats: {
                ...tweet.stats,
                retweets: response.data.data.retweetsCount,
              },
              userInteractions: {
                ...tweet.userInteractions,
                isRetweeted: response.data.data.retweeted,
              },
            };
          }
          return tweet;
        });
        
        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            tweets: updatedTweets,
            hasMore: state.hasMore,
            page: state.currentPage,
          },
        });
      } else {
        dispatch({ type: 'LOAD_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      dispatch({ type: 'LOAD_FAILURE', payload: handleApiError(error) });
    }
  };

  const bookmarkTweet = async (
    tweetId: string,
    folder?: string,
    notes?: string
  ): Promise<void> => {
    try {
      const response = await tweetAPI.bookmarkTweet(tweetId, folder, notes);
      
      if (response.data.success) {
        // Update the tweet in the state
        const updatedTweets = state.tweets.map(tweet => {
          if (tweet.id === tweetId) {
            return {
              ...tweet,
              userInteractions: {
                ...tweet.userInteractions,
                isBookmarked: response.data.data.bookmarked,
              },
            };
          }
          return tweet;
        });
        
        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            tweets: updatedTweets,
            hasMore: state.hasMore,
            page: state.currentPage,
          },
        });
      } else {
        dispatch({ type: 'LOAD_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      dispatch({ type: 'LOAD_FAILURE', payload: handleApiError(error) });
    }
  };

  const deleteTweet = async (tweetId: string): Promise<void> => {
    try {
      const response = await tweetAPI.deleteTweet(tweetId);
      
      if (response.data.success) {
        dispatch({ type: 'DELETE_TWEET_SUCCESS', payload: tweetId });
      } else {
        dispatch({ type: 'LOAD_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      dispatch({ type: 'LOAD_FAILURE', payload: handleApiError(error) });
    }
  };

  const searchTweets = async (query: string, page: number = 1): Promise<void> => {
    try {
      dispatch({ type: 'LOAD_START' });
      
      const response = await tweetAPI.searchTweets(query, { page, limit: 20 });
      
      if (response.data.success) {
        const { tweets, pagination } = response.data.data;
        dispatch({
          type: 'LOAD_SUCCESS',
          payload: {
            tweets,
            hasMore: pagination.hasMore,
            page: pagination.page,
            append: page > 1,
          },
        });
      } else {
        dispatch({ type: 'LOAD_FAILURE', payload: response.data.message });
      }
    } catch (error: any) {
      dispatch({ type: 'LOAD_FAILURE', payload: handleApiError(error) });
    }
  };

  const clearTweets = (): void => {
    dispatch({ type: 'CLEAR_TWEETS' });
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: TweetContextType = {
    ...state,
    loadFeed,
    loadUserTweets,
    createTweet,
    likeTweet,
    retweetTweet,
    bookmarkTweet,
    deleteTweet,
    searchTweets,
    clearTweets,
    clearError,
  };

  return (
    <TweetContext.Provider value={value}>
      {children}
    </TweetContext.Provider>
  );
};

export default TweetContext;