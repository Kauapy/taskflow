import styled from 'styled-components';
import { Plus, ArrowRight, ListTodo, CheckCircle2, Clock } from 'lucide-react';
import { Task, UserProgress } from '../lib/types';

interface HomeViewProps {
  userEmail: string;
  tasks: Task[];
  progress: UserProgress | null;
  onCreateTask: () => void;
  onViewTasks: () => void;
}

const HomeView = ({ userEmail, tasks, progress, onCreateTask, onViewTasks }: HomeViewProps) => {
  const userName = (userEmail.split('@')[0] || 'usuário').replace(/[._-]/g, ' ');
  const activeTasks = tasks.filter(t => !t.completed);
  const overdueTasks = activeTasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date()
  );

  const isNewUser = tasks.length === 0 && (progress?.total_tasks_created ?? 0) === 0;

  // Próxima tarefa: a mais urgente / a com menor due_date
  const nextTasks = [...activeTasks]
    .sort((a, b) => {
      const ua = urgencyRank(a.urgency);
      const ub = urgencyRank(b.urgency);
      if (ua !== ub) return ub - ua;
      const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return da - db;
    })
    .slice(0, 3);

  return (
    <Wrap>
      <Welcome>
        <Greeting>Olá, {userName}.</Greeting>
        <Sub>
          {isNewUser
            ? 'Bem-vindo ao Taskflow. Vamos criar sua primeira tarefa?'
            : 'Aqui está como você está indo hoje.'}
        </Sub>
      </Welcome>

      {/* Estatísticas mínimas, só se já houver dados */}
      {!isNewUser && (
        <StatsRow>
          <Stat>
            <StatIcon><ListTodo size={16} aria-hidden="true" /></StatIcon>
            <StatBody>
              <StatLabel>Ativas</StatLabel>
              <StatValue>{activeTasks.length}</StatValue>
            </StatBody>
          </Stat>
          <Stat>
            <StatIcon><CheckCircle2 size={16} aria-hidden="true" /></StatIcon>
            <StatBody>
              <StatLabel>Concluídas</StatLabel>
              <StatValue>{progress?.total_tasks_completed ?? 0}</StatValue>
            </StatBody>
          </Stat>
          {overdueTasks.length > 0 && (
            <Stat highlight="danger">
              <StatIcon><Clock size={16} aria-hidden="true" /></StatIcon>
              <StatBody>
                <StatLabel>Vencidas</StatLabel>
                <StatValue>{overdueTasks.length}</StatValue>
              </StatBody>
            </Stat>
          )}
        </StatsRow>
      )}

      {/* Card de ação principal */}
      <ActionCard newUser={isNewUser}>
        <ActionText>
          <h2>
            {isNewUser
              ? 'Pronto para começar?'
              : 'Adicione uma nova tarefa'}
          </h2>
          <p>
            {isNewUser
              ? 'Crie sua primeira tarefa e ganhe seus primeiros 10 XP.'
              : 'Mantenha o ritmo e suba de nível.'}
          </p>
        </ActionText>
        <PrimaryBtn type="button" onClick={onCreateTask}>
          <Plus size={16} aria-hidden="true" />
          Nova tarefa
        </PrimaryBtn>
      </ActionCard>

      {/* Próximas tarefas — só aparece se existem */}
      {nextTasks.length > 0 && (
        <RecentSection>
          <RecentHeader>
            <h3>Próximas na sua lista</h3>
            <SeeAllLink type="button" onClick={onViewTasks}>
              Ver todas
              <ArrowRight size={14} aria-hidden="true" />
            </SeeAllLink>
          </RecentHeader>
          <TaskList>
            {nextTasks.map(task => (
              <TaskRow key={task.id}>
                <UrgencyDot urgency={task.urgency} />
                <TaskTitle>{task.title}</TaskTitle>
                {task.due_date && (
                  <DueDate overdue={new Date(task.due_date) < new Date()}>
                    {new Date(task.due_date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </DueDate>
                )}
              </TaskRow>
            ))}
          </TaskList>
        </RecentSection>
      )}
    </Wrap>
  );
};

const urgencyRank = (u: Task['urgency']) => (u === 'alta' ? 3 : u === 'media' ? 2 : 1);

const URGENCY_COLOR = {
  alta:  '#EF4444',
  media: '#F59E0B',
  baixa: '#10B981',
} as const;

// ──────────────────────────────────────────────────────── styled

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
`;

const Welcome = styled.section`
  margin-top: 8px;
`;

const Greeting = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  letter-spacing: -0.5px;
  text-transform: capitalize;
`;

const Sub = styled.p`
  font-size: 14px;
  color: ${p => p.theme.colors.textSecondary};
  margin-top: 4px;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
`;

const Stat = styled.div<{ highlight?: 'danger' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p =>
    p.highlight === 'danger' ? p.theme.colors.danger + '55' : p.theme.colors.border};
  border-radius: 10px;
`;

const StatIcon = styled.div`
  color: ${p => p.theme.colors.textSecondary};
`;

const StatBody = styled.div``;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${p => p.theme.colors.textSecondary};
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  line-height: 1.2;
`;

const ActionCard = styled.section<{ newUser: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: ${p => (p.newUser ? '32px 28px' : '20px 24px')};
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 12px;
  flex-wrap: wrap;

  ${p => p.newUser && `
    background: linear-gradient(
      135deg,
      ${p.theme.colors.primary}11 0%,
      ${p.theme.colors.surface} 100%
    );
    border-color: ${p.theme.colors.primary}55;
  `}
`;

const ActionText = styled.div`
  flex: 1;
  min-width: 200px;

  h2 {
    font-size: 18px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
    margin-bottom: 4px;
  }

  p {
    font-size: 14px;
    color: ${p => p.theme.colors.textSecondary};
    line-height: 1.5;
  }
`;

const PrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 11px 18px;
  border: none;
  border-radius: 10px;
  background: ${p => p.theme.colors.primary};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    background: ${p => p.theme.colors.primaryDark};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${p => p.theme.colors.primary}55;
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary};
    outline-offset: 2px;
  }
`;

const RecentSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RecentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: ${p => p.theme.colors.text};
  }
`;

const SeeAllLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: ${p => p.theme.colors.primary};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover { text-decoration: underline; }
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 10px;
  overflow: hidden;
`;

const TaskRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${p => p.theme.colors.surface};

  & + & { border-top: 1px solid ${p => p.theme.colors.border}; }
`;

const UrgencyDot = styled.span<{ urgency: Task['urgency'] }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${p => URGENCY_COLOR[p.urgency]};
  flex-shrink: 0;
`;

const TaskTitle = styled.div`
  flex: 1;
  font-size: 14px;
  color: ${p => p.theme.colors.text};
  word-break: break-word;
`;

const DueDate = styled.div<{ overdue: boolean }>`
  font-size: 12px;
  color: ${p => (p.overdue ? p.theme.colors.danger : p.theme.colors.textSecondary)};
  font-weight: ${p => (p.overdue ? 600 : 500)};
  white-space: nowrap;
`;

export default HomeView;
