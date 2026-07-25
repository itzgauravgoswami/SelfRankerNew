import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('sr_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleAction = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="relative min-h-screen text-slate-800 dark:text-zinc-350 antialiased transition-colors duration-300 flex flex-col justify-between">
      {/* Original Navbar */}
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Decorative Grid Overlay (consistent with project design) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(243,239,252,0.4),rgba(250,249,254,0.95))] dark:bg-[linear-gradient(to_bottom,rgba(8,10,16,0.4),rgba(9,9,11,0.95))] pointer-events-none -z-10" />

      {/* Main Content Area - Simple & Clean Design */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-36 pb-24 z-10 max-w-4xl mx-auto">
        <h1 className="text-9xl font-black font-display bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 animate-float">
          404
        </h1>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-base text-slate-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed">
          The page you are looking for doesn't exist, was removed, or had its name changed. Let's get you back on track.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
          <button
            onClick={handleAction}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 transition-all active:scale-95 hover:scale-[1.02] cursor-pointer"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Return Home'}
            <Home size={16} />
          </button>
        </div>
      </main>

      {/* Original Footer */}
      <footer className="border-t border-purple-100 dark:border-zinc-900/80 bg-white/70 dark:bg-zinc-950/40 pt-16 pb-12 px-4 sm:px-6 lg:px-8 z-10 w-full">
        <div className="max-w-7xl mx-auto">
          {/* Top section: Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Column 1: Brand & Tagline */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/Assets/Logos/Logo (MAIN).png" alt="Self Ranker Logo" className="h-8 w-auto object-contain brightness-110 contrast-105" />
                <span className="text-2xl font-black font-display bg-gradient-to-r from-purple-600 via-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Self Ranker
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed max-w-sm font-sans">
                The ultimate preparation platform for engineering grads. Build skills, assess percentile rankings, and benchmark progress to secure dream placements.
              </p>
              <div className="flex gap-4">
                <a href="#github" className="w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center cursor-pointer">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                </a>
                <a href="#linkedin" className="w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center cursor-pointer">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                  </svg>
                </a>
                <a href="#twitter" className="w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-900 text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center justify-center cursor-pointer">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Product */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-display">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/#features" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Features</a></li>
                <li><a href="/#how-it-works" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Roadmap</a></li>
                <li><a href="/#pricing" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Pricing</a></li>
                <li><a href="/#faq" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">FAQ</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-display">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#blog" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Coding Guides</a></li>
                <li><a href="#mocktests" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Mock Assessment</a></li>
                <li><a href="#leaderboards" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Cohort Ranks</a></li>
                <li><a href="#universities" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Partnerships</a></li>
              </ul>
            </div>

            {/* Column 4: Legal & Contact */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-display">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/#about" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">About Us</a></li>
                <li><a href="#careers" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans inline-flex items-center gap-1.5">Careers <span className="px-1.5 py-0.5 text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-semibold rounded-full border border-purple-100 dark:border-purple-900/50">Hiring</span></a></li>
                <li><a href="#privacy" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Privacy Policy</a></li>
                <li><a href="#terms" className="text-slate-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-sans">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar Section */}
          <div className="pt-8 border-t border-purple-100/60 dark:border-zinc-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p className="text-slate-400 dark:text-zinc-550 font-sans">
              © {new Date().getFullYear()} Self Ranker. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900/40 px-3 py-1.5 rounded-full border border-slate-100 dark:border-zinc-800/80">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium font-sans">All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
