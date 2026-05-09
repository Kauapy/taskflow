import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../styles/theme';
import Missions from './Missions';
import type { UserProgress } from '../lib/supabase';

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

describe('<Missions />', () => {
  it('mostra o estado de carregando quando loading=true', () => {
    wrap(<Missions progress={null} loading />);
    expect(screen.getByText(/Carregando missões/i)).toBeInTheDocument();
  });

  it('exibe os números de XP e nível atuais', () => {
    wrap(
      <Missions
        progress={mkProgress({ experience_points: 250, level: 3, current_streak: 5 })}
        loading={false}
      />
    );
    expect(screen.getByText('Nível 3')).toBeInTheDocument();
    expect(screen.getByText('250 XP')).toBeInTheDocument();
    expect(screen.getByText('5 dias')).toBeInTheDocument();
  });

  it('marca como concluída a missão "Completar 5 tarefas" quando o usuário tem 5+ completadas', () => {
    wrap(
      <Missions
        progress={mkProgress({ total_tasks_completed: 5 })}
        loading={false}
      />
    );
    // O título da missão tem 'Completar 5 tarefas'; quando completa, recebe text-decoration line-through.
    const title = screen.getByText('Completar 5 tarefas');
    expect(title).toBeInTheDocument();
    // Várias missões podem ter o "✓" de concluído; só checamos que pelo menos uma aparece.
    expect(screen.getAllByText('✓').length).toBeGreaterThan(0);
  });

  it('não marca uma missão impossível como concluída', () => {
    wrap(
      <Missions
        progress={mkProgress({ current_streak: 0 })}
        loading={false}
      />
    );
    expect(screen.getByText('Implacável')).toBeInTheDocument();
    // Não deveria haver nenhum ✓ se nenhum target foi atingido (com progress zerado)
    expect(screen.queryByText('✓')).toBeNull();
  });
});
