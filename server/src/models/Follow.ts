import mongoose from 'mongoose';
import { Follow } from '../types/index.js';

const FollowSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Follower user is required']
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Following user is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create compound unique index to prevent duplicate follow relationships
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

// Static method to get followers count for a user
FollowSchema.statics.getFollowersCount = async function(userId) {
  return await this.countDocuments({ following: userId });
};

// Static method to get following count for a user
FollowSchema.statics.getFollowingCount = async function(userId) {
  return await this.countDocuments({ follower: userId });
};

// Static method to check if a user is following another user
FollowSchema.statics.isFollowing = async function(followerId, followingId) {
  const follow = await this.findOne({ follower: followerId, following: followingId });
  return !!follow;
};

const FollowModel = mongoose.model<Follow & mongoose.Document>('Follow', FollowSchema);

export default FollowModel;
