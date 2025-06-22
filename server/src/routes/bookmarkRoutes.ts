import express from 'express';
import { 
  addBookmark,
  removeBookmark,
  getBookmarkedTweets,
  isBookmarked
} from '../controllers/bookmarkController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All bookmark routes require authentication
router.get('/', protect, getBookmarkedTweets);
router.post('/:id', protect, addBookmark);
router.delete('/:id', protect, removeBookmark);
router.get('/:id/check', protect, isBookmarked);

export default router;
