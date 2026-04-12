import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAnalytics } from '../hooks/useAnalytics';
import { TrendingUp, Clock, Target, Award } from 'lucide-react';

const Analytics = () => {
  const { analytics, loading } = useAnalytics();

  if (loading || !analytics) {
    return <LoadingText>Carregando análises...</LoadingText>;
  }

  return (
    <Container>
      <Header>
        <h2>Análises e Métricas</h2>
      </Header>

      <MetricsGrid>
        <MetricCard>
          <MetricIcon>
            <Target size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{analytics.totalTasks}</MetricValue>
            <MetricLabel>Total de Tarefas</MetricLabel>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon>
            <Award size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{analytics.completedTasks}</MetricValue>
            <MetricLabel>Tarefas Completadas</MetricLabel>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon>
            <TrendingUp size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{analytics.productivityScore.toFixed(1)}%</MetricValue>
            <MetricLabel>Taxa de Produtividade</MetricLabel>
          </MetricContent>
        </MetricCard>

        <MetricCard>
          <MetricIcon>
            <Clock size={24} />
          </MetricIcon>
          <MetricContent>
            <MetricValue>{analytics.averageCompletionTime.toFixed(1)}h</MetricValue>
            <MetricLabel>Tempo Médio</MetricLabel>
          </MetricContent>
        </MetricCard>
      </MetricsGrid>

      <ChartsContainer>
        <ChartSection>
          <ChartTitle>Progresso Semanal</ChartTitle>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasksCreated" fill="#8884d8" name="Criadas" />
                <Bar dataKey="tasksCompleted" fill="#82ca9d" name="Completadas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartSection>

        <ChartSection>
          <ChartTitle>Progresso Mensal</ChartTitle>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="tasksCreated" stroke="#8884d8" strokeWidth={2} name="Criadas" />
                <Line type="monotone" dataKey="tasksCompleted" stroke="#82ca9d" strokeWidth={2} name="Completadas" />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartSection>
      </ChartsContainer>

      <StreaksSection>
        <StreakCard>
          <StreakTitle>Sequência Atual</StreakTitle>
          <StreakValue>{analytics.currentStreak}</StreakValue>
          <StreakLabel>dias</StreakLabel>
        </StreakCard>
        <StreakCard>
          <StreakTitle>Melhor Sequência</StreakTitle>
          <StreakValue>{analytics.bestStreak}</StreakValue>
          <StreakLabel>dias</StreakLabel>
        </StreakCard>
      </StreaksSection>
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 24px;

  h2 {
    font-size: 24px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: ${props => props.theme.colors.textSecondary};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const MetricCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
`;

const MetricIcon = styled.div`
  color: ${props => props.theme.colors.primary};
`;

const MetricContent = styled.div`
  flex: 1;
`;

const MetricValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const MetricLabel = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  margin-bottom: 32px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ChartSection = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 16px;
`;

const ChartWrapper = styled.div`
  width: 100%;
  height: 300px;
`;

const StreaksSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
`;

const StreakCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
`;

const StreakTitle = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const StreakValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
`;

const StreakLabel = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
`;

export default Analytics;