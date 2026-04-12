import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Task {
  id: string;
  user_id: string;
  title: string;
  urgency: 'baixa' | 'media' | 'alta';
  location: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  category: string;
  due_date: string | null;
  attachments: string[]; // Array de URLs
  shared_with: string[]; // Array de user_ids
}

export interface TaskShare {
  id: string;
  task_id: string;
  shared_by: string;
  shared_with: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  total_tasks_created: number;
  total_tasks_completed: number;
  total_locations: number;
  current_streak: number;
  best_streak: number;
  level: number;
  experience_points: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}
