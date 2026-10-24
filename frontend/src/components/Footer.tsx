import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-ivory-300 dark:border-slate-800 bg-ivory-200/60 dark:bg-slate-900/60 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-plum-800 flex items-center justify-center text-gold-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-plum-900 dark:text-white">
                CelebrAI
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every Celebration, Perfectly Planned.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
            <Link to="/dashboard" className="hover:text-plum-800 dark:hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/plan" className="hover:text-plum-800 dark:hover:text-white transition-colors">
              Plan Celebration
            </Link>
            <Link to="/ideas" className="hover:text-plum-800 dark:hover:text-white transition-colors">
              Inspiration Ideas
            </Link>
            <Link to="/settings" className="hover:text-plum-800 dark:hover:text-white transition-colors">
              Settings
            </Link>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for celebrations worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
};
