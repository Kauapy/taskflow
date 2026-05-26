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

describe('computeOnboarding (cadeias progressivas)', () => {
  it('retorna 6 slots sempre', () => {
    expect(computeOnboarding(null, [])).toHaveLength(6);
  });

  it('com usuário novo, todas as missões estão no nível 1 e nada maxado', () => {
    const steps = computeOnboarding(null, []);
    expect(steps.every(s => s.level === 1 && !s.isMaxed)).toBe(true);
  });

  it('promove o slot "create" do nível 1 para 2 ao criar 1 tarefa', () => {
    const s1 = computeOnboarding(mkProgress({ total_tasks_created: 0 }), []);
    const s2 = computeOnboarding(mkProgress({ total_tasks_created: 1 }), []);

    const create1 = s1.find(s => s.slotId === 'create')!;
    const create2 = s2.find(s => s.slotId === 'create')!;

    expect(create1.id).toBe('create-1');
    expect(create1.level).toBe(1);
    expect(create1.target).toBe(1);

    // Ao atingir target=1, próxima missão já entra no lugar
    expect(create2.id).toBe('create-5');
    expect(create2.level).toBe(2);
    expect(create2.target).toBe(5);
    expect(create2.current).toBe(1);
  });

  it('vai direto pro último nível quando o usuário pula etapas', () => {
    const steps = computeOnboarding(mkProgress({ total_tasks_created: 60 }), []);
    const create = steps.find(s => s.slotId === 'create')!;
    expect(create.id).toBe('create-100');
    expect(create.level).toBe(4);
    expect(create.target).toBe(100);
    expect(create.isMaxed).toBe(false);
  });

  it('marca isMaxed quando a cadeia inteira é vencida', () => {
    const steps = computeOnboarding(mkProgress({ total_tasks_created: 999 }), []);
    const create = steps.find(s => s.slotId === 'create')!;
    expect(create.isMaxed).toBe(true);
    expect(create.id).toBe('create-100'); // última da cadeia
    expect(create.level).toBe(4);
    expect(create.total).toBe(4);
  });

  it('"complete" sobe os níveis conforme tarefas concluídas crescem', () => {
    const steps = computeOnboarding(mkProgress({ total_tasks_completed: 15 }), []);
    const c = steps.find(s => s.slotId === 'complete')!;
    expect(c.id).toBe('complete-50'); // 15 já passou de 1 e 10, próxima é 50
    expect(c.level).toBe(3);
  });

  it('"streak" usa best_streak (não só current)', () => {
    const steps = computeOnboarding(
      mkProgress({ current_streak: 0, best_streak: 5 }),
      []
    );
    const s = steps.find(s => s.slotId === 'streak')!;
    expect(s.current).toBe(5);
    expect(s.id).toBe('streak-7'); // 5 já passou de 3, próxima é 7
  });

  it('"xp" sobe os patamares 100 → 500 → 2000 → 10000', () => {
    const steps = computeOnboarding(mkProgress({ experience_points: 600 }), []);
    const xp = steps.find(s => s.slotId === 'xp')!;
    expect(xp.id).toBe('xp-2000');
    expect(xp.current).toBe(600);
    expect(xp.target).toBe(2000);
  });

  it('"share" conta tarefas com shared_with não vazio', () => {
    const tasks = [
      mkTask({ shared_with: ['u1'] }),
      mkTask({ shared_with: ['u2', 'u3'] }),
      mkTask({ shared_with: [] }),
    ];
    const steps = computeOnboarding(null, tasks);
    const share = steps.find(s => s.slotId === 'share')!;
    expect(share.current).toBe(2);
    expect(share.id).toBe('share-3');
  });

  it('o slot "create" considera tasks.length quando progress está atrás', () => {
    // progress diz 0 mas o array tem 2 tarefas → assume 2 (defesa contra inconsistência)
    const steps = computeOnboarding(
      mkProgress({ total_tasks_created: 0 }),
      [mkTask({ id: 'a' }), mkTask({ id: 'b' })]
    );
    const create = steps.find(s => s.slotId === 'create')!;
    expect(create.current).toBe(2);
  });
});

describe('onboardingCompletion (slots maxados)', () => {
  it('retorna 0/6 com usuário novo', () => {
    const c = onboardingCompletion(computeOnboarding(null, []));
    expect(c.maxed).toBe(0);
    expect(c.total).toBe(6);
    expect(c.percentage).toBe(0);
  });

  it('conta apenas slots completamente vencidos', () => {
    // 60 criadas (passou da última de complete=200? não, só da última de create=100? sim)
    // create: 60 < 100, não maxed
    // complete: 0, not maxed
    const c = onboardingCompletion(computeOnboarding(
      mkProgress({ total_tasks_created: 60 }),
      [],
    ));
    expect(c.maxed).toBe(0);
  });

  it('marca todos os 5 slots como maxados', () => {
    const tasks = Array.from({ length: 10 }, (_, i) =>
      mkTask({ id: `${i}`, shared_with: ['u'] })
    );
    const steps = computeOnboarding(
      mkProgress({
        total_tasks_created: 200,
        total_tasks_completed: 300,
        best_streak: 150,
        experience_points: 15000,
        total_locations: 30,
      }),
      tasks
    );
    const c = onboardingCompletion(steps);
    expect(c.maxed).toBe(6);
    expect(c.percentage).toBe(100);
  });

  it('locations: nível 1 quando user tem menos de 3 locais', () => {
    const steps = computeOnboarding(mkProgress({ total_locations: 2 }), []);
    const loc = steps.find(s => s.slotId === 'locations')!;
    expect(loc.id).toBe('locations-3');
    expect(loc.level).toBe(1);
    expect(loc.current).toBe(2);
  });

  it('locations: promove para 10 após atingir 3', () => {
    const steps = computeOnboarding(mkProgress({ total_locations: 3 }), []);
    const loc = steps.find(s => s.slotId === 'locations')!;
    expect(loc.id).toBe('locations-10');
    expect(loc.level).toBe(2);
  });
});
