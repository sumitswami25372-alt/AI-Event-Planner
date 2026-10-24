import { z } from 'zod';

export const eventFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Event name is required')
    .max(200, 'Event name cannot exceed 200 characters'),
  category: z
    .string()
    .trim()
    .min(1, 'Please select an event category'),
  event_date: z
    .string()
    .min(4, 'Please provide a valid date'),
  location: z
    .string()
    .trim()
    .min(1, 'City or location description is required')
    .max(200, 'Location cannot exceed 200 characters'),
  guest_count: z
    .number({ invalid_type_error: 'Guest count must be a number' })
    .int('Guest count must be an integer')
    .positive('Guest count must be at least 1')
    .max(100000, 'Guest count cannot exceed 100,000'),
  budget_amount: z
    .number({ invalid_type_error: 'Budget must be a number' })
    .positive('Budget must be greater than zero')
    .max(1000000000, 'Budget exceeds maximum limit'),
  currency: z
    .string()
    .default('INR'),
  indoor_outdoor: z.string().optional().default(''),
  theme_colors: z.string().optional().default(''),
  dietary: z.string().optional().default(''),
  food_preferences: z.string().optional().default(''),
  entertainment_preferences: z.string().optional().default(''),
  venue_requirements: z.string().optional().default(''),
  planning_style: z.enum(['budget-friendly', 'balanced', 'premium']).default('balanced'),
  additional_instructions: z.string().optional().default(''),
});

export type EventFormData = z.infer<typeof eventFormSchema>;
