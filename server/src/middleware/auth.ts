import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to protect routes that require authentication
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token from header (format: "Bearer TOKEN")
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check if token exists in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token found, return 401 Unauthorized
  if (!token) {
    return res.status(401).json({
      message: 'Not authorized to access this resource, no token provided'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'defaultsecret'
    ) as jwt.JwtPayload;

    // Get user from database using ID from token
    const user = await UserModel.findById(decoded.id).select('-password');

    // If user not found, return 401 Unauthorized
    if (!user) {
      return res.status(401).json({
        message: 'Not authorized to access this resource, user not found'
      });
    }

    // Add user to request object
    req.user = user;
    
    // Proceed to next middleware/controller
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      message: 'Not authorized to access this resource, token invalid'
    });
  }
};
