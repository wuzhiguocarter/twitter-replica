import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import tweetRoutes from './routes/tweetRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Load environment variables from .env file
dotenv.config();

// Create Express application
const app = express();

// Connect to database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Define API prefix from environment or use default
const API_PREFIX = process.env.API_PREFIX || '/api';

// Routes
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/tweets`, tweetRoutes);
app.use(`${API_PREFIX}/bookmarks`, bookmarkRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Twitter Clone API is running...');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Set port from environment or use default
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;
