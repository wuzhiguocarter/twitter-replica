import express from 'express';
import { 
  createTweet,
  getFeed,
  getTweet,
  getTweetReplies,
  replyToTweet,
  likeTweet,
  unlikeTweet,
  retweetTweet,
  unretweetTweet,
  deleteTweet,
  getUserTweets
} from '../controllers/tweetController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/:id', getTweet);
router.get('/:id/replies', getTweetReplies);
router.get('/user/:handle', getUserTweets);

// Protected routes - require authentication
router.post('/', protect, createTweet);
router.get('/feed', protect, getFeed);
router.post('/:id/reply', protect, replyToTweet);
router.post('/:id/like', protect, likeTweet);
router.delete('/:id/like', protect, unlikeTweet);
router.post('/:id/retweet', protect, retweetTweet);
router.delete('/:id/retweet', protect, unretweetTweet);
router.delete('/:id', protect, deleteTweet);

export default router;
