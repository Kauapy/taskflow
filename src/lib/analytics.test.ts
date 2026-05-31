import { describe, it, expect } from 'vitest';
import { calculateAnalytics } from './analytics';
import type { Task, UserProgress } from './types';

const NOW = new Date('2026-05-09T12:00:00Z');

const mkTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'x',
  user_id: 'u',
  title: 'Tarefa',
  urgency: 'media',
  location: '',
  completed: false,
  completed_at: null,
  created_at: '2026-05-09T10:00:00Z',
  category: '',
  due_date: null,
  attachments: [],
  shared_with: [],
  ...overrides,
});

const mkProgress = (overrides: Partial<UserProgress> = {}): UserProgress => ({
  id: 'p',
  user_id: 'u',
  total_tasks_created: 0,
  total_tasks_completed: 0,
  total_locations: 0,
  current_streak: 0,
  best_streak: 0,
  level: 1,
  experience_points: 0,
  last_activity: '2026-05-09T00:00:00Z',
  created_at: '2026-05-09T00:00:00Z',
  updated_at: '2026-05-09T00:00:00Z',
  ...overrides,
});

describe('calculateAnalytics', () => {
  it('retorna null quando não há tarefas', () => {
    expect(calculateAnalytics([], null, NOW)).toBeNull();
  });

  it('calcula productivityScore corretamente', () => {
    const tasks = [
      mkTask({ id: '1', completed: true, completed_at: '2026-05-09T11:00:00Z' }),
      mkTask({ id: '2', completed: true, completed_at: '2026-05-09T11:00:00Z' }),
      mkTask({ id: '3', completed: false }),
    ];
    const r = calculateAnalytics(tasks, null, NOW);
    expect(r?.totalTasks).toBe(3);
    expect(r?.completedTasks).toBe(2);
    expect(r?.productivityScore).toBeCloseTo(66.67, 1);
  });

  it('calcula tempo médio de conclusão em horas', () => {
    const tasks = [
      mkTask({
        id: '1',
        created_at: '2026-05-09T08:00:00Z',
        completed: true,
        completed_at: '2026-05-09T10:00:00Z', // 2h
      }),
      mkTask({
        id: '2',
        created_at: '2026-05-09T07:00:00Z',
        completed: true,
        completed_at: '2026-05-09T11:00:00Z', // 4h
      }),
    ];
    const r = calculateAnalytics(tasks, null, NOW);
    expect(r?.averageCompletionTime).toBeCloseTo(3, 5); // média (2h + 4h) / 2 = 3h
  });

  it('ignora tarefas não completadas no tempo médio', () => {
    const tasks = [
      mkTask({ id: '1', completed: false }),
      mkTask({
        id: '2',
        created_at: '2026-05-09T08:00:00Z',
        completed: true,
        completed_at: '2026-05-09T10:00:00Z',
      }),
    ];
    const r = calculateAnalytics(tasks, null, NOW);
    expect(r?.averageCompletionTime).toBeCloseTo(2, 5);
  });

  it('usa current/best streak do progress quando fornecido', () => {
    const r = calculateAnalytics([mkTask()], mkProgress({ current_streak: 7, best_streak: 12 }), NOW);
    expect(r?.currentStreak).toBe(7);
    expect(r?.bestStreak).toBe(12);
  });

  it('retorna 0 em streaks quando progress é null', () => {
    const r = calculateAnalytics([mkTask()], null, NOW);
    expect(r?.currentStreak).toBe(0);
    expect(r?.bestStreak).toBe(0);
  });

  it('retorna 8 semanas e 6 meses na série temporal', () => {
    const r = calculateAnalytics([mkTask()], null, NOW);
    expect(r?.weeklyProgress).toHaveLength(8);
    expect(r?.monthlyProgress).toHaveLength(6);
  });
});
