import mongoose from 'mongoose';
import { Tweet } from '../types/index.js';

const TweetSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Tweet must have an author']
  },
  content: {
    type: String,
    required: [true, 'Tweet must have content'],
    maxlength: 280
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  retweets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    default: []
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for counts
TweetSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

TweetSchema.virtual('retweetsCount').get(function() {
  return this.retweets.length;
});

TweetSchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Indexes for optimized queries
TweetSchema.index({ author: 1, timestamp: -1 });
TweetSchema.index({ timestamp: -1 });
TweetSchema.index({ 'likes': 1 });
TweetSchema.index({ 'retweets': 1 });

// Static method to populate author information
TweetSchema.statics.populateAuthor = function(query) {
  return this.populate(query, {
    path: 'author',
    select: 'name handle avatar'
  });
};

// Method to get full tweet with all related information
TweetSchema.statics.findByIdWithDetails = async function(id) {
  return await this.findById(id)
    .populate('author', 'name handle avatar')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'name handle avatar'
      }
    });
};

const TweetModel = mongoose.model<Tweet & mongoose.Document>('Tweet', TweetSchema);

export default TweetModel;
