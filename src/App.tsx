
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { TweetProvider } from './context/TweetContext';
import { Profile } from './components/Profile';
import { Feed } from './components/Feed';
import { Bookmarks } from './components/Bookmarks';
import { Notifications } from './components/Notifications';
import { Messages } from './components/Messages';
import { Login } from './components/Login';
import { Register } from './components/Register';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TweetProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Feed />} />
                <Route path="bookmarks" element={<Bookmarks />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="messages" element={<Messages />} />
                <Route path=":username" element={<Profile />} />
              </Route>
            </Routes>
          </Router>
        </TweetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;