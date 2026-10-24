import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home, ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-3xl bg-plum-100 dark:bg-plum-950/80 text-plum-800 dark:text-plum-400 flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-gold-500" />
      </div>

      <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
        404 — Celebration Not Found
      </h1>

      <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-md">
        The celebration page or resource you are looking for does not exist or has been relocated.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 hover:bg-ivory-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 shadow-sm transition-all"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
