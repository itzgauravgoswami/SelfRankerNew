import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText, HelpCircle, MessageSquare, Tv, Bot, Trophy, BarChart2, Map,
  ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Settings, X
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/dashboard/ai-notes', label: 'AI Notes', icon: FileText },
  { path: '/dashboard/ai-quiz', label: 'AI Quiz', icon: HelpCircle },
  { path: '/dashboard/ai-qa', label: 'AI Q&A', icon: MessageSquare },
  { path: '/dashboard/supreme-learning', label: 'Supreme Learning', icon: Tv },
  { path: '/dashboard/ai-tutor', label: 'AI Tutor', icon: Bot },
  { path: '/dashboard/gamification', label: 'Gamification', icon: Trophy },
  { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/dashboard/learning-path', label: 'Learning Path', icon: Map },
  { path: '/dashboard/settings', label: 'Account Settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, isMobile }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('sr_logged_in');
    localStorage.removeItem('sr_token');
    navigate('/');
  };

  // On mobile: sidebar is hidden when collapsed, full-width drawer when open
  // On desktop: sidebar is 70px when collapsed, 240px when expanded
  const isHidden = isMobile && collapsed;

  const closeSidebar = () => {
    if (isMobile) setCollapsed(true);
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen z-40 flex flex-col
          bg-white/90 dark:bg-zinc-950/95 backdrop-blur-xl
          border-r border-purple-100/60 dark:border-zinc-800/60
          transition-all duration-300 ease-in-out
          ${isMobile
            ? collapsed
              ? '-translate-x-full w-[260px]'   // hidden off-screen on mobile
              : 'translate-x-0 w-[260px] shadow-2xl shadow-black/20' // visible drawer on mobile
            : collapsed
              ? 'w-[70px] translate-x-0'          // mini sidebar on desktop
              : 'w-[240px] translate-x-0'          // full sidebar on desktop
          }
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-purple-100/50 dark:border-zinc-800/50 ${collapsed && !isMobile ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center">
            <img
              src="/Assets/Logos/Logo (MAIN).png"
              alt="Self Ranker Logo"
              className="w-full h-full object-contain"
            />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex-1">
              <p className="font-display font-bold text-sm text-slate-800 dark:text-white leading-tight">Self Ranker</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">AI Dashboard</p>
            </div>
          )}
          {/* Close button on mobile */}
          {isMobile && !collapsed && (
            <button onClick={closeSidebar} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/70 transition-colors ml-auto">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <div className={`mb-2 ${collapsed && !isMobile ? 'px-2' : 'px-3'}`}>
            {(!collapsed || isMobile) && (
              <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-2">Modules</p>
            )}
            {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => {
              const isActive = exact
                ? location.pathname === path
                : location.pathname.startsWith(path) && path !== '/dashboard';
              const isOverview = path === '/dashboard' && location.pathname === '/dashboard';

              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={closeSidebar}
                  className={`
                    flex items-center gap-3 rounded-xl mb-1
                    transition-all duration-200 group relative
                    ${collapsed && !isMobile ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'}
                    ${(isActive || isOverview)
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-zinc-800/70 hover:text-purple-700 dark:hover:text-purple-300'
                    }
                  `}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {(!collapsed || isMobile) && (
                    <span className="text-sm font-medium truncate">{label}</span>
                  )}
                  {/* Tooltip on collapsed desktop only */}
                  {collapsed && !isMobile && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                      {label}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Logout + Collapse Toggle */}
        <div className={`p-3 border-t border-purple-100/50 dark:border-zinc-800/50 space-y-1`}>
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 rounded-xl px-3 py-2.5
              text-red-500 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-950/30
              hover:text-red-600 dark:hover:text-red-300
              transition-all duration-200 group relative
              ${collapsed && !isMobile ? 'justify-center' : ''}
            `}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {(!collapsed || isMobile) && <span className="text-sm font-semibold">Logout</span>}
            {collapsed && !isMobile && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                Logout
              </div>
            )}
          </button>

          {/* Collapse toggle — desktop only */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`
                w-full flex items-center gap-3 rounded-xl px-3 py-2.5
                text-slate-500 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-zinc-800/70
                hover:text-purple-600 dark:hover:text-purple-400
                transition-all duration-200
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              {!collapsed && <span className="text-sm font-medium">Collapse</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
