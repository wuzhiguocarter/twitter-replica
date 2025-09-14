const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  type: {
    type: String,
    enum: ['like', 'retweet', 'reply', 'follow', 'mention', 'quote'],
    required: [true, 'Notification type is required']
  },
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  },
  message: {
    type: String,
    maxlength: [200, 'Message cannot exceed 200 characters']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ sender: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Prevent duplicate notifications for the same action
notificationSchema.index({ 
  recipient: 1, 
  sender: 1, 
  type: 1, 
  tweet: 1 
}, { 
  unique: true,
  partialFilterExpression: { tweet: { $exists: true } }
});

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const { recipient, sender, type, tweet, message, metadata } = data;
  
  // Don't create notification if sender is the same as recipient
  if (sender.toString() === recipient.toString()) {
    return null;
  }
  
  try {
    const notification = await this.create({
      recipient,
      sender,
      type,
      tweet,
      message,
      metadata
    });
    
    return await notification.populate([
      {
        path: 'sender',
        select: 'username profile.displayName profile.avatar verification.isVerified'
      },
      {
        path: 'tweet',
        select: 'content createdAt',
        populate: {
          path: 'author',
          select: 'username profile.displayName'
        }
      }
    ]);
  } catch (error) {
    // Handle duplicate key error (notification already exists)
    if (error.code === 11000) {
      return null;
    }
    throw error;
  }
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(notificationIds, userId) {
  return this.updateMany(
    { 
      _id: { $in: notificationIds },
      recipient: userId,
      isRead: false
    },
    { 
      isRead: true,
      readAt: new Date()
    }
  );
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { limit = 20, skip = 0, unreadOnly = false } = options;
  
  const query = { recipient: userId };
  if (unreadOnly) query.isRead = false;
  
  return this.find(query)
    .populate('sender', 'username profile.displayName profile.avatar verification.isVerified')
    .populate({
      path: 'tweet',
      select: 'content createdAt media',
      populate: {
        path: 'author',
        select: 'username profile.displayName'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.deleteMany({ 
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
};

// Method to mark single notification as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Notification', notificationSchema);