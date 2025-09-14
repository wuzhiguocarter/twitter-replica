const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    trim: true
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif', 'document'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: String,
    filename: String,
    size: Number
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
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
  }]
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, isRead: 1 });

// Method to mark message as read
messageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to mark multiple messages as read
messageSchema.statics.markAsRead = function(messageIds, userId) {
  return this.updateMany(
    { 
      _id: { $in: messageIds },
      sender: { $ne: userId }, // Don't mark own messages as read
      isRead: false
    },
    { 
      isRead: true,
      readAt: new Date()
    }
  );
};

module.exports = mongoose.model('Message', messageSchema);

// Conversation Schema
const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String,
    maxlength: [100, 'Conversation name cannot exceed 100 characters'],
    trim: true
  },
  avatar: String,
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  settings: {
    muted: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      mutedAt: {
        type: Date,
        default: Date.now
      }
    }],
    archived: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      archivedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
conversationSchema.index({ participants: 1, lastActivity: -1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ 'participants': 1, 'settings.archived.user': 1 });

// Ensure direct conversations have exactly 2 participants
conversationSchema.pre('save', function(next) {
  if (this.type === 'direct' && this.participants.length !== 2) {
    const error = new Error('Direct conversations must have exactly 2 participants');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Static method to find or create direct conversation
conversationSchema.statics.findOrCreateDirectConversation = async function(user1Id, user2Id) {
  // Check if conversation already exists
  let conversation = await this.findOne({
    type: 'direct',
    participants: { $all: [user1Id, user2Id] }
  }).populate('participants', 'username profile.displayName profile.avatar')
    .populate('lastMessage');
  
  if (!conversation) {
    // Create new conversation
    conversation = await this.create({
      type: 'direct',
      participants: [user1Id, user2Id]
    });
    
    conversation = await conversation.populate('participants', 'username profile.displayName profile.avatar');
  }
  
  return conversation;
};

// Static method to get user conversations
conversationSchema.statics.getUserConversations = function(userId, options = {}) {
  const { limit = 20, skip = 0, includeArchived = false } = options;
  
  const matchQuery = {
    participants: userId,
    isActive: true
  };
  
  if (!includeArchived) {
    matchQuery['settings.archived.user'] = { $ne: userId };
  }
  
  return this.find(matchQuery)
    .populate('participants', 'username profile.displayName profile.avatar verification.isVerified')
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username profile.displayName'
      }
    })
    .sort({ lastActivity: -1 })
    .limit(limit)
    .skip(skip);
};

// Method to get unread message count for user
conversationSchema.methods.getUnreadCount = function(userId) {
  return mongoose.model('Message').countDocuments({
    conversation: this._id,
    sender: { $ne: userId },
    isRead: false
  });
};

// Method to update last activity
conversationSchema.methods.updateLastActivity = function(messageId = null) {
  this.lastActivity = new Date();
  if (messageId) {
    this.lastMessage = messageId;
  }
  return this.save();
};

module.exports.Conversation = mongoose.model('Conversation', conversationSchema);