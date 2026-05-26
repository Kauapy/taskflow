import styled from 'styled-components';
import {
  Award, Zap, Flame, CheckCircle, ListPlus, Share2, MapPin, Star, ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Task, UserProgress } from '../lib/supabase';
import { computeOnboarding, OnboardingSlotId, OnboardingStep } from '../lib/onboarding';

interface MissionsProps {
  progress: UserProgress | null;
  tasks: Task[];
  loading: boolean;
}

interface SlotMeta {
  Icon: LucideIcon;
  /** Cor do destaque do card. */
  accent: string;
}

const SLOT_META: Record<OnboardingSlotId, SlotMeta> = {
  create:    { Icon: ListPlus,     accent: '#FF6B35' },
  complete:  { Icon: CheckCircle,  accent: '#28A745' },
  streak:    { Icon: Flame,        accent: '#FF4500' },
  xp:        { Icon: Zap,          accent: '#FFC107' },
  share:     { Icon: Share2,       accent: '#17A2B8' },
  locations: { Icon: MapPin,       accent: '#8A2BE2' },
};

const Missions = ({ progress, tasks, loading }: MissionsProps) => {
  if (loading) {
    return <LoadingText>Carregando missões...</LoadingText>;
  }

  const steps = computeOnboarding(progress, tasks);
  const maxedCount = steps.filter(s => s.isMaxed).length;

  const level = progress?.level ?? 1;
  const xp = progress?.experience_points ?? 0;
  const completed = progress?.total_tasks_completed ?? 0;
  const streak = progress?.current_streak ?? 0;

  return (
    <Container>
      <StatsGrid>
        <StatCard>
          <StatIcon color="#FF6B35"><Award size={28} aria-hidden="true" /></StatIcon>
          <StatInfo>
            <StatValue>Nível {level}</StatValue>
            <StatLabel>Seu nível</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon color="#FFA07A"><Zap size={28} aria-hidden="true" /></StatIcon>
          <StatInfo>
            <StatValue>{xp} XP</StatValue>
            <StatLabel>Experiência</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon color="#28A745"><CheckCircle size={28} aria-hidden="true" /></StatIcon>
          <StatInfo>
            <StatValue>{completed}</StatValue>
            <StatLabel>Tarefas concluídas</StatLabel>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon color="#17A2B8"><Flame size={28} aria-hidden="true" /></StatIcon>
          <StatInfo>
            <StatValue>{streak} dias</StatValue>
            <StatLabel>Sequência atual</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      <SectionHeader>
        <h2>Missões em progresso</h2>
        <SectionSubtitle>
          <span>Ao bater o objetivo, a próxima missão da cadeia entra automaticamente.</span>
          {maxedCount > 0 && (
            <MaxedSummary>
              <Star size={12} aria-hidden="true" />
              {maxedCount} {maxedCount === 1 ? 'cadeia completa' : 'cadeias completas'}
            </MaxedSummary>
          )}
        </SectionSubtitle>
      </SectionHeader>

      <MissionsGrid>
        {steps.map(step => (
          <MissionCard key={step.slotId} step={step} />
        ))}
      </MissionsGrid>
    </Container>
  );
};

const MissionCard = ({ step }: { step: OnboardingStep }) => {
  const meta = SLOT_META[step.slotId];
  const pct = step.target === 0 ? 100 : Math.min(100, (step.current / step.target) * 100);
  const Icon = meta.Icon;

  return (
    <Card maxed={step.isMaxed} accent={meta.accent}>
      <CardHeader>
        <CardIcon color={meta.accent} maxed={step.isMaxed}>
          <Icon size={22} aria-hidden="true" />
        </CardIcon>
        <CardHead>
          <CardTitle maxed={step.isMaxed}>{step.title}</CardTitle>
          <CardDesc>{step.description}</CardDesc>
        </CardHead>
        {step.isMaxed && (
          <MaxedBadge title="Cadeia completa">
            <Star size={14} aria-hidden="true" />
          </MaxedBadge>
        )}
      </CardHeader>

      <ProgressArea>
        <ProgressBar>
          <ProgressFill percentage={pct} color={meta.accent} maxed={step.isMaxed} />
        </ProgressBar>
        <ProgressInfo>
          <Counter maxed={step.isMaxed}>
            {step.isMaxed
              ? '✓ Cadeia completa'
              : `${formatNum(step.current)} / ${formatNum(step.target)}`}
          </Counter>
          <LevelText>
            Nível {step.level} de {step.total}
          </LevelText>
        </ProgressInfo>
      </ProgressArea>

      {!step.isMaxed && step.level < step.total && (
        <NextHint>
          <ChevronRight size={12} aria-hidden="true" />
          Próximo desafio: nível {step.level + 1} de {step.total}
        </NextHint>
      )}
    </Card>
  );
};

const formatNum = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k`.replace('.0', '') : `${n}`;

// ──────────────────────────────────────────────────────── styled

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const StatCard = styled.div`
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${p => p.theme.colors.primary};
    transform: translateY(-1px);
  }
`;

const StatIcon = styled.div<{ color: string }>`
  background: ${p => p.color}22;
  color: ${p => p.color};
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${p => p.color}55;
  flex-shrink: 0;
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};
  font-weight: 500;
`;

const SectionHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;

  h2 {
    font-size: 18px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
  }
`;

const SectionSubtitle = styled.div`
  font-size: 13px;
  color: ${p => p.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const MaxedSummary = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${p => p.theme.colors.warning}22;
  color: ${p => p.theme.colors.warning};
  border: 1px solid ${p => p.theme.colors.warning}55;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
`;

const MissionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
`;

const Card = styled.div<{ maxed: boolean; accent: string }>`
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p =>
    p.maxed ? p.theme.colors.warning + '88' : p.theme.colors.border};
  border-left: 3px solid ${p => (p.maxed ? p.theme.colors.warning : p.accent)};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  opacity: ${p => (p.maxed ? 0.85 : 1)};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${p => p.theme.colors.shadow};
  }
`;

const CardHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const CardIcon = styled.div<{ color: string; maxed: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${p => (p.maxed ? p.theme.colors.warning : p.color)}22;
  color: ${p => (p.maxed ? p.theme.colors.warning : p.color)};
  border: 1px solid ${p => (p.maxed ? p.theme.colors.warning : p.color)}55;
  flex-shrink: 0;
`;

const CardHead = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardTitle = styled.h3<{ maxed: boolean }>`
  font-size: 15px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  text-decoration: ${p => (p.maxed ? 'line-through' : 'none')};
  line-height: 1.3;
  margin-bottom: 2px;
`;

const CardDesc = styled.p`
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};
  line-height: 1.4;
`;

const MaxedBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${p => p.theme.colors.warning};
  color: white;
  flex-shrink: 0;
`;

const ProgressArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${p => p.theme.colors.border};
  border-radius: 999px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ percentage: number; color: string; maxed: boolean }>`
  height: 100%;
  width: ${p => p.percentage}%;
  background: ${p => (p.maxed ? p.theme.colors.warning : p.color)};
  border-radius: 999px;
  transition: width 0.4s ease;
`;

const ProgressInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Counter = styled.span<{ maxed: boolean }>`
  font-size: 13px;
  font-weight: 700;
  color: ${p => (p.maxed ? p.theme.colors.warning : p.theme.colors.text)};
  font-variant-numeric: tabular-nums;
`;

const LevelText = styled.span`
  font-size: 11px;
  color: ${p => p.theme.colors.textSecondary};
  font-style: italic;
`;

const NextHint = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: ${p => p.theme.colors.textSecondary};
  font-style: italic;
  margin-top: -4px;
`;

const LoadingText = styled.p`
  text-align: center;
  color: ${p => p.theme.colors.textSecondary};
  padding: 32px;
  font-size: 15px;
`;

export default Missions;
