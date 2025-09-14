const mongoose = require('mongoose');

const retweetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: [true, 'Tweet is required']
  },
  comment: {
    type: String,
    maxlength: [280, 'Retweet comment cannot exceed 280 characters'],
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique retweets
retweetSchema.index({ user: 1, tweet: 1 }, { unique: true });

// Indexes for performance
retweetSchema.index({ user: 1, createdAt: -1 });
retweetSchema.index({ tweet: 1, createdAt: -1 });

// Static method to toggle retweet
retweetSchema.statics.toggleRetweet = async function(userId, tweetId, comment = '') {
  const existingRetweet = await this.findOne({ user: userId, tweet: tweetId });
  
  if (existingRetweet) {
    // Un-retweet
    await existingRetweet.deleteOne();
    return { retweeted: false, retweet: null };
  } else {
    // Retweet
    const newRetweet = await this.create({ 
      user: userId, 
      tweet: tweetId,
      comment: comment.trim()
    });
    return { retweeted: true, retweet: newRetweet };
  }
};

// Static method to check if user retweeted a tweet
retweetSchema.statics.isRetweeted = function(userId, tweetId) {
  return this.findOne({ user: userId, tweet: tweetId });
};

// Static method to get user's retweets
retweetSchema.statics.getUserRetweets = function(userId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({ user: userId })
    .populate({
      path: 'tweet',
      populate: {
        path: 'author',
        select: 'username profile.displayName profile.avatar verification.isVerified'
      }
    })
    .populate('user', 'username profile.displayName profile.avatar verification.isVerified')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Retweet', retweetSchema);