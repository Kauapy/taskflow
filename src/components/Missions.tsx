import styled from 'styled-components';
import { UserProgress } from '../lib/supabase';
import { Target, TrendingUp, MapPin, Flame, Award, Zap, CheckCircle } from 'lucide-react';

interface MissionsProps {
  progress: UserProgress | null;
  loading: boolean;
}

const Missions = ({ progress, loading }: MissionsProps) => {
  if (loading || !progress) {
    return <LoadingText>Carregando missões...</LoadingText>;
  }

  const missions = [
    {
      id: 1,
      title: 'Completar 5 tarefas',
      description: 'Complete 5 tarefas para ganhar +100 XP',
      icon: <CheckCircle size={24} />,
      current: progress.total_tasks_completed,
      target: 5,
      color: '#FF6B35',
      reward: 100,
    },
    {
      id: 2,
      title: 'Completar 25 tarefas',
      description: 'Complete 25 tarefas para ganhar +500 XP',
      icon: <CheckCircle size={24} />,
      current: progress.total_tasks_completed,
      target: 25,
      color: '#FFA07A',
      reward: 500,
    },
    {
      id: 5,
      title: 'Completar 100 tarefas',
      description: 'Uma marca histórica! Complete 100 tarefas.',
      icon: <Award size={24} />,
      current: progress.total_tasks_completed,
      target: 100,
      color: '#E0115F',
      reward: 2500,
    },
    {
      id: 6,
      title: 'Mestre das Tarefas',
      description: 'Complete 500 tarefas para obter um bônus especial.',
      icon: <Award size={24} />,
      current: progress.total_tasks_completed,
      target: 500,
      color: '#8A2BE2',
      reward: 10000,
    },
    {
      id: 3,
      title: 'Adicionar 3 locais',
      description: 'Use 3 localizações diferentes',
      icon: <MapPin size={24} />,
      current: progress.total_locations,
      target: 3,
      color: '#17A2B8',
      reward: 150,
    },
    {
      id: 7,
      title: 'Explorador',
      description: 'Use 10 localizações diferentes',
      icon: <MapPin size={24} />,
      current: progress.total_locations,
      target: 10,
      color: '#007BFF',
      reward: 600,
    },
    {
      id: 8,
      title: 'Viajante',
      description: 'Use 25 localizações diferentes',
      icon: <MapPin size={24} />,
      current: progress.total_locations,
      target: 25,
      color: '#0000CD',
      reward: 2000,
    },
    {
      id: 4,
      title: 'Criar 10 tarefas',
      description: 'Crie 10 tarefas no total',
      icon: <Zap size={24} />,
      current: progress.total_tasks_created,
      target: 10,
      color: '#FFC107',
      reward: 200,
    },
    {
      id: 9,
      title: 'Criar 50 tarefas',
      description: 'Adicione 50 tarefas ao seu fluxo',
      icon: <Zap size={24} />,
      current: progress.total_tasks_created,
      target: 50,
      color: '#FF9800',
      reward: 800,
    },
    {
      id: 10,
      title: 'Organizador Nato',
      description: 'Crie 200 tarefas no total',
      icon: <TrendingUp size={24} />,
      current: progress.total_tasks_created,
      target: 200,
      color: '#FF5722',
      reward: 3000,
    },
    {
      id: 11,
      title: 'Aquecimento',
      description: 'Mantenha uma sequência de 3 dias seguidos',
      icon: <Flame size={24} />,
      current: progress.current_streak,
      target: 3,
      color: '#FF4500',
      reward: 300,
    },
    {
      id: 12,
      title: 'Pegando Fogo',
      description: 'Mantenha uma sequência de 7 dias seguidos',
      icon: <Flame size={24} />,
      current: progress.current_streak,
      target: 7,
      color: '#E25822',
      reward: 1000,
    },
    {
      id: 13,
      title: 'Hábito Formado',
      description: 'Alcance 30 dias seguidos completando tarefas',
      icon: <Flame size={24} />,
      current: progress.current_streak,
      target: 30,
      color: '#DC143C',
      reward: 5000,
    },
    {
      id: 14,
      title: 'Implacável',
      description: 'Atingir uma sequência de 100 dias!',
      icon: <Flame size={24} />,
      current: progress.current_streak,
      target: 100,
      color: '#8B0000',
      reward: 20000,
    }
  ];

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <Container>
      <StatsGrid>
        <StatCard>
          <StatIcon color="#FF6B35">
            <Award size={28} />
          </StatIcon>
          <StatInfo>
            <StatValue>Nível {progress.level}</StatValue>
            <StatLabel>Seu Nível</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon color="#FFA07A">
            <Zap size={28} />
          </StatIcon>
          <StatInfo>
            <StatValue>{progress.experience_points} XP</StatValue>
            <StatLabel>Experiência</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon color="#28A745">
            <CheckCircle size={28} />
          </StatIcon>
          <StatInfo>
            <StatValue>{progress.total_tasks_completed}</StatValue>
            <StatLabel>Tarefas Concluídas</StatLabel>
          </StatInfo>
        </StatCard>

        <StatCard>
          <StatIcon color="#17A2B8">
            <Flame size={28} />
          </StatIcon>
          <StatInfo>
            <StatValue>{progress.current_streak} dias</StatValue>
            <StatLabel>Sequência</StatLabel>
          </StatInfo>
        </StatCard>
      </StatsGrid>

      <MissionsGrid>
        {missions.map((mission) => {
          const percentage = getProgressPercentage(mission.current, mission.target);
          const isCompleted = percentage >= 100;

          return (
            <MissionCard key={mission.id} completed={isCompleted}>
              <MissionHeader>
                <MissionIcon color={mission.color} completed={isCompleted}>
                  {mission.icon}
                </MissionIcon>
                <MissionInfo>
                  <MissionTitle completed={isCompleted}>{mission.title}</MissionTitle>
                  <MissionDescription>{mission.description}</MissionDescription>
                </MissionInfo>
                {isCompleted && <CompletedBadge>✓</CompletedBadge>}
              </MissionHeader>

              <ProgressBar>
                <ProgressFill percentage={percentage} color={mission.color} />
              </ProgressBar>

              <MissionFooter>
                <ProgressText>
                  {mission.current} / {mission.target}
                </ProgressText>
                <RewardText>+{mission.reward} XP</RewardText>
              </MissionFooter>
            </MissionCard>
          );
        })}
      </MissionsGrid>
    </Container>
  );
};

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
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.shadow};
  }
`;

const StatIcon = styled.div<{ color: string }>`
  background: ${props => props.color}22;
  color: ${props => props.color};
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.color};
`;

const StatInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 500;
`;

const MissionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
`;

const MissionCard = styled.div<{ completed: boolean }>`
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.completed
    ? props.theme.colors.success
    : props.theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  opacity: ${props => props.completed ? 0.8 : 1};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.shadow};
  }
`;

const MissionHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
  position: relative;
`;

const MissionIcon = styled.div<{ color: string; completed: boolean }>`
  background: ${props => props.completed
    ? props.theme.colors.success + '22'
    : props.color + '22'};
  color: ${props => props.completed
    ? props.theme.colors.success
    : props.color};
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid ${props => props.completed
    ? props.theme.colors.success
    : props.color};
`;

const MissionInfo = styled.div`
  flex: 1;
`;

const MissionTitle = styled.h4<{ completed: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 4px;
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
`;

const MissionDescription = styled.p`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.4;
`;

const CompletedBadge = styled.div`
  background: ${props => props.theme.colors.success};
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: ${props => props.theme.colors.border};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div<{ percentage: number; color: string }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => props.color};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const MissionFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProgressText = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const RewardText = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`;

const LoadingText = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  padding: 32px;
  font-size: 15px;
`;

export default Missions;
