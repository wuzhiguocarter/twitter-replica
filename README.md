# Twitter Replica - Full Stack Social Media Application

A modern, full-featured Twitter clone built with React, TypeScript, Node.js, Express, and MongoDB. This application provides a complete social media experience with real-time features, user authentication, and comprehensive social interactions.

## 🚀 Features

### Core Features
- **User Authentication**: Secure registration, login, and JWT-based authentication
- **Tweet Management**: Create, read, update, delete tweets with rich text support
- **Social Interactions**: Like, retweet, bookmark, and reply to tweets
- **User Profiles**: Customizable profiles with bio, location, website, and avatar
- **Follow System**: Follow/unfollow users with privacy controls
- **Real-time Updates**: Live notifications and feed updates
- **Search**: Search for tweets, users, and hashtags
- **Trending**: Discover trending hashtags and topics

### Advanced Features
- **Media Upload**: Support for images, videos, and GIFs
- **Private Messages**: Direct messaging system
- **Notifications**: Real-time notifications for interactions
- **Bookmarks**: Save tweets to organized folders
- **Quote Tweets**: Quote and comment on tweets
- **Thread Replies**: Nested conversation threads
- **Privacy Controls**: Private accounts and content visibility settings

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Context API** for state management
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **Socket.io** for real-time features
- **Express Validator** for input validation
- **Helmet** for security
- **CORS** for cross-origin requests

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Backend Setup

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/twitter-replica
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your-refresh-token-secret-here
   JWT_REFRESH_EXPIRE=30d
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to project root**:
   ```bash
   cd ..
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🚀 Usage

1. **Access the application**: Open your browser and navigate to `http://localhost:5173`

2. **Create an account**: Click "Sign up" and fill in your details

3. **Start tweeting**: Once logged in, you can:
   - Create tweets with text and media
   - Follow other users
   - Like, retweet, and bookmark tweets
   - Send direct messages
   - Customize your profile

## 📁 Project Structure

```
twitter-replica/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   ├── context/                  # React context providers
│   ├── services/                 # API services
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   └── data/                     # Mock data (for development)
├── server/                       # Backend source code
│   ├── src/
│   │   ├── controllers/          # Route controllers
│   │   ├── middleware/           # Express middleware
│   │   ├── models/               # MongoDB models
│   │   ├── routes/               # API routes
│   │   ├── utils/                # Utility functions
│   │   └── config/               # Configuration files
│   ├── uploads/                  # File upload directory
│   └── tests/                    # Test files
└── .openhands/                   # OpenHands microagents
    └── microagents/
        └── twitter-replica-enhancement.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Tweets
- `GET /api/tweets/feed` - Get user feed
- `POST /api/tweets` - Create new tweet
- `GET /api/tweets/:id` - Get specific tweet
- `DELETE /api/tweets/:id` - Delete tweet
- `POST /api/tweets/:id/like` - Like/unlike tweet
- `POST /api/tweets/:id/retweet` - Retweet/unretweet
- `POST /api/tweets/:id/bookmark` - Bookmark/unbookmark

### Users
- `GET /api/users/:username` - Get user profile
- `POST /api/users/:username/follow` - Follow/unfollow user
- `GET /api/users/:username/tweets` - Get user tweets
- `GET /api/users/:username/followers` - Get user followers
- `GET /api/users/:username/following` - Get user following
- `GET /api/users/search` - Search users

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
npm test
```

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Build the application: `npm run build`
3. Deploy to your preferred platform (Heroku, AWS, DigitalOcean, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your preferred hosting service (Vercel, Netlify, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Twitter's user interface and functionality
- Built with modern web development best practices
- Designed for scalability and maintainability

## 📞 Support

If you have any questions or need help with setup, please open an issue on GitHub or contact the development team.

---

**Happy Tweeting! 🐦**