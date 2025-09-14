const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .trim(),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('displayName')
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters')
    .trim(),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('Username or email is required')
    .trim(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters')
    .trim(),
  
  body('bio')
    .optional()
    .isLength({ max: 160 })
    .withMessage('Bio cannot exceed 160 characters')
    .trim(),
  
  body('location')
    .optional()
    .isLength({ max: 30 })
    .withMessage('Location cannot exceed 30 characters')
    .trim(),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL')
    .isLength({ max: 100 })
    .withMessage('Website URL cannot exceed 100 characters'),
  
  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid birth date'),
  
  handleValidationErrors
];

// Tweet validation rules
const validateTweetCreation = [
  body('content')
    .isLength({ min: 1, max: 280 })
    .withMessage('Tweet content must be between 1 and 280 characters')
    .trim(),
  
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply tweet ID'),
  
  body('quoteTweet')
    .optional()
    .isMongoId()
    .withMessage('Invalid quote tweet ID'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'followers', 'mentioned'])
    .withMessage('Visibility must be public, followers, or mentioned'),
  
  handleValidationErrors
];

const validateTweetUpdate = [
  body('content')
    .optional()
    .isLength({ min: 1, max: 280 })
    .withMessage('Tweet content must be between 1 and 280 characters')
    .trim(),
  
  handleValidationErrors
];

// Message validation rules
const validateMessageCreation = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters')
    .trim(),
  
  body('recipientId')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID'),
  
  handleValidationErrors
];

// Conversation validation rules
const validateConversationCreation = [
  body('participants')
    .isArray({ min: 1, max: 10 })
    .withMessage('Participants must be an array with 1-10 members'),
  
  body('participants.*')
    .isMongoId()
    .withMessage('Invalid participant ID'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Conversation name must be between 1 and 100 characters')
    .trim(),
  
  handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  
  handleValidationErrors
];

const validateUsername = [
  param('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim(),
  
  query('type')
    .optional()
    .isIn(['tweets', 'users', 'hashtags'])
    .withMessage('Search type must be tweets, users, or hashtags'),
  
  handleValidationErrors
];

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const file = req.file || req.files[0];
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4'
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Allowed types: ' + allowedTypes.join(', ')
    });
  }

  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`
    });
  }

  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateTweetCreation,
  validateTweetUpdate,
  validateMessageCreation,
  validateConversationCreation,
  validateObjectId,
  validateUsername,
  validatePagination,
  validateSearch,
  validateFileUpload
};