import { describe, it, expect } from 'vitest';
import { computeOnboarding, onboardingCompletion } from './onboarding';
import type { Task, UserProgress } from './supabase';

const mkProgress = (over: Partial<UserProgress> = {}): UserProgress => ({
  id: 'p', user_id: 'u',
  total_tasks_created: 0,
  total_tasks_completed: 0,
  total_locations: 0,
  current_streak: 0,
  best_streak: 0,
  level: 1,
  experience_points: 0,
  last_activity: '', created_at: '', updated_at: '',
  ...over,
});

const mkTask = (over: Partial<Task> = {}): Task => ({
  id: 'x', user_id: 'u', title: 't', urgency: 'media',
  location: '', completed: false, completed_at: null,
  created_at: '', category: '', due_date: null,
  attachments: [], shared_with: [],
  ...over,
});

describe('computeOnboarding', () => {
  it('retorna 5 passos sempre', () => {
    expect(computeOnboarding(null, [])).toHaveLength(5);
  });

  it('com usuário totalmente novo, nada está concluído', () => {
    const steps = computeOnboarding(null, []);
    expect(steps.every(s => !s.done)).toBe(true);
  });

  it('marca "Criar primeira tarefa" quando há ao menos 1 tarefa', () => {
    const steps = computeOnboarding(mkProgress({ total_tasks_created: 1 }), []);
    expect(steps.find(s => s.id === 'first-task')?.done).toBe(true);
  });

  it('marca "Concluir tarefa" quando total_tasks_completed >= 1', () => {
    const steps = computeOnboarding(mkProgress({ total_tasks_completed: 1 }), []);
    expect(steps.find(s => s.id === 'complete-task')?.done).toBe(true);
  });

  it('marca "Sequência de 3 dias" considerando best_streak (não só current)', () => {
    const steps = computeOnboarding(
      mkProgress({ current_streak: 0, best_streak: 3 }),
      []
    );
    expect(steps.find(s => s.id === 'streak-3')?.done).toBe(true);
  });

  it('marca "100 XP" quando experience_points >= 100', () => {
    const steps = computeOnboarding(mkProgress({ experience_points: 100 }), []);
    expect(steps.find(s => s.id === 'xp-100')?.done).toBe(true);
  });

  it('NÃO marca "100 XP" com 99 XP', () => {
    const steps = computeOnboarding(mkProgress({ experience_points: 99 }), []);
    expect(steps.find(s => s.id === 'xp-100')?.done).toBe(false);
  });

  it('marca "Compartilhar" quando alguma tarefa tem shared_with não vazio', () => {
    const tasks = [mkTask({ shared_with: ['some-user-id'] })];
    const steps = computeOnboarding(null, tasks);
    expect(steps.find(s => s.id === 'share-task')?.done).toBe(true);
  });

  it('NÃO marca "Compartilhar" se nenhuma tarefa tem shared_with', () => {
    const tasks = [mkTask({ shared_with: [] }), mkTask({ shared_with: [] })];
    const steps = computeOnboarding(null, tasks);
    expect(steps.find(s => s.id === 'share-task')?.done).toBe(false);
  });
});

describe('onboardingCompletion', () => {
  it('retorna 0/5 quando nada está concluído', () => {
    const steps = computeOnboarding(null, []);
    const c = onboardingCompletion(steps);
    expect(c.done).toBe(0);
    expect(c.total).toBe(5);
    expect(c.percentage).toBe(0);
  });

  it('retorna percentage proporcional aos passos concluídos', () => {
    const steps = computeOnboarding(
      mkProgress({ total_tasks_completed: 1, experience_points: 100 }),
      []
    );
    const c = onboardingCompletion(steps);
    // Os dois (complete-task e xp-100) estão done. Como total_tasks_created
    // continua 0, o passo first-task NÃO está done.
    expect(c.done).toBe(2);
    expect(c.percentage).toBeCloseTo(40, 5);
  });

  it('retorna 5/5 com tudo completo', () => {
    const tasks = [mkTask({ shared_with: ['x'] })];
    const steps = computeOnboarding(
      mkProgress({
        total_tasks_created: 1,
        total_tasks_completed: 1,
        best_streak: 5,
        experience_points: 200,
      }),
      tasks
    );
    const c = onboardingCompletion(steps);
    expect(c.done).toBe(5);
    expect(c.percentage).toBe(100);
  });
});
