const Tweet = require('../models/Tweet');
const User = require('../models/User');
const Like = require('../models/Like');
const Retweet = require('../models/Retweet');
const Bookmark = require('../models/Bookmark');
const Notification = require('../models/Notification');

// Create new tweet
const createTweet = async (req, res) => {
  try {
    const { content, replyTo, quoteTweet, visibility = 'public' } = req.body;
    const author = req.user._id;

    // Create tweet
    const tweet = await Tweet.create({
      author,
      content,
      replyTo: replyTo || null,
      quoteTweet: quoteTweet || null,
      visibility
    });

    // Resolve mentions to user IDs
    if (tweet.mentionUsernames && tweet.mentionUsernames.length > 0) {
      const mentionedUsers = await User.find({
        username: { $in: tweet.mentionUsernames }
      }).select('_id');
      
      tweet.mentions = mentionedUsers.map(user => user._id);
      await tweet.save();
    }

    // Update user's tweet count
    await User.findByIdAndUpdate(author, { $inc: { 'stats.tweetsCount': 1 } });

    // If it's a reply, update reply count of parent tweet
    if (replyTo) {
      await Tweet.findByIdAndUpdate(replyTo, { $inc: { 'stats.repliesCount': 1 } });
      
      // Create notification for reply
      const parentTweet = await Tweet.findById(replyTo).populate('author');
      if (parentTweet && !parentTweet.author._id.equals(author)) {
        await Notification.createNotification({
          recipient: parentTweet.author._id,
          sender: author,
          type: 'reply',
          tweet: tweet._id,
          message: `replied to your tweet`
        });
      }
    }

    // If it's a quote tweet, update quote count
    if (quoteTweet) {
      await Tweet.findByIdAndUpdate(quoteTweet, { $inc: { 'stats.quoteTweetsCount': 1 } });
      
      // Create notification for quote tweet
      const quotedTweet = await Tweet.findById(quoteTweet).populate('author');
      if (quotedTweet && !quotedTweet.author._id.equals(author)) {
        await Notification.createNotification({
          recipient: quotedTweet.author._id,
          sender: author,
          type: 'quote',
          tweet: tweet._id,
          message: `quoted your tweet`
        });
      }
    }

    // Create notifications for mentions
    if (tweet.mentions && tweet.mentions.length > 0) {
      for (const mentionedUserId of tweet.mentions) {
        if (!mentionedUserId.equals(author)) {
          await Notification.createNotification({
            recipient: mentionedUserId,
            sender: author,
            type: 'mention',
            tweet: tweet._id,
            message: `mentioned you in a tweet`
          });
        }
      }
    }

    // Populate and return tweet
    const populatedTweet = await Tweet.findById(tweet._id)
      .populate('author', 'username profile.displayName profile.avatar verification.isVerified')
      .populate('replyTo', 'author content createdAt')
      .populate('quoteTweet', 'author content createdAt media');

    res.status(201).json({
      success: true,
      message: 'Tweet created successfully',
      data: {
        tweet: populatedTweet
      }
    });

  } catch (error) {
    console.error('Create tweet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tweet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get tweet by ID
const getTweet = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const tweet = await Tweet.findOne({ _id: id, isDeleted: false })
      .populate('author', 'username profile.displayName profile.avatar verification.isVerified')
      .populate('replyTo', 'author content createdAt')
      .populate('quoteTweet', 'author content createdAt media')
      .populate('mentions', 'username profile.displayName');

    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }

    // Increment view count if user is different from author
    if (!currentUser || !tweet.author._id.equals(currentUser._id)) {
      tweet.incrementViews();
    }

    // Add user interaction status if authenticated
    let userInteractions = {};
    if (currentUser) {
      const [isLiked, isRetweeted, isBookmarked] = await Promise.all([
        Like.isLiked(currentUser._id, tweet._id),
        Retweet.isRetweeted(currentUser._id, tweet._id),
        Bookmark.isBookmarked(currentUser._id, tweet._id)
      ]);

      userInteractions = {
        isLiked: !!isLiked,
        isRetweeted: !!isRetweeted,
        isBookmarked: !!isBookmarked
      };
    }

    res.json({
      success: true,
      data: {
        tweet: {
          ...tweet.toObject(),
          userInteractions
        }
      }
    });

  } catch (error) {
    console.error('Get tweet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tweet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get tweets feed
const getFeed = async (req, res) => {
  try {
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let query = { isDeleted: false };
    
    if (currentUser) {
      // Get tweets from followed users and own tweets
      const followedUsers = await User.findById(currentUser._id)
        .populate('following', '_id')
        .select('following');
      
      const followedUserIds = followedUsers ? followedUsers.following.map(f => f._id) : [];
      followedUserIds.push(currentUser._id);
      
      query.author = { $in: followedUserIds };
    } else {
      // Public feed for non-authenticated users
      query.visibility = 'public';
    }

    const tweets = await Tweet.find(query)
      .populate('author', 'username profile.displayName profile.avatar verification.isVerified')
      .populate('replyTo', 'author content createdAt')
      .populate('quoteTweet', 'author content createdAt media')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Add user interactions for authenticated users
    if (currentUser && tweets.length > 0) {
      const tweetIds = tweets.map(t => t._id);
      
      const [likes, retweets, bookmarks] = await Promise.all([
        Like.find({ user: currentUser._id, tweet: { $in: tweetIds } }),
        Retweet.find({ user: currentUser._id, tweet: { $in: tweetIds } }),
        Bookmark.find({ user: currentUser._id, tweet: { $in: tweetIds } })
      ]);

      const likedTweetIds = new Set(likes.map(l => l.tweet.toString()));
      const retweetedTweetIds = new Set(retweets.map(r => r.tweet.toString()));
      const bookmarkedTweetIds = new Set(bookmarks.map(b => b.tweet.toString()));

      tweets.forEach(tweet => {
        tweet.userInteractions = {
          isLiked: likedTweetIds.has(tweet._id.toString()),
          isRetweeted: retweetedTweetIds.has(tweet._id.toString()),
          isBookmarked: bookmarkedTweetIds.has(tweet._id.toString())
        };
      });
    }

    res.json({
      success: true,
      data: {
        tweets,
        pagination: {
          page,
          limit,
          hasMore: tweets.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user tweets
const getUserTweets = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const includeReplies = req.query.replies === 'true';

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let query = { 
      author: user._id, 
      isDeleted: false 
    };

    // Exclude replies unless specifically requested
    if (!includeReplies) {
      query.replyTo = null;
    }

    // Check privacy settings
    if (user.settings.isPrivate && (!currentUser || !currentUser._id.equals(user._id))) {
      // Check if current user follows this private user
      const Follow = require('../models/Follow');
      const isFollowing = await Follow.isFollowing(currentUser?._id, user._id);
      
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This account is private'
        });
      }
    }

    const tweets = await Tweet.find(query)
      .populate('author', 'username profile.displayName profile.avatar verification.isVerified')
      .populate('replyTo', 'author content createdAt')
      .populate('quoteTweet', 'author content createdAt media')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Add user interactions for authenticated users
    if (currentUser && tweets.length > 0) {
      const tweetIds = tweets.map(t => t._id);
      
      const [likes, retweets, bookmarks] = await Promise.all([
        Like.find({ user: currentUser._id, tweet: { $in: tweetIds } }),
        Retweet.find({ user: currentUser._id, tweet: { $in: tweetIds } }),
        Bookmark.find({ user: currentUser._id, tweet: { $in: tweetIds } })
      ]);

      const likedTweetIds = new Set(likes.map(l => l.tweet.toString()));
      const retweetedTweetIds = new Set(retweets.map(r => r.tweet.toString()));
      const bookmarkedTweetIds = new Set(bookmarks.map(b => b.tweet.toString()));

      tweets.forEach(tweet => {
        tweet.userInteractions = {
          isLiked: likedTweetIds.has(tweet._id.toString()),
          isRetweeted: retweetedTweetIds.has(tweet._id.toString()),
          isBookmarked: bookmarkedTweetIds.has(tweet._id.toString())
        };
      });
    }

    res.json({
      success: true,
      data: {
        tweets,
        user: user.getPublicProfile(),
        pagination: {
          page,
          limit,
          hasMore: tweets.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Get user tweets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user tweets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Like/unlike tweet
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const tweet = await Tweet.findOne({ _id: id, isDeleted: false });
    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }

    const { liked, like } = await Like.toggleLike(userId, id);

    // Update tweet like count
    const increment = liked ? 1 : -1;
    await Tweet.findByIdAndUpdate(id, { $inc: { 'stats.likesCount': increment } });

    // Create notification for like (not for unlike)
    if (liked && !tweet.author.equals(userId)) {
      await Notification.createNotification({
        recipient: tweet.author,
        sender: userId,
        type: 'like',
        tweet: id,
        message: 'liked your tweet'
      });
    }

    res.json({
      success: true,
      message: liked ? 'Tweet liked' : 'Tweet unliked',
      data: {
        liked,
        likesCount: tweet.stats.likesCount + increment
      }
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Retweet/unretweet
const toggleRetweet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { comment } = req.body;

    const tweet = await Tweet.findOne({ _id: id, isDeleted: false });
    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }

    // Prevent retweeting own tweets
    if (tweet.author.equals(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot retweet your own tweet'
      });
    }

    const { retweeted, retweet } = await Retweet.toggleRetweet(userId, id, comment);

    // Update tweet retweet count
    const increment = retweeted ? 1 : -1;
    await Tweet.findByIdAndUpdate(id, { $inc: { 'stats.retweetsCount': increment } });

    // Create notification for retweet (not for unretweet)
    if (retweeted) {
      await Notification.createNotification({
        recipient: tweet.author,
        sender: userId,
        type: 'retweet',
        tweet: id,
        message: comment ? `retweeted your tweet with comment: "${comment}"` : 'retweeted your tweet'
      });
    }

    res.json({
      success: true,
      message: retweeted ? 'Tweet retweeted' : 'Tweet unretweeted',
      data: {
        retweeted,
        retweetsCount: tweet.stats.retweetsCount + increment,
        retweet
      }
    });

  } catch (error) {
    console.error('Toggle retweet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle retweet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Bookmark/unbookmark tweet
const toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { folder, notes } = req.body;

    const tweet = await Tweet.findOne({ _id: id, isDeleted: false });
    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }

    const { bookmarked, bookmark } = await Bookmark.toggleBookmark(userId, id, folder, notes);

    // Update tweet bookmark count
    const increment = bookmarked ? 1 : -1;
    await Tweet.findByIdAndUpdate(id, { $inc: { 'stats.bookmarksCount': increment } });

    res.json({
      success: true,
      message: bookmarked ? 'Tweet bookmarked' : 'Tweet unbookmarked',
      data: {
        bookmarked,
        bookmarksCount: tweet.stats.bookmarksCount + increment,
        bookmark
      }
    });

  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle bookmark',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete tweet
const deleteTweet = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const tweet = await Tweet.findOne({ _id: id, isDeleted: false });
    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }

    // Check if user owns the tweet
    if (!tweet.author.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own tweets'
      });
    }

    // Soft delete
    tweet.isDeleted = true;
    tweet.deletedAt = new Date();
    await tweet.save();

    // Update user's tweet count
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.tweetsCount': -1 } });

    res.json({
      success: true,
      message: 'Tweet deleted successfully'
    });

  } catch (error) {
    console.error('Delete tweet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tweet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get tweet replies
const getTweetReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const tweet = await Tweet.findOne({ _id: id, isDeleted: false });
    if (!tweet) {
      return res.status(404).json({
        success: false,
        message: 'Tweet not found'
      });
    }

    const replies = await Tweet.find({ 
      replyTo: id, 
      isDeleted: false 
    })
      .populate('author', 'username profile.displayName profile.avatar verification.isVerified')
      .populate('replyTo', 'author content createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Add user interactions for authenticated users
    if (currentUser && replies.length > 0) {
      const replyIds = replies.map(r => r._id);
      
      const [likes, retweets, bookmarks] = await Promise.all([
        Like.find({ user: currentUser._id, tweet: { $in: replyIds } }),
        Retweet.find({ user: currentUser._id, tweet: { $in: replyIds } }),
        Bookmark.find({ user: currentUser._id, tweet: { $in: replyIds } })
      ]);

      const likedTweetIds = new Set(likes.map(l => l.tweet.toString()));
      const retweetedTweetIds = new Set(retweets.map(r => r.tweet.toString()));
      const bookmarkedTweetIds = new Set(bookmarks.map(b => b.tweet.toString()));

      replies.forEach(reply => {
        reply.userInteractions = {
          isLiked: likedTweetIds.has(reply._id.toString()),
          isRetweeted: retweetedTweetIds.has(reply._id.toString()),
          isBookmarked: bookmarkedTweetIds.has(reply._id.toString())
        };
      });
    }

    res.json({
      success: true,
      data: {
        replies,
        pagination: {
          page,
          limit,
          hasMore: replies.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Get tweet replies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tweet replies',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search tweets
const searchTweets = async (req, res) => {
  try {
    const { q: query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const tweets = await Tweet.searchTweets(query, {
      limit,
      skip,
      sortBy: 'createdAt',
      sortOrder: -1
    });

    res.json({
      success: true,
      data: {
        tweets,
        query,
        pagination: {
          page,
          limit,
          hasMore: tweets.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Search tweets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search tweets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get trending hashtags
const getTrendingHashtags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = parseInt(req.query.timeframe) || 24; // hours

    const trends = await Tweet.getTrendingHashtags(limit, timeframe);

    res.json({
      success: true,
      data: {
        trends,
        timeframe: `${timeframe} hours`
      }
    });

  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending hashtags',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createTweet,
  getTweet,
  getFeed,
  getUserTweets,
  toggleLike,
  toggleRetweet,
  toggleBookmark,
  deleteTweet,
  getTweetReplies,
  searchTweets,
  getTrendingHashtags
};