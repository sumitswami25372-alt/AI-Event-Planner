import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  DollarSign,
  Users,
  Compass,
  Heart,
  Cake,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface IdeaItem {
  id: string;
  title: string;
  category: string;
  budget: number;
  guests: number;
  currency: string;
  theme: string;
  concept: string;
  highlights: string[];
  palette: string[];
}

const STATIC_IDEAS: IdeaItem[] = [
  {
    id: 'idea-1',
    title: 'Ethereal Botanical Estate Wedding',
    category: 'wedding',
    budget: 850000,
    guests: 150,
    currency: 'INR',
    theme: 'Romantic Botanical & Warm Champagne Glow',
    concept: 'Lush eucalyptus arches, candlelit banquet tables under fairy-light canopies, and sommelier wine pairings.',
    highlights: ['Outdoor floral arch ceremony', 'Live harp & acoustic duo', 'Farm-to-table 4-course banquet', 'Sparkler pathway sendoff'],
    palette: ['#4A154B', '#D4AF37', '#D9777F', '#FAF7F2', '#2D4B3E'],
  },
  {
    id: 'idea-2',
    title: 'Cyberpunk Neon 30th Birthday Soirée',
    category: 'birthday',
    budget: 95000,
    guests: 60,
    currency: 'INR',
    theme: 'Cyberpunk Glow & Chic Retro Disco',
    concept: 'Custom milestone LED neon signage, 360 slow-mo video booth, street taco sliders, and high-energy electronic music.',
    highlights: ['Custom acrylic neon keepsake sign', '360 revolving camera booth', 'Live taco & bao grazing station', 'LED foam party batons'],
    palette: ['#5C1D5E', '#EC4899', '#06B6D4', '#0F172A', '#F59E0B'],
  },
  {
    id: 'idea-3',
    title: 'Heritage Golden 25th Anniversary Gala',
    category: 'anniversary',
    budget: 350000,
    guests: 80,
    currency: 'INR',
    theme: 'Vintage Gold & Velvet Romance',
    concept: 'Nostalgic multi-decade photo gallery walk, champagne welcome flutes, live string quartet, and tiered gold-leaf cake.',
    highlights: ['Curated life-milestone photo corridor', 'Champagne welcome toast', 'Live cello & violin duet', 'Slow dance spotlight reveal'],
    palette: ['#581C87', '#D97706', '#FDE68A', '#374151', '#FFFBEB'],
  },
  {
    id: 'idea-4',
    title: 'Riverfront Green Food & Music Fair',
    category: 'festival',
    budget: 450000,
    guests: 600,
    currency: 'INR',
    theme: 'Eco-Friendly Bohemian & Acoustic Roots',
    concept: 'Covered mobile music amphitheater, zero-waste composting stations, artisan street food alley, and community murals.',
    highlights: ['Line-array concert stage', 'Food truck rally with 10 vendors', 'Community painting canvas', 'Zero-waste sorting stations'],
    palette: ['#166534', '#EAB308', '#C2410C', '#0284C7', '#F3F4F6'],
  },
  {
    id: 'idea-5',
    title: 'Executive AI & Tech Innovation Summit',
    category: 'corporate',
    budget: 650000,
    guests: 180,
    currency: 'INR',
    theme: 'Modern Minimalist High-Tech',
    concept: 'Seamless delegate check-in with digital badges, ultra-bright LED keynote screens, barista espresso lounge, and awards ceremony.',
    highlights: ['Dual 4K stage displays', 'Artisan espresso & pastry bar', 'Keynote live audience polling', 'Trophy gala awards presentation'],
    palette: ['#1E1B4B', '#3B82F6', '#10B981', '#64748B', '#FFFFFF'],
  },
  {
    id: 'idea-6',
    title: 'Campus Neon Odyssey Cultural Fest',
    category: 'college',
    budget: 500000,
    guests: 800,
    currency: 'INR',
    theme: 'Electric Beats & Student Showcases',
    concept: 'High-energy inter-college band battles, street food alleys, laser show mapping, and celebrity DJ concert finale.',
    highlights: ['Outdoor festival concert stage', 'Battle of the bands competition', 'Glow-in-the-dark photo frames', 'Midnight confetti cannons'],
    palette: ['#4C1D95', '#F43F5E', '#06B6D4', '#111827', '#FBBF24'],
  },
];

export const IdeasPage: React.FC = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBudgetRange, setSelectedBudgetRange] = useState('all');

  const filteredIdeas = STATIC_IDEAS.filter((idea) => {
    const matchQuery =
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.theme.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'all' || idea.category === selectedCategory;

    let matchBudget = true;
    if (selectedBudgetRange === 'under-100k') {
      matchBudget = idea.budget <= 100000;
    } else if (selectedBudgetRange === '100k-500k') {
      matchBudget = idea.budget > 100000 && idea.budget <= 500000;
    } else if (selectedBudgetRange === 'above-500k') {
      matchBudget = idea.budget > 500000;
    }

    return matchQuery && matchCategory && matchBudget;
  });

  const handleSelectIdea = (idea: IdeaItem) => {
    // Navigate to /plan prefilled with this idea's parameters
    const params = new URLSearchParams({
      name: idea.title,
      category: idea.category,
      budget: String(idea.budget),
      guests: String(idea.guests),
      currency: idea.currency,
      theme: idea.theme,
    });
    navigate(`/plan?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-8 pb-16">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 dark:bg-gold-950/80 text-gold-800 dark:text-gold-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
          <span>Curated Event Blueprints</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
          Celebration Inspiration & Ideas
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Browse vetted concepts with balanced budget splits and theme swatches. Selecting any blueprint will automatically prefill our AI creation wizard.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, decor styles, themes (e.g. rooftop, botanical, neon)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 focus:border-plum-800"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-medium w-full md:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="wedding">Weddings</option>
            <option value="birthday">Birthdays</option>
            <option value="anniversary">Anniversaries</option>
            <option value="festival">Festivals & Fairs</option>
            <option value="corporate">Corporate</option>
            <option value="college">College Events</option>
          </select>

          {/* Budget filter */}
          <select
            value={selectedBudgetRange}
            onChange={(e) => setSelectedBudgetRange(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-medium w-full md:w-auto"
          >
            <option value="all">Any Budget</option>
            <option value="under-100k">Under ₹1,00,000</option>
            <option value="100k-500k">₹1,00,000 - ₹5,00,000</option>
            <option value="above-500k">Above ₹5,00,000</option>
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIdeas.map((idea) => (
          <div
            key={idea.id}
            className="rounded-3xl bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 p-6 shadow-xs card-hover flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-plum-100 dark:bg-plum-950 text-plum-800 dark:text-plum-300 border border-plum-200 dark:border-plum-800">
                  {idea.category}
                </span>

                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {formatCurrency(idea.budget, idea.currency)}
                </span>
              </div>

              <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">
                {idea.title}
              </h3>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {idea.concept}
              </p>

              {/* Theme & Palette */}
              <div className="mt-4 pt-3 border-t border-ivory-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs font-bold text-slate-500">Palette:</span>
                  <div className="flex items-center gap-1">
                    {idea.palette.map((c, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full shadow-xs inline-block"
                        style={{ backgroundColor: c }}
                        title={c}
                      ></span>
                    ))}
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-1 mt-2">
                  {idea.highlights.slice(0, 3).map((h, i) => (
                    <div key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="text-gold-500 font-bold">&bull;</span>
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-ivory-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {idea.guests} Guests
              </span>

              <button
                type="button"
                onClick={() => handleSelectIdea(idea)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-plum-800 hover:bg-plum-900 shadow-xs transition-colors"
              >
                <span>Use This Idea</span>
                <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
