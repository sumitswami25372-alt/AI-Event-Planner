export interface TimelineItem {
  time: string;
  activity: string;
  duration_minutes: number;
}

export interface BudgetCategoryItem {
  name: string;
  estimated_cost: number;
  notes: string;
}

export interface ChecklistItem {
  title: string;
  category: string;
  priority: string;
  days_before_event: number;
}

export interface AIPlan {
  event_concept: string;
  theme: string;
  color_palette: string[];
  decorations: string[];
  venue_guidance: string[];
  food_and_drinks: string[];
  entertainment: string[];
  timeline: TimelineItem[];
  budget_categories: BudgetCategoryItem[];
  checklist: ChecklistItem[];
  recommendations: string[];
}

export interface EventItem {
  id: string;
  name: string;
  category: string;
  event_date: string;
  location: string;
  guest_count: number;
  budget_amount: number;
  currency: string;
  preferences: {
    indoor_outdoor?: string;
    theme_colors?: string;
    dietary?: string;
    food_preferences?: string;
    entertainment_preferences?: string;
    venue_requirements?: string;
    planning_style?: string;
    additional_instructions?: string;
    [key: string]: unknown;
  };
  plan_json: AIPlan | null;
  plan_status: 'pending' | 'completed' | 'failed';
  is_demo_plan: boolean;
  created_at: string;
  updated_at: string;

  // Computed metrics
  estimated_total: number;
  actual_total: number;
  remaining_budget: number;
  budget_usage_percentage: number;
  total_tasks: number;
  completed_tasks: number;
}

export interface EventCreatePayload {
  name: string;
  category: string;
  event_date: string;
  location: string;
  guest_count: number;
  budget_amount: number;
  currency: string;
  preferences?: Record<string, unknown>;
}

export interface EventUpdatePayload {
  name?: string;
  category?: string;
  event_date?: string;
  location?: string;
  guest_count?: number;
  budget_amount?: number;
  currency?: string;
  preferences?: Record<string, unknown>;
}

export interface ExpenseItem {
  id: string;
  event_id: string;
  name: string;
  category: string;
  estimated_amount: number;
  actual_amount: number;
  notes?: string;
  created_at: string;
}

export interface ExpenseCreatePayload {
  name: string;
  category: string;
  estimated_amount?: number;
  actual_amount?: number;
  notes?: string;
}

export interface ExpenseUpdatePayload {
  name?: string;
  category?: string;
  estimated_amount?: number;
  actual_amount?: number;
  notes?: string;
}

export interface ChecklistTaskItem {
  id: string;
  event_id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  completed: boolean;
  created_at: string;
}

export interface TaskCreatePayload {
  title: string;
  category?: string;
  priority?: string;
  due_date?: string;
  completed?: boolean;
}

export interface TaskUpdatePayload {
  title?: string;
  category?: string;
  priority?: string;
  due_date?: string;
  completed?: boolean;
}

export interface BudgetSummary {
  budget_amount: number;
  estimated_total: number;
  actual_total: number;
  remaining_budget: number;
  budget_usage_percentage: number;
  is_over_budget: boolean;
  categories: Record<string, { estimated: number; actual: number }>;
}

export interface ConfigResponse {
  app_name: string;
  version: string;
  supported_currencies: string[];
  demo_mode_available: boolean;
  live_ai_available: boolean;
  configured_model: string;
}
