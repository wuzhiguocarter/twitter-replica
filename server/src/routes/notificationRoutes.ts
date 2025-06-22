import express from 'express';
import { 
  getNotifications,
  markAsRead,
  getUnreadCount
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All notification routes require authentication
router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, (req, res) => {
  req.params.id = 'all';
  return markAsRead(req, res);
});
router.get('/unread-count', protect, getUnreadCount);

export default router;
