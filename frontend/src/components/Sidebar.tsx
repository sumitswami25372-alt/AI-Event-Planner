import React from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarPlus,
  Lightbulb,
  Settings,
  Sparkles,
  DollarSign,
  CheckSquare,
  FileText,
  X
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const params = useParams();

  // Detect if current route is within an event context
  const eventMatch = location.pathname.match(/\/(events|budget|checklist)\/([^/]+)/);
  const activeEventId = eventMatch ? eventMatch[2] : params.id || params.eventId;

  const mainLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/plan', label: 'Create Event', icon: CalendarPlus },
    { to: '/ideas', label: 'Ideas & Inspiration', icon: Lightbulb },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 z-50 md:z-30 h-screen md:h-[calc(100vh-4rem)] w-64 bg-ivory-100 dark:bg-slate-900 border-r border-ivory-300/80 dark:border-slate-800 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          
          {/* Mobile close button */}
          <div className="flex items-center justify-between md:hidden pb-3 border-b border-ivory-300 dark:border-slate-800">
            <span className="font-serif font-bold text-plum-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-500" />
              CelebrAI Menu
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav className="flex flex-col gap-1.5">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace
            </div>
            {mainLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-plum-800 text-white shadow-sm dark:bg-plum-700'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-ivory-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Contextual Active Event Sub-Navigation */}
          {activeEventId && (
            <nav className="flex flex-col gap-1 pt-4 border-t border-ivory-300/80 dark:border-slate-800">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-plum-700 dark:text-plum-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                Active Event Tools
              </div>
              <NavLink
                to={`/events/${activeEventId}`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-plum-100 text-plum-900 dark:bg-plum-950/80 dark:text-plum-200 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-ivory-200 dark:hover:bg-slate-800'
                  }`
                }
              >
                <FileText className="w-4 h-4" />
                <span>Plan Overview</span>
              </NavLink>

              <NavLink
                to={`/budget/${activeEventId}`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-plum-100 text-plum-900 dark:bg-plum-950/80 dark:text-plum-200 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-ivory-200 dark:hover:bg-slate-800'
                  }`
                }
              >
                <DollarSign className="w-4 h-4" />
                <span>Budget Planner</span>
              </NavLink>

              <NavLink
                to={`/checklist/${activeEventId}`}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-plum-100 text-plum-900 dark:bg-plum-950/80 dark:text-plum-200 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-ivory-200 dark:hover:bg-slate-800'
                  }`
                }
              >
                <CheckSquare className="w-4 h-4" />
                <span>Checklist & Schedule</span>
              </NavLink>
            </nav>
          )}

        </div>

        {/* Bottom Banner */}
        <div className="pt-4 border-t border-ivory-300/80 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-ivory-200/80 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-plum-800 dark:text-plum-300 block mb-0.5">
              CelebrAI v1.0
            </span>
            Local Prototype &bull; Single User
          </div>
        </div>
      </aside>
    </>
  );
};
