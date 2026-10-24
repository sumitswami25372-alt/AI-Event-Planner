import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Calendar,
  DollarSign,
  CheckCircle2,
  FileDown,
  Users,
  Compass,
  PartyPopper,
  Heart,
  Cake,
  GraduationCap,
  Briefcase,
  Smile
} from 'lucide-react';

const CATEGORIES = [
  { name: 'Luxury Weddings', icon: Heart, desc: 'Mandaps, florals, banquets & bridal timelines', color: 'from-rose-500/10 to-rose-500/20 text-rose-700 dark:text-rose-400' },
  { name: 'Milestone Birthdays', icon: Cake, desc: 'Rooftops, DJ sets, craft bars & themes', color: 'from-plum-500/10 to-plum-500/20 text-plum-700 dark:text-plum-400' },
  { name: 'Engagements & Ring Ceremonies', icon: Sparkles, desc: 'Intimate soirees, toasting & photo setups', color: 'from-amber-500/10 to-amber-500/20 text-amber-700 dark:text-amber-400' },
  { name: 'Anniversaries', icon: PartyPopper, desc: 'Milestone golden memories & candlelight dining', color: 'from-gold-500/10 to-gold-500/20 text-gold-700 dark:text-gold-400' },
  { name: 'College & Cultural Fests', icon: GraduationCap, desc: 'Outdoor stages, sound line-arrays & food alleys', color: 'from-blue-500/10 to-blue-500/20 text-blue-700 dark:text-blue-400' },
  { name: 'Corporate Summits & Galas', icon: Briefcase, desc: 'Executive keynotes, gala banquets & awards', color: 'from-indigo-500/10 to-indigo-500/20 text-indigo-700 dark:text-indigo-400' },
  { name: 'Baby Showers', icon: Smile, desc: 'Pastel decor, wholesome games & sweet spreads', color: 'from-teal-500/10 to-teal-500/20 text-teal-700 dark:text-teal-400' },
  { name: 'Farewell Parties', icon: Compass, desc: 'Nostalgic toasts, slideshow reels & keepsakes', color: 'from-purple-500/10 to-purple-500/20 text-purple-700 dark:text-purple-400' },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-20 py-8">
      
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto px-4 pt-10 pb-6 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-plum-100 dark:bg-plum-950/80 border border-plum-200 dark:border-plum-800 text-plum-900 dark:text-plum-300 text-xs sm:text-sm font-semibold mb-6 shadow-xs">
          <Sparkles className="w-4 h-4 text-gold-500" />
          <span>Production-Quality AI Celebration Architecture</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-plum-900 dark:text-white leading-[1.15]">
          Every Celebration, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-plum-800 via-plum-700 to-gold-600 bg-clip-text text-transparent dark:from-plum-400 dark:to-gold-400">
            Perfectely Planned.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          From intimate birthdays to royal weddings and university fests, CelebrAI orchestrates minute-by-minute run-of-show timelines, dynamic budgets, and actionable preparation checklists in seconds.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/plan"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-plum-800 to-plum-700 hover:from-plum-900 hover:to-plum-800 shadow-lg shadow-plum-800/25 hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <span>Create My Event</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/ideas"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-200 bg-ivory-200/80 dark:bg-slate-800 hover:bg-ivory-300 dark:hover:bg-slate-700 border border-ivory-300 dark:border-slate-700 transition-all hover:-translate-y-0.5"
          >
            <span>Explore Ideas</span>
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 border-t border-ivory-300/80 dark:border-slate-800/80 pt-6">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Decimal-Safe Budgeting
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real PDF Export
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Offline Demo Planner
          </span>
        </div>
      </section>

      {/* Celebration Categories */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Celebrations We Orchestrate
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Tailored algorithms adjusting budget splits, guest ratios, and schedule pacing for each archetype.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-ivory-300/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 card-hover flex flex-col justify-between"
            >
              <div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{cat.name}</h3>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{cat.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-ivory-200 dark:border-slate-800/60 flex items-center justify-between">
                <Link
                  to={`/plan?category=${encodeURIComponent(cat.name.toLowerCase().split(' ')[0])}`}
                  className="text-xs font-semibold text-plum-700 dark:text-plum-400 hover:text-plum-900 dark:hover:text-plum-300 inline-flex items-center gap-1"
                >
                  Plan this &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-ivory-200/60 dark:bg-slate-900/40 border-y border-ivory-300/80 dark:border-slate-800 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
              How CelebrAI Works
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Three clear stages from concept to flawless celebration day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 card-hover">
              <div className="w-10 h-10 rounded-xl bg-plum-100 dark:bg-plum-950/80 text-plum-800 dark:text-plum-400 font-bold flex items-center justify-center text-base mb-4">
                1
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Share Your Vision</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Provide guest counts, target investment budget, currency, aesthetic preferences, and food restrictions in our validated wizard.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 card-hover">
              <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-950/80 text-gold-700 dark:text-gold-400 font-bold flex items-center justify-center text-base mb-4">
                2
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">AI Blueprint Synthesis</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Gemini or our deterministic engine calculates balanced category spend limits, crafts 5-color palettes, and schedules minute-by-minute run-of-shows.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 card-hover">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-base mb-4">
                3
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Coordinate & Export</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Manage actual expenses, check off preparation milestones, and export a polished multi-page PDF briefing document for your vendors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-plum-700 dark:text-plum-400">
              Complete Control
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2 leading-tight">
              Dynamic Budget Intelligence & Run-of-Show Choreography
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Never be blindsided by hidden venue costs or last-minute catering surges. CelebrAI monitors committed versus actual spend with visual category charts and automated over-budget alerts.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Real-time Remaining Balance & Cost-per-Guest Calculations
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-plum-100 text-plum-800 dark:bg-plum-950 dark:text-plum-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Minute-by-Minute Run-of-Show Schedule with Role Leads
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gold-100 text-gold-800 dark:bg-gold-950 dark:text-gold-300">
                  <FileDown className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  One-Click Formatted PDF Export Ready for Vendor Handoff
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/plan"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 transition-colors"
              >
                Start Planning Free &rarr;
              </Link>
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-ivory-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-plum-700 dark:text-plum-400 uppercase tracking-wider">
                  Sample AI Plan Preview
                </span>
                <h4 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                  Sunset Vineyard Wedding Gala
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                AI Generated
              </span>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 rounded-xl bg-ivory-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Concept:</strong> An ethereal twilight vows exchange followed by a candlelit 4-course farm banquet with sommelier wine pairings for 120 guests.
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Color Palette:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#4A154B] inline-block shadow-xs"></span>
                  <span className="w-5 h-5 rounded-full bg-[#D4AF37] inline-block shadow-xs"></span>
                  <span className="w-5 h-5 rounded-full bg-[#D9777F] inline-block shadow-xs"></span>
                  <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-slate-300 inline-block shadow-xs"></span>
                  <span className="w-5 h-5 rounded-full bg-[#2D4B3E] inline-block shadow-xs"></span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span>Budget Allocation (INR 750,000)</span>
                  <span className="text-plum-700 dark:text-plum-400">100% Balanced</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                  <div style={{ width: '32%' }} className="bg-plum-800 h-full" title="Venue 32%"></div>
                  <div style={{ width: '34%' }} className="bg-rose-500 h-full" title="Catering 34%"></div>
                  <div style={{ width: '14%' }} className="bg-gold-500 h-full" title="Decor 14%"></div>
                  <div style={{ width: '10%' }} className="bg-blue-500 h-full" title="Photo 10%"></div>
                  <div style={{ width: '10%' }} className="bg-emerald-500 h-full" title="Music & Reserve 10%"></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-ivory-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> 120 Attendees
              </span>
              <Link to="/plan" className="font-semibold text-plum-700 dark:text-plum-400 hover:underline">
                Generate Plan Like This &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-4xl mx-auto px-4 w-full">
        <div className="rounded-3xl bg-gradient-to-br from-plum-900 to-plum-800 text-white p-8 sm:p-12 text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold">
              Ready to Orchestrate Your Dream Celebration?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-plum-200 leading-relaxed">
              Join thousands of hosts and planners who save hours of stress using CelebrAI.
            </p>
            <div className="mt-6">
              <Link
                to="/plan"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-base font-semibold text-plum-900 bg-gold-400 hover:bg-gold-300 shadow-md transition-all hover:scale-105"
              >
                <span>Start Planning Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
