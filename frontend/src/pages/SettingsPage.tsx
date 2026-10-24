import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Moon,
  Sun,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { ConfigResponse } from '../services/types';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { useAppToast } from '../layouts/AppLayout';

export const SettingsPage: React.FC = () => {
  const { showToast } = useAppToast();

  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Local preferences
  const [preferredCurrency, setPreferredCurrency] = useState(() => {
    return localStorage.getItem('celebrai_pref_currency') || 'INR';
  });

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('celebrai_theme') === 'dark';
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoadingConfig(true);
        const data = await api.getConfig();
        setConfig(data);
      } catch (err) {
        console.error('Failed to load backend config', err);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  const handleCurrencyChange = (newCurr: string) => {
    setPreferredCurrency(newCurr);
    localStorage.setItem('celebrai_pref_currency', newCurr);
    showToast(`Default preference set to ${newCurr}`, 'success');
  };

  const handleThemeToggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('celebrai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('celebrai_theme', 'light');
    }
    showToast(`Switched to ${next ? 'Dark' : 'Light'} Mode`, 'info');
  };

  return (
    <div className="max-w-3xl mx-auto py-6 pb-16 space-y-8">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-plum-100 dark:bg-plum-950 text-plum-800 dark:text-plum-300 text-xs font-semibold mb-2">
          <Settings className="w-3.5 h-3.5 text-gold-500" />
          <span>System Preferences</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
          Application Preferences & AI Diagnostics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure interface appearance, preferred financial currency, and check server engine capabilities.
        </p>
      </div>

      {/* General Preferences Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white pb-3 border-b border-ivory-200 dark:border-slate-800">
          User Interface & Regional Preferences
        </h2>

        {/* Currency setting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-plum-700" />
              Default Celebration Currency
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Preselects the default currency when creating new celebration blueprints.
            </p>
          </div>

          <select
            value={preferredCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-bold"
          >
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Theme setting */}
        <div className="pt-4 border-t border-ivory-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              {isDark ? <Moon className="w-4 h-4 text-gold-400" /> : <Sun className="w-4 h-4 text-gold-500" />}
              Appearance Mode
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle between Warm Ivory light mode and Midnight Plum dark mode.
            </p>
          </div>

          <button
            onClick={handleThemeToggle}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-ivory-100 dark:bg-slate-800 hover:bg-ivory-200 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
          </button>
        </div>
      </div>

      {/* Backend Engine Diagnostics Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
        <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white pb-3 border-b border-ivory-200 dark:border-slate-800 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-plum-700" />
          Backend AI & System Diagnostics
        </h2>

        {isLoadingConfig ? (
          <div className="text-xs text-slate-400 animate-pulse">Checking backend engine status...</div>
        ) : config ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-ivory-50 dark:bg-slate-800/60 border border-ivory-200 dark:border-slate-800 text-xs sm:text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-400">Deterministic Demo Engine</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Available (No Key Required)
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-ivory-50 dark:bg-slate-800/60 border border-ivory-200 dark:border-slate-800 text-xs sm:text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-400">Live Google Gemini Engine</span>
              <span className={`font-bold flex items-center gap-1 ${config.live_ai_available ? 'text-emerald-600' : 'text-amber-600'}`}>
                {config.live_ai_available ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Configured ({config.configured_model})
                  </>
                ) : (
                  <>Not configured (using demo planner)</>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-ivory-50 dark:bg-slate-800/60 border border-ivory-200 dark:border-slate-800 text-xs sm:text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-400">Server Backend Version</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">v{config.version}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-rose-500">
            Backend API offline. Ensure backend is running via <code>python -m uvicorn app.main:app</code>.
          </div>
        )}
      </div>

      {/* Security & Boundary Notice Card */}
      <div className="rounded-3xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-6 text-amber-900 dark:text-amber-200 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
          <ShieldAlert className="w-4 h-4" />
          <span>Security & Deployment Boundary</span>
        </div>
        <p className="leading-relaxed">
          CelebrAI v1 is designed as a local single-user prototype without public authentication. Do not expose this local development server on public untrusted networks without adding enterprise auth and access controls.
        </p>
      </div>

    </div>
  );
};
