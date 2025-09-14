const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
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
  folder: {
    type: String,
    default: 'default',
    trim: true,
    maxlength: [50, 'Folder name cannot exceed 50 characters']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique bookmarks
bookmarkSchema.index({ user: 1, tweet: 1 }, { unique: true });

// Indexes for performance
bookmarkSchema.index({ user: 1, folder: 1, createdAt: -1 });
bookmarkSchema.index({ user: 1, createdAt: -1 });

// Static method to toggle bookmark
bookmarkSchema.statics.toggleBookmark = async function(userId, tweetId, folder = 'default', notes = '') {
  const existingBookmark = await this.findOne({ user: userId, tweet: tweetId });
  
  if (existingBookmark) {
    // Remove bookmark
    await existingBookmark.deleteOne();
    return { bookmarked: false, bookmark: null };
  } else {
    // Add bookmark
    const newBookmark = await this.create({ 
      user: userId, 
      tweet: tweetId,
      folder: folder.trim() || 'default',
      notes: notes.trim()
    });
    return { bookmarked: true, bookmark: newBookmark };
  }
};

// Static method to check if user bookmarked a tweet
bookmarkSchema.statics.isBookmarked = function(userId, tweetId) {
  return this.findOne({ user: userId, tweet: tweetId });
};

// Static method to get user's bookmarks
bookmarkSchema.statics.getUserBookmarks = function(userId, options = {}) {
  const { limit = 20, skip = 0, folder = null } = options;
  
  const query = { user: userId };
  if (folder) query.folder = folder;
  
  return this.find(query)
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

// Static method to get user's bookmark folders
bookmarkSchema.statics.getUserBookmarkFolders = function(userId) {
  return this.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$folder',
        count: { $sum: 1 },
        lastUpdated: { $max: '$createdAt' }
      }
    },
    { $sort: { lastUpdated: -1 } },
    {
      $project: {
        folder: '$_id',
        count: 1,
        lastUpdated: 1,
        _id: 0
      }
    }
  ]);
};

module.exports = mongoose.model('Bookmark', bookmarkSchema);