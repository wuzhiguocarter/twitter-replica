import express from 'express';
import { 
  getOrCreateConversation,
  sendMessage,
  getConversations,
  getMessages,
  markMessagesAsRead
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All message routes require authentication
router.get('/conversations', protect, getConversations);
router.post('/conversations/:userId', protect, getOrCreateConversation);
router.get('/conversations/:id/messages', protect, getMessages);
router.post('/conversations/:id/messages', protect, sendMessage);
router.put('/conversations/:id/read', protect, markMessagesAsRead);

export default router;
