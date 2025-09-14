const User = require('../models/User');
const Follow = require('../models/Follow');
const Tweet = require('../models/Tweet');
const Notification = require('../models/Notification');

// Get user profile by username
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user;

    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profile = user.getPublicProfile();
    let isFollowing = false;
    let isFollowedBy = false;
    let mutualFollows = [];

    if (currentUser && !currentUser._id.equals(user._id)) {
      // Check follow status
      const [following, followedBy, mutual] = await Promise.all([
        Follow.isFollowing(currentUser._id, user._id),
        Follow.isFollowing(user._id, currentUser._id),
        Follow.getMutualFollows(currentUser._id, user._id)
      ]);

      isFollowing = !!following;
      isFollowedBy = !!followedBy;
      mutualFollows = mutual;
    }

    // Check if profile is private and user doesn't have access
    if (user.settings.isPrivate && !isFollowing && (!currentUser || !currentUser._id.equals(user._id))) {
      profile = {
        ...profile,
        profile: {
          ...profile.profile,
          bio: '',
          location: '',
          website: ''
        },
        stats: {
          followersCount: profile.stats.followersCount,
          followingCount: 0,
          tweetsCount: 0
        }
      };
    }

    res.json({
      success: true,
      data: {
        user: profile,
        relationship: currentUser ? {
          isFollowing,
          isFollowedBy,
          mutualFollowsCount: mutualFollows.length,
          mutualFollows: mutualFollows.slice(0, 3) // Show first 3 mutual follows
        } : null
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Follow/unfollow user
const toggleFollow = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user;

    const userToFollow = await User.findOne({ username, isActive: true });
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Can't follow yourself
    if (currentUser._id.equals(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const existingFollow = await Follow.findOne({
      follower: currentUser._id,
      following: userToFollow._id
    });

    let isFollowing = false;
    let message = '';

    if (existingFollow) {
      // Unfollow
      await existingFollow.deleteOne();
      
      // Update follower/following counts
      await Promise.all([
        User.findByIdAndUpdate(currentUser._id, { $inc: { 'stats.followingCount': -1 } }),
        User.findByIdAndUpdate(userToFollow._id, { $inc: { 'stats.followersCount': -1 } })
      ]);

      message = `Unfollowed @${username}`;
    } else {
      // Follow
      const status = userToFollow.settings.isPrivate ? 'pending' : 'accepted';
      
      await Follow.create({
        follower: currentUser._id,
        following: userToFollow._id,
        status
      });

      if (status === 'accepted') {
        // Update follower/following counts
        await Promise.all([
          User.findByIdAndUpdate(currentUser._id, { $inc: { 'stats.followingCount': 1 } }),
          User.findByIdAndUpdate(userToFollow._id, { $inc: { 'stats.followersCount': 1 } })
        ]);

        // Create notification
        await Notification.createNotification({
          recipient: userToFollow._id,
          sender: currentUser._id,
          type: 'follow',
          message: 'started following you'
        });

        isFollowing = true;
        message = `Following @${username}`;
      } else {
        message = `Follow request sent to @${username}`;
      }
    }

    res.json({
      success: true,
      message,
      data: {
        isFollowing,
        followersCount: userToFollow.stats.followersCount + (isFollowing ? 1 : (existingFollow ? -1 : 0))
      }
    });

  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle follow',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user followers
const getUserFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user can view followers
    if (user.settings.isPrivate && (!currentUser || !currentUser._id.equals(user._id))) {
      const isFollowing = await Follow.isFollowing(currentUser?._id, user._id);
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This account is private'
        });
      }
    }

    const followers = await Follow.find({ 
      following: user._id, 
      status: 'accepted' 
    })
      .populate('follower', 'username profile.displayName profile.avatar profile.bio verification.isVerified stats.followersCount')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Add follow status for current user
    if (currentUser) {
      const followerIds = followers.map(f => f.follower._id);
      const currentUserFollows = await Follow.find({
        follower: currentUser._id,
        following: { $in: followerIds },
        status: 'accepted'
      });

      const followingSet = new Set(currentUserFollows.map(f => f.following.toString()));

      followers.forEach(follow => {
        follow.follower.isFollowedByCurrentUser = followingSet.has(follow.follower._id.toString());
      });
    }

    res.json({
      success: true,
      data: {
        followers: followers.map(f => ({
          ...f.follower.toObject(),
          followedAt: f.createdAt,
          isFollowedByCurrentUser: f.follower.isFollowedByCurrentUser || false
        })),
        pagination: {
          page,
          limit,
          hasMore: followers.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Get user followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user followers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user following
const getUserFollowing = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user can view following
    if (user.settings.isPrivate && (!currentUser || !currentUser._id.equals(user._id))) {
      const isFollowing = await Follow.isFollowing(currentUser?._id, user._id);
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This account is private'
        });
      }
    }

    const following = await Follow.find({ 
      follower: user._id, 
      status: 'accepted' 
    })
      .populate('following', 'username profile.displayName profile.avatar profile.bio verification.isVerified stats.followersCount')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Add follow status for current user
    if (currentUser) {
      const followingIds = following.map(f => f.following._id);
      const currentUserFollows = await Follow.find({
        follower: currentUser._id,
        following: { $in: followingIds },
        status: 'accepted'
      });

      const followingSet = new Set(currentUserFollows.map(f => f.following.toString()));

      following.forEach(follow => {
        follow.following.isFollowedByCurrentUser = followingSet.has(follow.following._id.toString());
      });
    }

    res.json({
      success: true,
      data: {
        following: following.map(f => ({
          ...f.following.toObject(),
          followedAt: f.createdAt,
          isFollowedByCurrentUser: f.following.isFollowedByCurrentUser || false
        })),
        pagination: {
          page,
          limit,
          hasMore: following.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Get user following error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user following',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
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

    const searchRegex = new RegExp(query.trim(), 'i');
    
    const users = await User.find({
      isActive: true,
      $or: [
        { username: searchRegex },
        { 'profile.displayName': searchRegex },
        { 'profile.bio': searchRegex }
      ]
    })
      .select('username profile.displayName profile.avatar profile.bio verification.isVerified stats.followersCount')
      .sort({ 'stats.followersCount': -1, createdAt: -1 })
      .limit(limit)
      .skip(skip);

    // Add follow status for current user
    if (req.user) {
      const userIds = users.map(u => u._id);
      const currentUserFollows = await Follow.find({
        follower: req.user._id,
        following: { $in: userIds },
        status: 'accepted'
      });

      const followingSet = new Set(currentUserFollows.map(f => f.following.toString()));

      users.forEach(user => {
        user.isFollowedByCurrentUser = followingSet.has(user._id.toString());
      });
    }

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          ...user.toObject(),
          isFollowedByCurrentUser: user.isFollowedByCurrentUser || false
        })),
        query,
        pagination: {
          page,
          limit,
          hasMore: users.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get follow suggestions
const getFollowSuggestions = async (req, res) => {
  try {
    const currentUser = req.user;
    const limit = parseInt(req.query.limit) || 5;

    const suggestions = await Follow.getFollowSuggestions(currentUser._id, limit);

    res.json({
      success: true,
      data: {
        suggestions
      }
    });

  } catch (error) {
    console.error('Get follow suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get follow suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's liked tweets
const getUserLikedTweets = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow viewing own liked tweets or if profile is public
    if (!currentUser || (!currentUser._id.equals(user._id) && user.settings.isPrivate)) {
      const isFollowing = await Follow.isFollowing(currentUser?._id, user._id);
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'Cannot view liked tweets'
        });
      }
    }

    const Like = require('../models/Like');
    const likedTweets = await Like.getUserLikedTweets(user._id, { limit, skip });

    res.json({
      success: true,
      data: {
        tweets: likedTweets.map(like => like.tweet),
        pagination: {
          page,
          limit,
          hasMore: likedTweets.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Get user liked tweets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user liked tweets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = req.user;

    const user = await User.findOne({ username, isActive: true });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy
    if (user.settings.isPrivate && (!currentUser || !currentUser._id.equals(user._id))) {
      const isFollowing = await Follow.isFollowing(currentUser?._id, user._id);
      if (!isFollowing) {
        return res.status(403).json({
          success: false,
          message: 'This account is private'
        });
      }
    }

    // Get additional stats
    const [totalLikes, totalRetweets] = await Promise.all([
      Tweet.aggregate([
        { $match: { author: user._id, isDeleted: false } },
        { $group: { _id: null, totalLikes: { $sum: '$stats.likesCount' } } }
      ]),
      Tweet.aggregate([
        { $match: { author: user._id, isDeleted: false } },
        { $group: { _id: null, totalRetweets: { $sum: '$stats.retweetsCount' } } }
      ])
    ]);

    const stats = {
      ...user.stats,
      totalLikes: totalLikes[0]?.totalLikes || 0,
      totalRetweets: totalRetweets[0]?.totalRetweets || 0,
      joinDate: user.createdAt,
      lastActive: user.lastActive
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUserProfile,
  toggleFollow,
  getUserFollowers,
  getUserFollowing,
  searchUsers,
  getFollowSuggestions,
  getUserLikedTweets,
  getUserStats
};