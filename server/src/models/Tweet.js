const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Tweet must have an author']
  },
  content: {
    type: String,
    required: [true, 'Tweet content is required'],
    maxlength: [280, 'Tweet cannot exceed 280 characters'],
    trim: true
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: String, // For Cloudinary
    alt: String,
    dimensions: {
      width: Number,
      height: Number
    }
  }],
  hashtags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    default: null
  },
  quoteTweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    default: null
  },
  stats: {
    likesCount: {
      type: Number,
      default: 0
    },
    retweetsCount: {
      type: Number,
      default: 0
    },
    repliesCount: {
      type: Number,
      default: 0
    },
    quoteTweetsCount: {
      type: Number,
      default: 0
    },
    bookmarksCount: {
      type: Number,
      default: 0
    },
    viewsCount: {
      type: Number,
      default: 0
    }
  },
  engagement: {
    impressions: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'mentioned'],
    default: 'public'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    name: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
tweetSchema.index({ author: 1, createdAt: -1 });
tweetSchema.index({ createdAt: -1 });
tweetSchema.index({ hashtags: 1 });
tweetSchema.index({ mentions: 1 });
tweetSchema.index({ replyTo: 1 });
tweetSchema.index({ 'stats.likesCount': -1 });
tweetSchema.index({ isDeleted: 1 });

// Text index for search functionality
tweetSchema.index({ 
  content: 'text',
  hashtags: 'text'
}, {
  weights: {
    content: 10,
    hashtags: 5
  }
});

// Virtual for tweet age
tweetSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for engagement rate calculation
tweetSchema.virtual('calculatedEngagementRate').get(function() {
  const totalEngagements = this.stats.likesCount + this.stats.retweetsCount + this.stats.repliesCount;
  return this.stats.viewsCount > 0 ? (totalEngagements / this.stats.viewsCount) * 100 : 0;
});

// Pre-save middleware to extract hashtags and mentions
tweetSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Extract hashtags
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(this.content)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }
    this.hashtags = [...new Set(hashtags)]; // Remove duplicates

    // Extract mentions (will be resolved to user IDs in the controller)
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    while ((match = mentionRegex.exec(this.content)) !== null) {
      mentions.push(match[1].toLowerCase());
    }
    this.mentionUsernames = mentions; // Temporary field for processing
  }
  next();
});

// Method to increment view count
tweetSchema.methods.incrementViews = function() {
  this.stats.viewsCount += 1;
  this.engagement.impressions += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to update engagement rate
tweetSchema.methods.updateEngagementRate = function() {
  const totalEngagements = this.stats.likesCount + this.stats.retweetsCount + this.stats.repliesCount;
  this.engagement.engagementRate = this.stats.viewsCount > 0 ? (totalEngagements / this.stats.viewsCount) * 100 : 0;
  return this.save({ validateBeforeSave: false });
};

// Static method to get trending hashtags
tweetSchema.statics.getTrendingHashtags = function(limit = 10, timeframe = 24) {
  const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: since },
        isDeleted: false,
        hashtags: { $exists: true, $ne: [] }
      }
    },
    { $unwind: '$hashtags' },
    {
      $group: {
        _id: '$hashtags',
        count: { $sum: 1 },
        totalEngagement: {
          $sum: {
            $add: ['$stats.likesCount', '$stats.retweetsCount', '$stats.repliesCount']
          }
        }
      }
    },
    { $sort: { count: -1, totalEngagement: -1 } },
    { $limit: limit },
    {
      $project: {
        hashtag: '$_id',
        tweetCount: '$count',
        engagement: '$totalEngagement',
        _id: 0
      }
    }
  ]);
};

// Static method for search
tweetSchema.statics.searchTweets = function(query, options = {}) {
  const {
    limit = 20,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = -1,
    author = null,
    hashtag = null,
    dateFrom = null,
    dateTo = null
  } = options;

  const searchQuery = {
    isDeleted: false,
    $text: { $search: query }
  };

  if (author) searchQuery.author = author;
  if (hashtag) searchQuery.hashtags = hashtag.toLowerCase();
  if (dateFrom || dateTo) {
    searchQuery.createdAt = {};
    if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
    if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
  }

  return this.find(searchQuery)
    .populate('author', 'username profile.displayName profile.avatar verification.isVerified')
    .populate('replyTo', 'author content createdAt')
    .populate('quoteTweet', 'author content createdAt media')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Tweet', tweetSchema);