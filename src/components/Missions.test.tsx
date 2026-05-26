import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../styles/theme';
import Missions from './Missions';
import type { Task, UserProgress } from '../lib/supabase';

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);

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

const mkTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'x', user_id: 'u', title: 't', urgency: 'media', location: '',
  completed: false, completed_at: null, created_at: '', category: '',
  due_date: null, attachments: [], shared_with: [], ...overrides,
});

describe('<Missions />', () => {
  it('mostra o estado de carregando quando loading=true', () => {
    wrap(<Missions progress={null} tasks={[]} loading />);
    expect(screen.getByText(/Carregando missões/i)).toBeInTheDocument();
  });

  it('exibe os números de nível, XP, tarefas concluídas e sequência', () => {
    wrap(
      <Missions
        progress={mkProgress({
          experience_points: 250,
          level: 3,
          current_streak: 5,
          total_tasks_completed: 42,
        })}
        tasks={[]}
        loading={false}
      />
    );
    expect(screen.getByText('Nível 3')).toBeInTheDocument();
    expect(screen.getByText('250 XP')).toBeInTheDocument();
    expect(screen.getByText('5 dias')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('mostra a missão ativa do slot "create" como nível 1 quando usuário novo', () => {
    wrap(<Missions progress={mkProgress()} tasks={[]} loading={false} />);
    expect(screen.getByText('Crie sua primeira tarefa')).toBeInTheDocument();
    // ao menos um card mostra "Nível 1 de N" — slots começam todos no nível 1
    expect(screen.getAllByText(/Nível 1 de \d/).length).toBeGreaterThan(0);
  });

  it('promove a missão de "create" para o próximo nível ao atingir o target', () => {
    wrap(
      <Missions
        progress={mkProgress({ total_tasks_created: 1 })}
        tasks={[]}
        loading={false}
      />
    );
    // Com 1 tarefa criada, o slot "create" já passou de 1 e a próxima é 5
    expect(screen.getByText('Crie 5 tarefas')).toBeInTheDocument();
  });

  it('mostra "Cadeia completa" quando uma cadeia inteira foi vencida', () => {
    wrap(
      <Missions
        progress={mkProgress({ total_tasks_created: 999 })}
        tasks={[]}
        loading={false}
      />
    );
    expect(screen.getAllByText(/Cadeia completa/i).length).toBeGreaterThan(0);
  });

  it('renderiza todos os 6 slots de missão para um usuário novo', () => {
    wrap(<Missions progress={mkProgress()} tasks={[]} loading={false} />);
    expect(screen.getByText('Crie sua primeira tarefa')).toBeInTheDocument();
    expect(screen.getByText('Conclua uma tarefa')).toBeInTheDocument();
    expect(screen.getByText('Sequência de 3 dias')).toBeInTheDocument();
    expect(screen.getByText('Ganhe 100 XP')).toBeInTheDocument();
    expect(screen.getByText('Compartilhe uma tarefa')).toBeInTheDocument();
    expect(screen.getByText('Use 3 locais diferentes')).toBeInTheDocument();
  });

  it('o slot "share" reage a tarefas com shared_with não vazio', () => {
    const tasks = [
      mkTask({ id: 'a', shared_with: ['u1'] }),
      mkTask({ id: 'b', shared_with: ['u2'] }),
    ];
    wrap(<Missions progress={mkProgress()} tasks={tasks} loading={false} />);
    // 2 já está acima do target=1, então a missão ativa é "Compartilhe 3 tarefas"
    expect(screen.getByText('Compartilhe 3 tarefas')).toBeInTheDocument();
  });
});
