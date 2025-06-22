import mongoose from 'mongoose';
import { Notification } from '../types/index.js';

// Define notification types enum
type NotificationType = 'like' | 'retweet' | 'reply' | 'follow' | 'mention';

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['like', 'retweet', 'reply', 'follow', 'mention'],
    required: [true, 'Notification type is required']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification recipient is required']
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification actor is required']
  },
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    // Only required for tweet-related notifications
    required: function() {
      return ['like', 'retweet', 'reply', 'mention'].includes(this.type);
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimized queries
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, timestamp: -1 });
NotificationSchema.index({ actor: 1, recipient: 1, type: 1 });

// Static method to create a notification
NotificationSchema.statics.createNotification = async function(
  type: NotificationType,
  recipientId: mongoose.Types.ObjectId,
  actorId: mongoose.Types.ObjectId,
  tweetId?: mongoose.Types.ObjectId
) {
  const notification = {
    type,
    recipient: recipientId,
    actor: actorId,
    isRead: false
  };

  // Add tweet reference for tweet-related notifications
  if (['like', 'retweet', 'reply', 'mention'].includes(type) && tweetId) {
    Object.assign(notification, { tweet: tweetId });
  }

  try {
    const newNotification = await this.create(notification);
    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = async function(
  notificationId?: mongoose.Types.ObjectId | string,
  recipientId?: mongoose.Types.ObjectId | string
) {
  try {
    // If notificationId is provided, mark specific notification as read
    if (notificationId) {
      return await this.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
    }
    
    // If recipientId is provided, mark all notifications for this user as read
    if (recipientId) {
      return await this.updateMany(
        { recipient: recipientId, isRead: false },
        { isRead: true }
      );
    }
    
    return null;
  } catch (error) {
    console.error('Error marking notification(s) as read:', error);
    throw error;
  }
};

// Static method to get unread notifications count for a user
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipient: userId, isRead: false });
};

const NotificationModel = mongoose.model<Notification & mongoose.Document>('Notification', NotificationSchema);

export default NotificationModel;
