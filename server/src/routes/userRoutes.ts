import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing, 
  searchUsers 
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/search', searchUsers);
router.get('/:handle', getProfile);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

// Protected routes - require authentication
router.put('/profile', protect, updateProfile);
router.post('/follow/:id', protect, followUser);
router.delete('/follow/:id', protect, unfollowUser);

export default router;
