import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ThemeProvider } from './context/ThemeContext';
import { Profile } from './components/Profile';
import { Feed } from './components/Feed';
import { Bookmarks } from './components/Bookmarks';
import { Notifications } from './components/Notifications';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Feed />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path=":username" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;