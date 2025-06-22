import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:');
    console.error(error);
    
    // Retry logic
    console.log('Attempting to reconnect in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

export default connectDB;
