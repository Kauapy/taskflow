/**
 * Tipos compartilhados do domínio. Antes ficavam em lib/supabase.ts;
 * agora que o backend é próprio, este módulo não depende de SDK nenhum.
 */

export interface AuthUser {
  id: string;
  email: string;
}

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
  attachments: string[]; // URLs
  shared_with: string[]; // user_ids
}

export interface IncomingShare {
  id: string;
  task_id: string;
  status: 'pending' | 'accepted' | 'declined';
  shared_by: string;
  sharer_email: string;
  task_title: string;
  task_urgency: 'baixa' | 'media' | 'alta';
  task_completed: boolean;
  task_due_date: string | null;
  task_location: string | null;
  created_at: string;
}

export interface TaskShareLink {
  id: string;
  task_id: string;
  token: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  revoked: boolean;
  view_count: number;
}

export interface SharedTaskView {
  task_id: string;
  title: string;
  urgency: 'baixa' | 'media' | 'alta';
  category: string;
  location: string | null;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  shared_by_email: string;
  view_count: number;
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
