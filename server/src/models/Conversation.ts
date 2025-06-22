import mongoose from 'mongoose';
import { Message, Conversation } from '../types/index.js';

// Define Message Schema
const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Message sender is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

// Define Conversation Schema
const ConversationSchema = new mongoose.Schema({
  participants: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    validate: [
      {
        validator: function(arr: mongoose.Types.ObjectId[]) {
          return arr.length === 2;
        },
        message: 'A conversation must have exactly 2 participants'
      }
    ],
    required: [true, 'Participants are required for a conversation']
  },
  messages: [MessageSchema],
  lastMessageTimestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for efficient queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastMessageTimestamp: -1 });

// Virtual field for unread count
ConversationSchema.virtual('unreadCount').get(function() {
  if (!this.messages) return 0;
  
  return this.messages.reduce((count: number, message: any) => {
    // Count messages that are not from the current user and are unread
    if (!message.isRead) {
      return count + 1;
    }
    return count;
  }, 0);
});

// Pre-save middleware to update lastMessageTimestamp
ConversationSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    // Sort messages by timestamp to get the most recent one
    const sortedMessages = [...this.messages].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    this.lastMessageTimestamp = sortedMessages[0].timestamp;
  }
  next();
});

// Static method to get conversations for a user
ConversationSchema.statics.getConversationsByUser = async function(userId: mongoose.Types.ObjectId) {
  return await this.find({ participants: userId })
    .populate('participants', 'name handle avatar')
    .sort({ lastMessageTimestamp: -1 });
};

// Static method to get or create a conversation between two users
ConversationSchema.statics.getOrCreateConversation = async function(userId1: mongoose.Types.ObjectId, userId2: mongoose.Types.ObjectId) {
  // First check if conversation already exists
  const existingConversation = await this.findOne({
    participants: { $all: [userId1, userId2] }
  }).populate('participants', 'name handle avatar');
  
  if (existingConversation) {
    return existingConversation;
  }
  
  // If not exists, create new conversation
  const newConversation = await this.create({
    participants: [userId1, userId2],
    messages: []
  });
  
  return this.findById(newConversation._id)
    .populate('participants', 'name handle avatar');
};

// Method to add a new message to the conversation
ConversationSchema.methods.addMessage = async function(
  sender: mongoose.Types.ObjectId,
  content: string
) {
  const newMessage = {
    sender,
    content,
    timestamp: new Date(),
    isRead: false
  };
  
  this.messages.push(newMessage);
  this.lastMessageTimestamp = newMessage.timestamp;
  
  await this.save();
  return this;
};

// Method to mark all messages as read for a specific user
ConversationSchema.methods.markMessagesAsRead = async function(userId: mongoose.Types.ObjectId) {
  if (!this.messages || this.messages.length === 0) return this;
  
  let updated = false;
  
  // Mark messages as read if they were sent by someone other than the specified user
  this.messages.forEach((message: any) => {
    if (!message.isRead && message.sender.toString() !== userId.toString()) {
      message.isRead = true;
      updated = true;
    }
  });
  
  if (updated) {
    await this.save();
  }
  
  return this;
};

const ConversationModel = mongoose.model<Conversation & mongoose.Document>('Conversation', ConversationSchema);

export default ConversationModel;
