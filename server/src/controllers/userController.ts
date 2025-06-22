import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import UserModel from '../models/User.js';
import FollowModel from '../models/Follow.js';
import mongoose from 'mongoose';

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const register = async (req: Request, res: Response) => {
  const { name, handle, email, password } = req.body;

  try {
    // Validate input data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already exists
    let user = await UserModel.findOne({ $or: [{ email }, { handle }] });
    if (user) {
      return res.status(400).json({
        message: 'User already exists with this email or handle'
      });
    }

    // Create new user
    user = new UserModel({
      name,
      handle,
      email,
      password,
      joinDate: new Date()
    });

    // Save user to database
    await user.save();

    // Generate JWT token
    const token = user.generateToken();

    // Return user information and token
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        handle: user.handle,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        joinDate: user.joinDate
      },
      token
    });
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Validate input data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user exists
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = user.generateToken();

    // Return user information and token
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        handle: user.handle,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        joinDate: user.joinDate
      },
      token
    });
  } catch (error) {
    console.error('Error in user login:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/:handle
// @access  Public
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { handle } = req.params;
    
    // Find user by handle or id
    let user;
    if (mongoose.Types.ObjectId.isValid(handle)) {
      user = await UserModel.findById(handle);
    } else {
      user = await UserModel.findOne({ handle });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get follower and following counts
    const followersCount = await FollowModel.getFollowersCount(user._id);
    const followingCount = await FollowModel.getFollowingCount(user._id);

    // Check if requesting user is following this profile
    let isFollowing = false;
    if (req.user && req.user.id) {
      isFollowing = await FollowModel.isFollowing(req.user.id, user._id);
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        joinDate: user.joinDate,
        coverImage: user.coverImage,
        followers: followersCount,
        following: followingCount,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response) => {
  try {
    // Validate input data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedUpdates = ['name', 'bio', 'location', 'website', 'avatar', 'coverImage'];
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {} as Record<string, any>);

    const user = await UserModel.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        website: user.website,
        joinDate: user.joinDate,
        coverImage: user.coverImage
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Follow user
// @route   POST /api/users/follow/:id
// @access  Private
export const followUser = async (req: Request, res: Response) => {
  try {
    const userIdToFollow = req.params.id;
    const followerId = req.user.id;

    // Check if users exist
    const userToFollow = await UserModel.findById(userIdToFollow);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User to follow not found' });
    }

    // Check if already following
    const existingFollow = await FollowModel.findOne({
      follower: followerId,
      following: userIdToFollow
    });

    if (existingFollow) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Create follow relationship
    await FollowModel.create({
      follower: followerId,
      following: userIdToFollow
    });

    res.status(200).json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Unfollow user
// @route   DELETE /api/users/follow/:id
// @access  Private
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const userIdToUnfollow = req.params.id;
    const followerId = req.user.id;

    // Delete follow relationship
    const result = await FollowModel.findOneAndDelete({
      follower: followerId,
      following: userIdToUnfollow
    });

    if (!result) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    res.status(200).json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    // Get follow relationships where this user is being followed
    const follows = await FollowModel.find({ following: userId })
      .populate('follower', 'name handle avatar bio')
      .sort({ timestamp: -1 });

    const followers = follows.map(follow => follow.follower);

    res.status(200).json({ followers });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get users that a user is following
// @route   GET /api/users/:id/following
// @access  Public
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    // Get follow relationships where this user is following others
    const follows = await FollowModel.find({ follower: userId })
      .populate('following', 'name handle avatar bio')
      .sort({ timestamp: -1 });

    const following = follows.map(follow => follow.following);

    res.status(200).json({ following });
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search for users by name or handle
    const users = await UserModel.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { handle: { $regex: query, $options: 'i' } }
      ]
    }).select('name handle avatar bio');

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
