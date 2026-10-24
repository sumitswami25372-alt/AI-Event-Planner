import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, Plus, Moon, Sun, Settings } from 'lucide-react';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-ivory-300/80 dark:border-slate-800 bg-ivory-100/90 dark:bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-ivory-200 dark:hover:bg-slate-800 rounded-xl"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-plum-800 to-plum-600 flex items-center justify-center text-gold-400 shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-plum-900 dark:text-white flex items-center gap-1.5">
                CelebrAI
                <span className="text-[10px] font-sans font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300 border border-plum-200 dark:border-plum-800">
                  AI
                </span>
              </span>
              <span className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                Every Celebration, Perfectly Planned
              </span>
            </div>
          </Link>
        </div>

        {/* Global Nav actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/plan"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-plum-800 to-plum-700 hover:from-plum-900 hover:to-plum-800 shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4 text-gold-400" />
            <span className="hidden xs:inline">Create Event</span>
          </Link>

          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-ivory-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-gold-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            to="/settings"
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-ivory-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
