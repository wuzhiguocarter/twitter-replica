import { Request, Response } from 'express';
import BookmarkModel from '../models/Bookmark.js';
import TweetModel from '../models/Tweet.js';
import mongoose from 'mongoose';

// @desc    Add bookmark for a tweet
// @route   POST /api/bookmarks/:id
// @access  Private
export const addBookmark = async (req: Request, res: Response) => {
  try {
    const tweetId = req.params.id;
    const userId = req.user.id;

    // Check if tweet exists
    const tweet = await TweetModel.findById(tweetId);
    if (!tweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Check if already bookmarked
    const existingBookmark = await BookmarkModel.findOne({ user: userId, tweet: tweetId });
    if (existingBookmark) {
      return res.status(400).json({ message: 'Tweet already bookmarked' });
    }

    // Create bookmark
    const newBookmark = new BookmarkModel({
      user: userId,
      tweet: tweetId
    });

    await newBookmark.save();

    res.status(201).json({ 
      success: true, 
      message: 'Tweet bookmarked successfully'
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove bookmark for a tweet
// @route   DELETE /api/bookmarks/:id
// @access  Private
export const removeBookmark = async (req: Request, res: Response) => {
  try {
    const tweetId = req.params.id;
    const userId = req.user.id;

    // Find and delete bookmark
    const deletedBookmark = await BookmarkModel.findOneAndDelete({
      user: userId,
      tweet: tweetId
    });

    if (!deletedBookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all bookmarked tweets for a user
// @route   GET /api/bookmarks
// @access  Private
export const getBookmarkedTweets = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Get user's bookmarked tweets
    const bookmarkedTweets = await BookmarkModel.getBookmarkedTweetsForUser(userId);
    
    res.status(200).json({ bookmarks: bookmarkedTweets });
  } catch (error) {
    console.error('Error fetching bookmarked tweets:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check if a tweet is bookmarked by user
// @route   GET /api/bookmarks/:id/check
// @access  Private
export const isBookmarked = async (req: Request, res: Response) => {
  try {
    const tweetId = req.params.id;
    const userId = req.user.id;

    const isBookmarked = await BookmarkModel.isTweetBookmarkedByUser(userId, tweetId);
    
    res.status(200).json({ isBookmarked });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
