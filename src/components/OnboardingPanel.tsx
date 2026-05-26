import styled from 'styled-components';
import {
  Award, Zap, Flame, ChevronRight, Target, ListPlus, CheckCircle2,
  Share2, Star, MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Task, UserProgress } from '../lib/supabase';
import {
  computeOnboarding, onboardingCompletion, OnboardingSlotId,
} from '../lib/onboarding';
import type { ViewId } from './Sidebar';

interface OnboardingPanelProps {
  progress: UserProgress | null;
  tasks: Task[];
  onNavigate: (view: ViewId) => void;
}

const SLOT_ICON: Record<OnboardingSlotId, LucideIcon> = {
  create: ListPlus,
  complete: CheckCircle2,
  streak: Flame,
  xp: Zap,
  share: Share2,
  locations: MapPin,
};

const OnboardingPanel = ({ progress, tasks, onNavigate }: OnboardingPanelProps) => {
  const steps = computeOnboarding(progress, tasks);
  const completion = onboardingCompletion(steps);

  const level = progress?.level ?? 1;
  const xp = progress?.experience_points ?? 0;
  const streak = progress?.current_streak ?? 0;

  return (
    <Panel aria-label="Painel de progresso">
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

      <Section>
        <SectionHeader>
          <h3>Missões ativas</h3>
          {completion.maxed > 0 && (
            <MaxedBadge title={`${completion.maxed} de ${completion.total} cadeias completas`}>
              <Star size={11} aria-hidden="true" />
              {completion.maxed}/{completion.total}
            </MaxedBadge>
          )}
        </SectionHeader>

        <Checklist>
          {steps.map(step => {
            const Icon = SLOT_ICON[step.slotId];
            const pct = step.target === 0
              ? 100
              : Math.min(100, (step.current / step.target) * 100);
            return (
              <StepItem
                key={step.slotId}
                type="button"
                maxed={step.isMaxed}
                onClick={() => !step.isMaxed && onNavigate(step.cta)}
                disabled={step.isMaxed}
                aria-label={`${step.title} - ${step.current} de ${step.target} (nível ${step.level}/${step.total})`}
              >
                <StepIcon maxed={step.isMaxed}>
                  <Icon size={14} aria-hidden="true" />
                </StepIcon>
                <StepBody>
                  <StepHead>
                    <StepTitle maxed={step.isMaxed}>{step.title}</StepTitle>
                    <StepCounter maxed={step.isMaxed}>
                      {step.isMaxed ? '✓' : `${formatNum(step.current)}/${formatNum(step.target)}`}
                    </StepCounter>
                  </StepHead>
                  <StepDesc>{step.description}</StepDesc>
                  <StepBar>
                    <StepFill percentage={pct} maxed={step.isMaxed} />
                  </StepBar>
                  <StepLevel>
                    {step.isMaxed
                      ? 'Cadeia completa'
                      : `Nível ${step.level} de ${step.total}`}
                  </StepLevel>
                </StepBody>
                {!step.isMaxed && (
                  <ChevronRight size={14} aria-hidden="true" style={{ flexShrink: 0, opacity: 0.5 }} />
                )}
              </StepItem>
            );
          })}
        </Checklist>
      </Section>

      <MissionsLink type="button" onClick={() => onNavigate('missions')}>
        <Target size={14} aria-hidden="true" />
        <span>Ver todas as missões</span>
        <ChevronRight size={14} aria-hidden="true" />
      </MissionsLink>
    </Panel>
  );
};

const formatNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k`.replace('.0', '') : `${n}`);

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
  }
`;

const MaxedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${p => p.theme.colors.warning}22;
  color: ${p => p.theme.colors.warning};
  border: 1px solid ${p => p.theme.colors.warning}55;
`;

const Checklist = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StepItem = styled.button<{ maxed: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.background};
  border-radius: 8px;
  text-align: left;
  width: 100%;
  cursor: ${p => (p.maxed ? 'default' : 'pointer')};
  transition: all 0.15s;
  opacity: ${p => (p.maxed ? 0.75 : 1)};

  &:hover:not(:disabled) {
    border-color: ${p => p.theme.colors.primary};
    background: ${p => p.theme.colors.surface};
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary};
    outline-offset: 1px;
  }
`;

const StepIcon = styled.div<{ maxed: boolean }>`
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => (p.maxed ? p.theme.colors.warning + '22' : p.theme.colors.primary + '22')};
  color: ${p => (p.maxed ? p.theme.colors.warning : p.theme.colors.primary)};
`;

const StepBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const StepHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`;

const StepTitle = styled.div<{ maxed: boolean }>`
  font-size: 12px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
  text-decoration: ${p => (p.maxed ? 'line-through' : 'none')};
`;

const StepCounter = styled.span<{ maxed: boolean }>`
  font-size: 11px;
  font-weight: 700;
  color: ${p => (p.maxed ? p.theme.colors.warning : p.theme.colors.textSecondary)};
  font-variant-numeric: tabular-nums;
`;

const StepDesc = styled.div`
  font-size: 11px;
  color: ${p => p.theme.colors.textSecondary};
  line-height: 1.3;
`;

const StepBar = styled.div`
  width: 100%;
  height: 3px;
  background: ${p => p.theme.colors.border};
  border-radius: 999px;
  overflow: hidden;
  margin-top: 2px;
`;

const StepFill = styled.div<{ percentage: number; maxed: boolean }>`
  height: 100%;
  width: ${p => p.percentage}%;
  background: ${p => (p.maxed ? p.theme.colors.warning : p.theme.colors.primary)};
  border-radius: 999px;
  transition: width 0.4s ease;
`;

const StepLevel = styled.div`
  font-size: 10px;
  color: ${p => p.theme.colors.textSecondary};
  font-style: italic;
  margin-top: 2px;
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
