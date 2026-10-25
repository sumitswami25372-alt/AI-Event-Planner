import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Footer } from '../components/Footer';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useAppToast = () => useContext(ToastContext);

export const AppLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('celebrai_theme') === 'dark';
  });

  const { toasts, addToast, removeToast } = useToast();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('celebrai_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('celebrai_theme', 'light');
    }
  }, [isDark]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      <div className="min-h-screen flex flex-col bg-ivory-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <Navbar
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />

        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Show sidebar unless on landing page */}
          {!isLandingPage && (
            <Sidebar
              isMobileOpen={isMobileOpen}
              onCloseMobile={() => setIsMobileOpen(false)}
            />
          )}

          <main className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </main>
        </div>

        <Footer />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </div>
    </ToastContext.Provider>
  );
};
