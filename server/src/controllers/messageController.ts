import { Request, Response } from 'express';
import ConversationModel from '../models/Conversation.js';
import UserModel from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Get or create conversation between two users
// @route   POST /api/messages/conversations/:userId
// @access  Private
export const getOrCreateConversation = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    // Validate that otherUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Check if other user exists
    const otherUser = await UserModel.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent creating conversation with self
    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Get or create conversation
    const conversation = await ConversationModel.getOrCreateConversation(
      currentUserId,
      otherUserId
    );

    res.status(200).json({ conversation });
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send message in a conversation
// @route   POST /api/messages/conversations/:id/messages
// @access  Private
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const conversationId = req.params.id;
    const senderId = req.user.id;

    // Check if content is provided
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Find conversation
    const conversation = await ConversationModel.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Verify user is a participant in this conversation
    if (!conversation.participants.some(id => id.toString() === senderId)) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }

    // Add message to conversation
    await conversation.addMessage(senderId, content);

    // Get updated conversation with populated fields
    const updatedConversation = await ConversationModel.findById(conversationId)
      .populate('participants', 'name handle avatar')
      .populate({
        path: 'messages.sender',
        select: 'name handle avatar'
      });

    res.status(201).json({ 
      conversation: updatedConversation,
      message: updatedConversation.messages[updatedConversation.messages.length - 1]
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all conversations for a user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    const conversations = await ConversationModel.getConversationsByUser(userId);
    
    // Transform conversations to include only the most recent message
    const formattedConversations = conversations.map(conv => {
      const convObj = conv.toObject();
      
      // Get the other participant (not the current user)
      const otherParticipant = convObj.participants.find(
        p => p._id.toString() !== userId
      );
      
      // Count unread messages not sent by the current user
      const unreadCount = convObj.messages.reduce((count, msg) => {
        if (!msg.isRead && msg.sender.toString() !== userId) {
          return count + 1;
        }
        return count;
      }, 0);
      
      // Get last message
      const sortedMessages = [...convObj.messages].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;
      
      return {
        id: convObj._id,
        participant: otherParticipant,
        lastMessage,
        lastMessageTimestamp: convObj.lastMessageTimestamp,
        unreadCount
      };
    });
    
    res.status(200).json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages in a conversation
// @route   GET /api/messages/conversations/:id/messages
// @access  Private
export const getMessages = async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    
    // Find conversation
    const conversation = await ConversationModel.findById(conversationId)
      .populate('messages.sender', 'name handle avatar');
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Verify user is a participant in this conversation
    if (!conversation.participants.some(id => id.toString() === userId)) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }
    
    // Sort messages by timestamp (oldest first for chat display)
    const messages = [...conversation.messages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Add isSent field based on sender
    const processedMessages = messages.map(msg => {
      const msgObj = msg.toObject ? msg.toObject() : msg;
      return {
        ...msgObj,
        isSent: msg.sender._id.toString() === userId || msg.sender.toString() === userId
      };
    });
    
    res.status(200).json({ messages: processedMessages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Mark messages in a conversation as read
// @route   PUT /api/messages/conversations/:id/read
// @access  Private
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    
    // Find conversation
    const conversation = await ConversationModel.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Verify user is a participant in this conversation
    if (!conversation.participants.some(id => id.toString() === userId)) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }
    
    // Mark messages as read
    await conversation.markMessagesAsRead(userId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Messages marked as read' 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
