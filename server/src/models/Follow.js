const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Follower is required']
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Following user is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'accepted'
  },
  notifications: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique follow relationships
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Indexes for performance
followSchema.index({ follower: 1, status: 1 });
followSchema.index({ following: 1, status: 1 });
followSchema.index({ createdAt: -1 });

// Prevent users from following themselves
followSchema.pre('save', function(next) {
  if (this.follower.equals(this.following)) {
    const error = new Error('Users cannot follow themselves');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Static method to check if user A follows user B
followSchema.statics.isFollowing = function(followerId, followingId) {
  return this.findOne({
    follower: followerId,
    following: followingId,
    status: 'accepted'
  });
};

// Static method to get mutual follows
followSchema.statics.getMutualFollows = function(userId1, userId2) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { follower: userId1, status: 'accepted' },
          { follower: userId2, status: 'accepted' }
        ]
      }
    },
    {
      $group: {
        _id: '$following',
        followers: { $addToSet: '$follower' }
      }
    },
    {
      $match: {
        followers: { $all: [userId1, userId2] }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        _id: '$user._id',
        username: '$user.username',
        displayName: '$user.profile.displayName',
        avatar: '$user.profile.avatar',
        isVerified: '$user.verification.isVerified'
      }
    }
  ]);
};

// Static method to get follow suggestions
followSchema.statics.getFollowSuggestions = function(userId, limit = 5) {
  return this.aggregate([
    // Get users that the current user's follows are following
    {
      $match: {
        follower: userId,
        status: 'accepted'
      }
    },
    {
      $lookup: {
        from: 'follows',
        localField: 'following',
        foreignField: 'follower',
        as: 'secondDegreeFollows'
      }
    },
    {
      $unwind: '$secondDegreeFollows'
    },
    {
      $match: {
        'secondDegreeFollows.status': 'accepted',
        'secondDegreeFollows.following': { $ne: userId }
      }
    },
    // Group by suggested user and count mutual connections
    {
      $group: {
        _id: '$secondDegreeFollows.following',
        mutualConnections: { $sum: 1 },
        mutualFollows: { $addToSet: '$following' }
      }
    },
    // Exclude users already followed
    {
      $lookup: {
        from: 'follows',
        let: { suggestedUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$follower', userId] },
                  { $eq: ['$following', '$$suggestedUserId'] }
                ]
              }
            }
          }
        ],
        as: 'existingFollow'
      }
    },
    {
      $match: {
        existingFollow: { $size: 0 }
      }
    },
    // Get user details
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    // Sort by mutual connections and user activity
    {
      $sort: {
        mutualConnections: -1,
        'user.stats.followersCount': -1
      }
    },
    {
      $limit: limit
    },
    {
      $project: {
        _id: '$user._id',
        username: '$user.username',
        displayName: '$user.profile.displayName',
        avatar: '$user.profile.avatar',
        bio: '$user.profile.bio',
        isVerified: '$user.verification.isVerified',
        followersCount: '$user.stats.followersCount',
        mutualConnections: 1,
        mutualFollows: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Follow', followSchema);