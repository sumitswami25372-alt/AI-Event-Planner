import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { eventFormSchema, EventFormData } from '../schemas/eventSchema';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useAppToast } from '../layouts/AppLayout';

const CATEGORIES = [
  'wedding',
  'birthday',
  'engagement',
  'anniversary',
  'college',
  'farewell',
  'festival',
  'corporate',
  'baby_shower',
  'other',
];

export const PlanEventPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useAppToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Form State with initial values (including query param prefills from Ideas page)
  const [formData, setFormData] = useState<EventFormData>({
    name: searchParams.get('name') || '',
    category: searchParams.get('category') || 'birthday',
    event_date: searchParams.get('date') || new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    location: searchParams.get('location') || '',
    guest_count: Number(searchParams.get('guests')) || 50,
    budget_amount: Number(searchParams.get('budget')) || 75000,
    currency: searchParams.get('currency') || 'INR',
    indoor_outdoor: searchParams.get('venue') || 'Indoor with outdoor lawn',
    theme_colors: searchParams.get('theme') || 'Warm Amber & Velvet Plum',
    dietary: searchParams.get('dietary') || 'Vegetarian & non-vegetarian options',
    food_preferences: '',
    entertainment_preferences: '',
    venue_requirements: '',
    planning_style: (searchParams.get('style') as 'budget-friendly' | 'balanced' | 'premium') || 'balanced',
    additional_instructions: '',
  });

  useEffect(() => {
    // If category provided in URL query, set it
    const catParam = searchParams.get('category');
    if (catParam && CATEGORIES.includes(catParam.toLowerCase())) {
      setFormData((prev) => ({ ...prev, category: catParam.toLowerCase() }));
    }
  }, [searchParams]);

  const updateField = (field: keyof EventFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error if corrected
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) errors.name = 'Event name is required';
      if (!formData.category) errors.category = 'Please choose a category';
      if (!formData.event_date) errors.event_date = 'Please select an event date';
      if (!formData.location.trim()) errors.location = 'City or venue location is required';
      if (!formData.guest_count || formData.guest_count <= 0) errors.guest_count = 'Guest count must be at least 1';
      if (!formData.budget_amount || formData.budget_amount <= 0) errors.budget_amount = 'Budget must be greater than zero';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Full Zod validation
    const result = eventFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
      });
      setFormErrors(fieldErrors);
      showToast('Please fix the highlighted validation errors before generating', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const newEvent = await api.createEvent({
        name: formData.name.trim(),
        category: formData.category,
        event_date: formData.event_date,
        location: formData.location.trim(),
        guest_count: Number(formData.guest_count),
        budget_amount: Number(formData.budget_amount),
        currency: formData.currency,
        preferences: {
          indoor_outdoor: formData.indoor_outdoor,
          theme_colors: formData.theme_colors,
          dietary: formData.dietary,
          food_preferences: formData.food_preferences,
          entertainment_preferences: formData.entertainment_preferences,
          venue_requirements: formData.venue_requirements,
          planning_style: formData.planning_style,
          additional_instructions: formData.additional_instructions,
        },
      });

      showToast(`Celebration "${newEvent.name}" generated with full plan!`, 'success');
      navigate(`/events/${newEvent.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Event creation failed';
      showToast(msg, 'error');
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <LoadingSpinner size="lg" label="Synthesizing your bespoke AI celebration blueprint..." />
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Calculating category spend limits, curating thematic color swatches, scheduling run-of-show milestones, and seeding preparation checklists...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 pb-16">
      
      {/* Wizard Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-plum-100 dark:bg-plum-950/80 text-plum-800 dark:text-plum-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
          <span>AI Celebration Architect</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
          Plan Your Next Celebration
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
          Step {currentStep} of 3 &bull; Fill in the details to generate a complete master blueprint.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-3 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === step
                  ? 'bg-plum-800 text-white shadow-md'
                  : currentStep > step
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ivory-300 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {currentStep > step ? '✓' : step}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-600 dark:text-slate-400">
              {step === 1 ? 'Logistics' : step === 2 ? 'Theme & Vibe' : 'Catering & Activities'}
            </span>
            {step < 3 && <div className="w-6 sm:w-10 h-0.5 bg-ivory-300 dark:bg-slate-800"></div>}
          </div>
        ))}
      </div>

      {/* Main Wizard Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-ivory-300/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* ================= STEP 1: LOGISTICS ================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-ivory-200 dark:border-slate-800 pb-3">
              <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white">
                1. Core Event Logistics
              </h2>
              <p className="text-xs text-slate-500">Essential timing, location, and financial parameters.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Kiara's 30th Celestial Rooftop Soirée"
                className={`w-full px-4 py-3 rounded-xl border text-sm bg-ivory-50 dark:bg-slate-950 transition-colors ${
                  formErrors.name ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:border-plum-600'
                }`}
              />
              {formErrors.name && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{formErrors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => updateField('event_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                />
                {formErrors.event_date && <p className="text-xs text-rose-500 mt-1">{formErrors.event_date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Location / City *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g. Mumbai, Downtown Rooftop"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                />
                {formErrors.location && <p className="text-xs text-rose-500 mt-1">{formErrors.location}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Estimated Guests *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.guest_count}
                  onChange={(e) => updateField('guest_count', Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                />
                {formErrors.guest_count && <p className="text-xs text-rose-500 mt-1">{formErrors.guest_count}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Budget *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="100"
                    step="500"
                    value={formData.budget_amount}
                    onChange={(e) => updateField('budget_amount', Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => updateField('currency', e.target.value)}
                    className="px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950 font-bold"
                  >
                    {SUPPORTED_CURRENCIES.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.budget_amount && <p className="text-xs text-rose-500 mt-1">{formErrors.budget_amount}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: THEME & VIBE ================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-ivory-200 dark:border-slate-800 pb-3">
              <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white">
                2. Theme, Style & Spatial Vibe
              </h2>
              <p className="text-xs text-slate-500">Tune the aesthetic design and allocation priorities.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Planning Style / Investment Profile
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'budget-friendly', label: 'Budget-Friendly', desc: 'Focus on high-value catering and smart DIY decor.' },
                  { id: 'balanced', label: 'Balanced', desc: 'Equal harmony across venue, food, and music.' },
                  { id: 'premium', label: 'Premium Luxury', desc: 'Signature culinary stations, live artists & grand styling.' },
                ].map((s) => (
                  <label
                    key={s.id}
                    onClick={() => updateField('planning_style', s.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.planning_style === s.id
                        ? 'border-plum-800 bg-plum-50 dark:bg-plum-950/60 ring-2 ring-plum-800/30'
                        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{s.label}</div>
                      <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                    </div>
                    <div className="mt-3">
                      <input
                        type="radio"
                        name="planning_style"
                        checked={formData.planning_style === s.id}
                        onChange={() => {}}
                        className="accent-plum-800"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Theme & Color Palette Preferences
              </label>
              <input
                type="text"
                value={formData.theme_colors}
                onChange={(e) => updateField('theme_colors', e.target.value)}
                placeholder="e.g. Royal Emerald & Soft Champagne Gold"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Indoor / Outdoor Setting
              </label>
              <input
                type="text"
                value={formData.indoor_outdoor}
                onChange={(e) => updateField('indoor_outdoor', e.target.value)}
                placeholder="e.g. Outdoor sunset pavilion with indoor banquet hall"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 3: CATERING & ACTIVITIES ================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-ivory-200 dark:border-slate-800 pb-3">
              <h2 className="font-serif font-bold text-xl text-slate-900 dark:text-white">
                3. Catering, Entertainment & Constraints
              </h2>
              <p className="text-xs text-slate-500">Fine-tune dining selections, performances, and venue rules.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Dietary Requirements & Catering Style
              </label>
              <input
                type="text"
                value={formData.dietary}
                onChange={(e) => updateField('dietary', e.target.value)}
                placeholder="e.g. Jain options for 15 guests, live tandoor and chaat counters"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Entertainment & Music Desired
              </label>
              <input
                type="text"
                value={formData.entertainment_preferences}
                onChange={(e) => updateField('entertainment_preferences', e.target.value)}
                placeholder="e.g. Bollywood/EDM DJ, live saxophone entrance, 360 photobooth"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Additional Instructions or Specific Vendor Constraints
              </label>
              <textarea
                rows={3}
                value={formData.additional_instructions}
                onChange={(e) => updateField('additional_instructions', e.target.value)}
                placeholder="e.g. Strict 10:30 PM outdoor acoustic curfew, require wheelchair access ramp..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-ivory-50 dark:bg-slate-950"
              />
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 pt-6 border-t border-ivory-200 dark:border-slate-800 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 hover:bg-ivory-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-plum-800 hover:bg-plum-900 shadow-sm transition-all"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-plum-800 to-plum-700 hover:from-plum-900 hover:to-plum-800 shadow-md shadow-plum-800/25 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span>Generate Celebration Blueprint</span>
            </button>
          )}
        </div>

      </form>
    </div>
  );
};
