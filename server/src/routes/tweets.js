const express = require('express');
const router = express.Router();

const {
  createTweet,
  getTweet,
  getFeed,
  getUserTweets,
  toggleLike,
  toggleRetweet,
  toggleBookmark,
  deleteTweet,
  getTweetReplies,
  searchTweets,
  getTrendingHashtags
} = require('../controllers/tweetController');

const { protect, optionalAuth } = require('../middleware/auth');
const {
  validateTweetCreation,
  validateObjectId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

// Public routes (with optional auth)
router.get('/feed', optionalAuth, validatePagination, getFeed);
router.get('/search', optionalAuth, validateSearch, validatePagination, searchTweets);
router.get('/trending', getTrendingHashtags);
router.get('/:id', optionalAuth, validateObjectId('id'), getTweet);
router.get('/:id/replies', optionalAuth, validateObjectId('id'), validatePagination, getTweetReplies);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/', validateTweetCreation, createTweet);
router.delete('/:id', validateObjectId('id'), deleteTweet);

// Tweet interactions
router.post('/:id/like', validateObjectId('id'), toggleLike);
router.post('/:id/retweet', validateObjectId('id'), toggleRetweet);
router.post('/:id/bookmark', validateObjectId('id'), toggleBookmark);

module.exports = router;