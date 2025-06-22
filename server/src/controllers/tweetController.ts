import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import TweetModel from '../models/Tweet.js';
import UserModel from '../models/User.js';
import FollowModel from '../models/Follow.js';
import NotificationModel from '../models/Notification.js';
import mongoose from 'mongoose';

// @desc    Create a new tweet
// @route   POST /api/tweets
// @access  Private
export const createTweet = async (req: Request, res: Response) => {
  try {
    // Validate input data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    
    // Check content length
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Tweet content is required' });
    }
    
    if (content.length > 280) {
      return res.status(400).json({ message: 'Tweet cannot exceed 280 characters' });
    }

    // Create new tweet
    const tweet = new TweetModel({
      author: req.user.id,
      content,
      timestamp: new Date()
    });

    // Save tweet to database
    await tweet.save();

    // Populate author information for response
    const populatedTweet = await TweetModel.findById(tweet._id).populate('author', 'name handle avatar');

    res.status(201).json(populatedTweet);
  } catch (error) {
    console.error('Error creating tweet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get tweets for feed (from followed users and self)
// @route   GET /api/tweets/feed
// @access  Private
export const getFeed = async (req: Request, res: Response) => {
  try {
    // Get users the current user is following
    const followedUsers = await FollowModel.find({ follower: req.user.id })
      .select('following -_id');
    
    // Extract user ids
    const followingIds = followedUsers.map(follow => follow.following);
    
    // Add current user to get their tweets too
    followingIds.push(req.user.id);
    
    // Fetch tweets from followed users and self
    const tweets = await TweetModel.find({ author: { $in: followingIds } })
      .populate('author', 'name handle avatar')
      .sort({ timestamp: -1 })
      .limit(50);  // Limit results for performance

    // Check which tweets are liked/retweeted by the current user
    const processedTweets = await Promise.all(tweets.map(async (tweet) => {
      const tweetObj = tweet.toObject();
      tweetObj.isLiked = tweet.likes.some(userId => userId.toString() === req.user.id);
      tweetObj.isRetweeted = tweet.retweets.some(userId => userId.toString() === req.user.id);
      return tweetObj;
    }));

    res.status(200).json({ tweets: processedTweets });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get a single tweet by ID
// @route   GET /api/tweets/:id
// @access  Public
export const getTweet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const tweet = await TweetModel.findByIdWithDetails(id);
    
    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if tweet is liked/retweeted by current user if logged in
    const tweetObj = tweet.toObject();
    if (req.user) {
      tweetObj.isLiked = tweet.likes.some(userId => userId.toString() === req.user.id);
      tweetObj.isRetweeted = tweet.retweets.some(userId => userId.toString() === req.user.id);
    }

    res.status(200).json({ tweet: tweetObj });
  } catch (error) {
    console.error('Error fetching tweet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Like a tweet
// @route   POST /api/tweets/:id/like
// @access  Private
export const likeTweet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find tweet to like
    const tweet = await TweetModel.findById(id);
    
    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }
    
    // Check if user already liked the tweet
    if (tweet.likes.includes(userId)) {
      return res.status(400).json({ message: 'Tweet already liked' });
    }
    
    // Add user to likes array
    tweet.likes.push(userId);
    await tweet.save();
    
    // Create notification for the tweet author (if not self-like)
    if (tweet.author.toString() !== userId) {
      await NotificationModel.createNotification(
        'like',
        tweet.author,
        userId,
        tweet._id
      );
    }
    
    res.status(200).json({ 
      success: true, 
      likesCount: tweet.likes.length 
    });
  } catch (error) {
    console.error('Error liking tweet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unlike a tweet
// @route   DELETE /api/tweets/:id/like
// @access  Private
export const unlikeTweet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find tweet to unlike
    const tweet = await TweetModel.findById(id);
    
    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }
    
    // Check if user already liked the tweet
    if (!tweet.likes.includes(userId)) {
      return res.status(400).json({ message: 'Tweet not liked yet' });
    }
    
    // Remove user from likes array
    tweet.likes = tweet.likes.filter(id => id.toString() !== userId);
    await tweet.save();
    
    res.status(200).json({ 
      success: true, 
      likesCount: tweet.likes.length 
    });
  } catch (error) {
    console.error('Error unliking tweet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Retweet a tweet
// @route   POST /api/tweets/:id/retweet
// @access  Private
export const retweetTweet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find tweet to retweet
    const tweet = await TweetModel.findById(id);
    
    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }
    
    // Check if user already retweeted the tweet
    if (tweet.retweets.includes(userId)) {
      return res.status(400).json({ message: 'Already retweeted' });
    }
    
    // Add user to retweets array
    tweet.retweets.push(userId);
    await tweet.save();
    
    // Create notification for the tweet author (if not self-retweet)
    if (tweet.author.toString() !== userId) {
      await NotificationModel.createNotification(
        'retweet',
        tweet.author,
        userId,
        tweet._id
      );
    }
    
    res.status(200).json({ 
      success: true, 
      retweetsCount: tweet.retweets.length 
    });
  } catch (error) {
    console.error('Error retweeting tweet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unretweet a tweet
// @route   DELETE /api/tweets/:id/retweet
// @access  Private
export const unretweetTweet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Find tweet to unretweet
    const tweet = await TweetModel.findById(id);
    
    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }
    
    // Check if user already retweeted the tweet
    if (!tweet.retweets.includes(userId)) {
      return res.status(400).json({ message: 'Not retweeted yet' });
    }
    
    // Remove user from retweets array
    tweet.retweets = tweet.retweets.filter(id => id.toString() !== userId);
    await tweet.save();
    
    res.status(200).json({ 
      success: true, 
      retweetsCount: tweet.retweets.length 
    });
  } catch (error) {
    console.error('Error unretweeting tweet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reply to a tweet
// @route   POST /api/tweets/:id/reply
// @access  Private
export const replyToTweet = async (req: Request, res: Response) => {
  try {
    // Validate input data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;
    
    // Find parent tweet
    const parentTweet = await TweetModel.findById(id);
    
    if (!parentTweet) {
      return res.status(404).json({ message: 'Parent tweet not found' });
    }
    
    // Create reply tweet
    const replyTweet = new TweetModel({
      author: req.user.id,
      content,
      timestamp: new Date()
    });
    
    // Save reply tweet
    await replyTweet.save();
    
    // Add reply to parent tweet
    parentTweet.replies.push(replyTweet._id);
    await parentTweet.save();
    
    // Create notification for parent tweet author (if not self-reply)
    if (parentTweet.author.toString() !== req.user.id) {
      await NotificationModel.createNotification(
        'reply',
        parentTweet.author,
        req.user.id,
        parentTweet._id
      );
    }
    
    // Populate reply tweet author for response
    const populatedReply = await TweetModel.findById(replyTweet._id).populate('author', 'name handle avatar');
    
    res.status(201).json({
      success: true,
      reply: populatedReply,
      repliesCount: parentTweet.replies.length
    });
  } catch (error) {
    console.error('Error replying to tweet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get replies to a tweet
// @route   GET /api/tweets/:id/replies
// @access  Public
export const getTweetReplies = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find tweet
    const tweet = await TweetModel.findById(id);
    
    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }
    
    // Get all replies
    const replies = await TweetModel.find({ _id: { $in: tweet.replies } })
      .populate('author', 'name handle avatar')
      .sort({ timestamp: -1 });
    
    // Check which replies are liked/retweeted by current user if logged in
    let processedReplies = replies;
    if (req.user) {
      processedReplies = replies.map(reply => {
        const replyObj = reply.toObject();
        replyObj.isLiked = reply.likes.includes(req.user.id);
        replyObj.isRetweeted = reply.retweets.includes(req.user.id);
        return replyObj;
      });
    }
    
    res.status(200).json({ replies: processedReplies });
  } catch (error) {
    console.error('Error fetching tweet replies:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a tweet
// @route   DELETE /api/tweets/:id
// @access  Private
export const deleteTweet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Find tweet
    const tweet = await TweetModel.findById(id);
    
    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }
    
    // Check if user is the tweet author
    if (tweet.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this tweet' });
    }
    
    // Delete tweet
    await tweet.remove();
    
    // If this was a reply, remove it from the parent tweet's replies array
    if (req.query.parentId) {
      const parentTweet = await TweetModel.findById(req.query.parentId);
      if (parentTweet) {
        parentTweet.replies = parentTweet.replies.filter(
          replyId => replyId.toString() !== id
        );
        await parentTweet.save();
      }
    }
    
    res.status(200).json({ success: true, message: 'Tweet deleted' });
  } catch (error) {
    console.error('Error deleting tweet:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get tweets by a specific user
// @route   GET /api/tweets/user/:handle
// @access  Public
export const getUserTweets = async (req: Request, res: Response) => {
  try {
    const { handle } = req.params;
    
    // Find user by handle
    const user = await UserModel.findOne({ handle });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all tweets by this user
    const tweets = await TweetModel.find({ author: user._id })
      .populate('author', 'name handle avatar')
      .sort({ timestamp: -1 });
    
    // Check which tweets are liked/retweeted by current user if logged in
    let processedTweets = tweets;
    if (req.user) {
      processedTweets = tweets.map(tweet => {
        const tweetObj = tweet.toObject();
        tweetObj.isLiked = tweet.likes.includes(req.user.id);
        tweetObj.isRetweeted = tweet.retweets.includes(req.user.id);
        return tweetObj;
      });
    }
    
    res.status(200).json({ tweets: processedTweets });
  } catch (error) {
    console.error('Error fetching user tweets:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
