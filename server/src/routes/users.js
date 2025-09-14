const express = require('express');
const router = express.Router();

const {
  getUserProfile,
  toggleFollow,
  getUserFollowers,
  getUserFollowing,
  searchUsers,
  getFollowSuggestions,
  getUserLikedTweets,
  getUserStats
} = require('../controllers/userController');

const { getUserTweets } = require('../controllers/tweetController');

const { protect, optionalAuth } = require('../middleware/auth');
const {
  validateUsername,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

// Public routes (with optional auth)
router.get('/search', optionalAuth, validateSearch, validatePagination, searchUsers);
router.get('/:username', optionalAuth, validateUsername, getUserProfile);
router.get('/:username/tweets', optionalAuth, validateUsername, validatePagination, getUserTweets);
router.get('/:username/followers', optionalAuth, validateUsername, validatePagination, getUserFollowers);
router.get('/:username/following', optionalAuth, validateUsername, validatePagination, getUserFollowing);
router.get('/:username/likes', optionalAuth, validateUsername, validatePagination, getUserLikedTweets);
router.get('/:username/stats', optionalAuth, validateUsername, getUserStats);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/:username/follow', validateUsername, toggleFollow);
router.get('/suggestions/follow', getFollowSuggestions);

module.exports = router;