import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ArrowRight,
  Home,
  Info,
  Sparkles,
  Compass,
  MessageSquare,
  CreditCard,
  HelpCircle,
  Sun,
  Moon,
  LayoutDashboard,
  LogOut
} from 'lucide-react';

export default function Navbar({ theme, toggleTheme }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [logoError, setLogoError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('sr_logged_in') === 'true');

  // Keep auth state in sync across tabs
  useEffect(() => {
    const sync = () => setIsLoggedIn(localStorage.getItem('sr_logged_in') === 'true');
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sr_logged_in');
    localStorage.removeItem('sr_token');
    setIsLoggedIn(false);
    setIsOpen(false);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', href: '#home', id: 'home', icon: Home },
    { name: 'About', href: '#about', id: 'about', icon: Info },
    { name: 'Features', href: '#features', id: 'features', icon: Sparkles },
    { name: 'How It Works', href: '#how-it-works', id: 'how-it-works', icon: Compass },
    { name: 'Testimonials', href: '#testimonials', id: 'testimonials', icon: MessageSquare },
    { name: 'Pricing', href: '#pricing', id: 'pricing', icon: CreditCard },
    { name: 'FAQ', href: '#faq', id: 'faq', icon: HelpCircle },
  ];

  // Track scroll position to adjust navbar styles (sticky/glass effect)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track scroll position to update active section in viewport
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -50% 0px', // Center-focused trigger
      threshold: 0,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    navLinks.forEach((link) => {
      const section = document.getElementById(link.id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [navLinks]);

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setIsOpen(false);
    const targetElement = document.querySelector(href);
    if (targetElement) {
      const offset = 80; // Offset for sticky navbar height
      const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  };

  const isDark = theme === 'dark';
  // Custom double linear-gradients for border-image effect: solid background inside padding-box, colorful gradient on border-box
  const navbarStyle = {
    border: '1.5px solid transparent',
    background: isDark
      ? 'linear-gradient(#09090b, #09090b) padding-box, linear-gradient(to right, #18181b 0%, #8b5cf6 40%, #a855f7 60%, #18181b 100%) border-box'
      : 'linear-gradient(white, white) padding-box, linear-gradient(to right, #09090b 0%, #7c3aed 40%, #c084fc 60%, #09090b 100%) border-box',
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl transition-all duration-300 ${
        isScrolled ? 'scale-[0.99] drop-shadow-md' : 'drop-shadow-sm'
      }`}
    >
      <nav
        className={`w-full transition-all duration-300 ${
          isDark ? 'bg-zinc-950' : 'bg-white'
        } px-4 sm:px-6 lg:px-8 py-3 ${
          isOpen ? 'rounded-[24px]' : 'rounded-full'
        }`}
        style={navbarStyle}
      >
        <div className="flex items-center justify-between">
          {/* Logo Brand Section */}
          <div className="flex-shrink-0 flex items-center pl-2">
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, '#home')}
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              {!logoError && (
                <img
                  src="/Assets/Logos/Logo (MAIN).png"
                  alt="Self Ranker Logo"
                  onError={() => setLogoError(true)}
                  className={`h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105 ${
                    isDark ? 'brightness-110 contrast-105' : ''
                  }`}
                />
              )}
              <span className="text-lg sm:text-xl font-black tracking-tight font-display bg-gradient-to-r from-purple-600 via-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent transition-all group-hover:opacity-90 animate-text-shine">
                Self Ranker
              </span>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={`relative px-3 py-2 text-sm font-medium transition-all duration-250 rounded-md flex items-center gap-1.5 ${
                    isActive 
                      ? 'text-purple-600 dark:text-purple-400 font-semibold font-display' 
                      : 'text-gray-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20'
                  }`}
                >
                  <link.icon size={14} className={isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-zinc-500'} />
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse-glow" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Desktop CTA Action Buttons */}
          <div className="hidden lg:flex items-center space-x-4 pr-2">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300 hover:scale-105 cursor-pointer flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 px-3 py-2 cursor-pointer"
                >
                  <LayoutDashboard size={15} />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-white rounded-full group bg-gradient-to-br from-red-500 to-rose-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-red-200 dark:focus:ring-red-900 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 hover:scale-102 cursor-pointer"
                >
                  <span className="relative px-5 py-2 transition-all ease-in duration-75 bg-transparent rounded-full flex items-center gap-1.5 font-display font-semibold tracking-wide">
                    <LogOut size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    Logout
                  </span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 px-3 py-2 cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-white rounded-full group bg-gradient-to-br from-purple-600 to-indigo-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-900 shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-102 cursor-pointer"
                >
                  <span className="relative px-5 py-2 transition-all ease-in duration-75 bg-transparent rounded-full flex items-center gap-1.5 font-display font-semibold tracking-wide">
                    Get Started
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls: Theme Toggle + Drawer Trigger */}
          <div className="flex lg:hidden items-center space-x-2 pr-2">
            <button
              onClick={toggleTheme}
              type="button"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 cursor-pointer flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-colors cursor-pointer"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isOpen
              ? 'max-h-[500px] opacity-100 mt-4 border-t border-purple-100/50 dark:border-zinc-800/80 pt-4 pb-2'
              : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
          }`}
          id="mobile-menu"
        >
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                    isActive
                      ? 'text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/30 font-bold border-l-4 border-purple-600 font-display'
                      : 'text-gray-600 dark:text-zinc-400 hover:bg-purple-50/40 dark:hover:bg-purple-950/10 hover:text-purple-600 dark:hover:text-purple-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon size={16} className={isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-zinc-500'} />
                    {link.name}
                  </div>
                  {isActive && <span className="h-2 w-2 rounded-full bg-purple-600 dark:bg-purple-400 animate-ping" />}
                </a>
              );
            })}

            <div className="pt-4 border-t border-purple-100/60 dark:border-zinc-800/60 mt-4 px-2 flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-2.5 text-base font-semibold text-gray-700 dark:text-zinc-300 rounded-lg hover:bg-purple-50/50 dark:hover:bg-purple-950/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 text-center text-base font-semibold text-white rounded-full bg-gradient-to-r from-red-500 to-rose-600 shadow-md shadow-red-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    onClick={() => setIsOpen(false)}
                    className="w-full text-center py-2.5 text-base font-semibold text-gray-700 dark:text-zinc-300 rounded-lg hover:bg-purple-50/50 dark:hover:bg-purple-950/10 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer block"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 text-center text-base font-semibold text-white rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md shadow-purple-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Get Started
                    <ArrowRight size={16} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
