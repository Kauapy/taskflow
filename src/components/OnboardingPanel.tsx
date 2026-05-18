import styled from 'styled-components';
import {
  Award, Zap, Flame, CheckCircle2, Circle, ChevronRight, Target,
} from 'lucide-react';
import { Task, UserProgress } from '../lib/supabase';
import { computeOnboarding, onboardingCompletion } from '../lib/onboarding';
import type { ViewId } from './Sidebar';

interface OnboardingPanelProps {
  progress: UserProgress | null;
  tasks: Task[];
  onNavigate: (view: ViewId) => void;
}

const OnboardingPanel = ({ progress, tasks, onNavigate }: OnboardingPanelProps) => {
  const steps = computeOnboarding(progress, tasks);
  const completion = onboardingCompletion(steps);

  const level = progress?.level ?? 1;
  const xp = progress?.experience_points ?? 0;
  const streak = progress?.current_streak ?? 0;

  return (
    <Panel aria-label="Painel de progresso">
      {/* Bloco de gamificação compacto */}
      <Stats>
        <StatCard>
          <StatIcon><Award size={14} aria-hidden="true" /></StatIcon>
          <StatLabel>Nível</StatLabel>
          <StatValue>{level}</StatValue>
        </StatCard>
        <StatCard>
          <StatIcon><Zap size={14} aria-hidden="true" /></StatIcon>
          <StatLabel>XP</StatLabel>
          <StatValue>{xp}</StatValue>
        </StatCard>
        <StatCard>
          <StatIcon><Flame size={14} aria-hidden="true" /></StatIcon>
          <StatLabel>Sequência</StatLabel>
          <StatValue>{streak}d</StatValue>
        </StatCard>
      </Stats>

      {/* Checklist de primeiros passos */}
      <Section>
        <SectionHeader>
          <h3>Primeiros passos</h3>
          <Counter>{completion.done}/{completion.total}</Counter>
        </SectionHeader>
        <ProgressBar>
          <ProgressFill percentage={completion.percentage} />
        </ProgressBar>

        <Checklist>
          {steps.map(step => (
            <StepItem
              key={step.id}
              type="button"
              done={step.done}
              onClick={() => !step.done && onNavigate(step.cta)}
              disabled={step.done}
              aria-label={`${step.title} - ${step.done ? 'concluído' : 'pendente'}`}
            >
              <StepIcon done={step.done}>
                {step.done
                  ? <CheckCircle2 size={16} aria-hidden="true" />
                  : <Circle size={16} aria-hidden="true" />}
              </StepIcon>
              <StepText>
                <StepTitle done={step.done}>{step.title}</StepTitle>
                <StepDesc>{step.description}</StepDesc>
              </StepText>
              {!step.done && <ChevronRight size={14} aria-hidden="true" />}
            </StepItem>
          ))}
        </Checklist>

        {completion.done === completion.total && (
          <CompletedMsg>
            🎉 Você concluiu os primeiros passos!
          </CompletedMsg>
        )}
      </Section>

      {/* Link para todas as missões */}
      <MissionsLink
        type="button"
        onClick={() => onNavigate('missions')}
      >
        <Target size={14} aria-hidden="true" />
        <span>Ver todas as missões</span>
        <ChevronRight size={14} aria-hidden="true" />
      </MissionsLink>
    </Panel>
  );
};

// ──────────────────────────────────────────────────────── styled

const Panel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 12px;
  width: 100%;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  background: ${p => p.theme.colors.background};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 8px;
`;

const StatIcon = styled.div`
  color: ${p => p.theme.colors.primary};
`;

const StatLabel = styled.span`
  font-size: 10px;
  color: ${p => p.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 600;
`;

const StatValue = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: 13px;
    font-weight: 600;
    color: ${p => p.theme.colors.text};
    letter-spacing: 0.1px;
  }
`;

const Counter = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${p => p.theme.colors.textSecondary};
  background: ${p => p.theme.colors.background};
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid ${p => p.theme.colors.border};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: ${p => p.theme.colors.background};
  border-radius: 999px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  width: ${p => p.percentage}%;
  background: ${p => p.theme.colors.primary};
  border-radius: 999px;
  transition: width 0.3s ease;
`;

const Checklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
`;

const StepItem = styled.button<{ done: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border: none;
  background: transparent;
  border-radius: 8px;
  text-align: left;
  width: 100%;
  cursor: ${p => (p.done ? 'default' : 'pointer')};
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: ${p => p.theme.colors.background};
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary};
    outline-offset: 1px;
  }
`;

const StepIcon = styled.div<{ done: boolean }>`
  flex-shrink: 0;
  color: ${p => (p.done ? p.theme.colors.success : p.theme.colors.textSecondary)};
`;

const StepText = styled.div`
  flex: 1;
  min-width: 0;
`;

const StepTitle = styled.div<{ done: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
  text-decoration: ${p => (p.done ? 'line-through' : 'none')};
  opacity: ${p => (p.done ? 0.6 : 1)};
`;

const StepDesc = styled.div`
  font-size: 11px;
  color: ${p => p.theme.colors.textSecondary};
  line-height: 1.3;
  margin-top: 1px;
`;

const CompletedMsg = styled.p`
  font-size: 12px;
  color: ${p => p.theme.colors.success};
  text-align: center;
  font-weight: 600;
  padding: 8px;
  background: ${p => p.theme.colors.success}18;
  border-radius: 6px;
`;

const MissionsLink = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px dashed ${p => p.theme.colors.border};
  border-radius: 8px;
  background: transparent;
  color: ${p => p.theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;

  span { flex: 1; text-align: left; }

  &:hover {
    color: ${p => p.theme.colors.primary};
    border-color: ${p => p.theme.colors.primary};
    border-style: solid;
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary};
    outline-offset: 1px;
  }
`;

export default OnboardingPanel;
