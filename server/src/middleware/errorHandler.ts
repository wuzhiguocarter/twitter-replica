import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Interface for custom error with status code
interface CustomError extends Error {
  statusCode?: number;
  kind?: string;
  path?: string;
  value?: string;
  errors?: any;
}

/**
 * Handle 404 errors for routes that don't exist
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error: CustomError = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler to format and return error responses
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set default status code if not specified
  const statusCode = err.statusCode || 500;
  
  // Format the error response
  const errorResponse = {
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  };

  // Handle specific error types
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages: Record<string, string> = {};
    
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        messages[key] = err.errors[key].message;
      });
    }
    
    return res.status(400).json({
      message: 'Validation Error',
      errors: messages
    });
  }
  
  // Mongoose duplicate key error
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    return res.status(400).json({
      message: `Duplicate field value entered: ${field}. Please use another value.`
    });
  }
  
  // Mongoose CastError (invalid ID)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token. Please log in again.'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token expired. Please log in again.'
    });
  }

  // Log the error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // Send the response
  res.status(statusCode).json(errorResponse);
};
