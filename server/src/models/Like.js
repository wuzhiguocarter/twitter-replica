const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: [true, 'Tweet is required']
  }
}, {
  timestamps: true
});

// Compound index to ensure unique likes
likeSchema.index({ user: 1, tweet: 1 }, { unique: true });

// Indexes for performance
likeSchema.index({ user: 1, createdAt: -1 });
likeSchema.index({ tweet: 1, createdAt: -1 });

// Static method to toggle like
likeSchema.statics.toggleLike = async function(userId, tweetId) {
  const existingLike = await this.findOne({ user: userId, tweet: tweetId });
  
  if (existingLike) {
    // Unlike
    await existingLike.deleteOne();
    return { liked: false, like: null };
  } else {
    // Like
    const newLike = await this.create({ user: userId, tweet: tweetId });
    return { liked: true, like: newLike };
  }
};

// Static method to check if user liked a tweet
likeSchema.statics.isLiked = function(userId, tweetId) {
  return this.findOne({ user: userId, tweet: tweetId });
};

// Static method to get user's liked tweets
likeSchema.statics.getUserLikedTweets = function(userId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({ user: userId })
    .populate({
      path: 'tweet',
      populate: {
        path: 'author',
        select: 'username profile.displayName profile.avatar verification.isVerified'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Like', likeSchema);