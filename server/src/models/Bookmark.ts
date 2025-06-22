import mongoose from 'mongoose';
import { Bookmark } from '../types/index.js';

const BookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for bookmark']
  },
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    required: [true, 'Tweet is required for bookmark']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create compound unique index to prevent duplicate bookmarks
BookmarkSchema.index({ user: 1, tweet: 1 }, { unique: true });

// Static method to get all bookmarked tweets for a user
BookmarkSchema.statics.getBookmarkedTweetsForUser = async function(userId) {
  const bookmarks = await this.find({ user: userId })
    .populate({
      path: 'tweet',
      populate: {
        path: 'author',
        select: 'name handle avatar'
      }
    })
    .sort({ timestamp: -1 });
  
  // Transform to return tweets with isBookmarked flag
  return bookmarks.map(bookmark => {
    const tweet = bookmark.tweet.toObject();
    tweet.isBookmarked = true;
    return tweet;
  });
};

// Static method to check if a tweet is bookmarked by a user
BookmarkSchema.statics.isTweetBookmarkedByUser = async function(userId, tweetId) {
  const bookmark = await this.findOne({ user: userId, tweet: tweetId });
  return !!bookmark;
};

const BookmarkModel = mongoose.model<Bookmark & mongoose.Document>('Bookmark', BookmarkSchema);

export default BookmarkModel;
