const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(protect); // All routes below require authentication

router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', validateUserUpdate, updateProfile);
router.put('/change-password', changePassword);
router.delete('/deactivate', deactivateAccount);

module.exports = router;