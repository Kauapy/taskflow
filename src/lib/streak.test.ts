import { describe, it, expect } from 'vitest';
import { applyStreakOnCompletion } from './streak';

describe('applyStreakOnCompletion', () => {
  const NOW = new Date('2026-05-09T10:00:00');

  it('inicia streak em 1 quando não há atividade prévia', () => {
    const r = applyStreakOnCompletion(
      { currentStreak: 0, bestStreak: 0, lastActivity: null },
      NOW
    );
    expect(r.currentStreak).toBe(1);
    expect(r.bestStreak).toBe(1);
  });

  it('mantém streak quando a última atividade foi hoje (hora diferente)', () => {
    const r = applyStreakOnCompletion(
      { currentStreak: 5, bestStreak: 5, lastActivity: '2026-05-09T01:00:00' },
      NOW
    );
    expect(r.currentStreak).toBe(5);
    expect(r.bestStreak).toBe(5);
  });

  it('incrementa quando a última atividade foi ontem', () => {
    const r = applyStreakOnCompletion(
      { currentStreak: 3, bestStreak: 3, lastActivity: '2026-05-08T22:00:00' },
      NOW
    );
    expect(r.currentStreak).toBe(4);
    expect(r.bestStreak).toBe(4);
  });

  it('reseta para 1 quando a última atividade foi há 2+ dias', () => {
    const r = applyStreakOnCompletion(
      { currentStreak: 7, bestStreak: 10, lastActivity: '2026-05-06T10:00:00' },
      NOW
    );
    expect(r.currentStreak).toBe(1);
    expect(r.bestStreak).toBe(10); // não regride
  });

  it('atualiza bestStreak quando o currentStreak novo o supera', () => {
    const r = applyStreakOnCompletion(
      { currentStreak: 9, bestStreak: 9, lastActivity: '2026-05-08T10:00:00' },
      NOW
    );
    expect(r.currentStreak).toBe(10);
    expect(r.bestStreak).toBe(10);
  });

  it('não regride bestStreak quando currentStreak reseta', () => {
    const r = applyStreakOnCompletion(
      { currentStreak: 12, bestStreak: 12, lastActivity: '2026-04-01T10:00:00' },
      NOW
    );
    expect(r.currentStreak).toBe(1);
    expect(r.bestStreak).toBe(12);
  });
});
