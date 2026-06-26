import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import GetStarted from './pages/GetStarted';
import Dashboard from './pages/Dashboard';
import GitHubCallback from './pages/GitHubCallback';
import ForgotPassword from './pages/ForgotPassword';

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/signin" element={<SignIn theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/signup" element={<GetStarted theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/github-callback" element={<GitHubCallback />} />
        <Route path="/dashboard/*" element={<Dashboard theme={theme} toggleTheme={toggleTheme} />} />
      </Routes>
    </Router>
  );
}
