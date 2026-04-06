import styled from 'styled-components';
import { Task } from '../lib/supabase';
import { CheckCircle, Circle, Trash2, MapPin, AlertCircle } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  completed?: boolean;
}

const TaskList = ({ tasks, onComplete, onDelete, loading, completed = false }: TaskListProps) => {
  if (loading) {
    return <LoadingText>Carregando...</LoadingText>;
  }

  if (tasks.length === 0) {
    return <EmptyText>Nenhuma tarefa encontrada</EmptyText>;
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'alta':
        return '#DC3545';
      case 'media':
        return '#FFC107';
      case 'baixa':
        return '#28A745';
      default:
        return '#6C757D';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return urgency;
    }
  };

  return (
    <TasksContainer>
      {tasks.map((task) => (
        <TaskCard key={task.id} completed={task.completed}>
          <TaskContent>
            <CompleteButton
              onClick={() => !completed && onComplete(task.id)}
              completed={task.completed}
              disabled={completed}
            >
              {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
            </CompleteButton>

            <TaskInfo>
              <TaskTitle completed={task.completed}>{task.title}</TaskTitle>

              <TaskMeta>
                <UrgencyBadge color={getUrgencyColor(task.urgency)}>
                  <AlertCircle size={14} />
                  {getUrgencyLabel(task.urgency)}
                </UrgencyBadge>

                {task.location && (
                  <LocationBadge>
                    <MapPin size={14} />
                    {task.location}
                  </LocationBadge>
                )}
              </TaskMeta>
            </TaskInfo>
          </TaskContent>

          <DeleteButton onClick={() => onDelete(task.id)}>
            <Trash2 size={18} />
          </DeleteButton>
        </TaskCard>
      ))}
    </TasksContainer>
  );
};

const TasksContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaskCard = styled.div<{ completed: boolean }>`
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  opacity: ${props => props.completed ? 0.7 : 1};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 4px 12px ${props => props.theme.colors.shadow};
    transform: translateY(-2px);
  }
`;

const TaskContent = styled.div`
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const CompleteButton = styled.button<{ completed: boolean }>`
  background: transparent;
  color: ${props => props.completed ? props.theme.colors.success : props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;

  &:hover:not(:disabled) {
    color: ${props => props.theme.colors.success};
    transform: scale(1.1);
  }

  &:disabled {
    cursor: default;
  }
`;

const TaskInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TaskTitle = styled.h4<{ completed: boolean }>`
  font-size: 16px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
  line-height: 1.4;
`;

const TaskMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const UrgencyBadge = styled.span<{ color: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: ${props => props.color}22;
  color: ${props => props.color};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid ${props => props.color};
`;

const LocationBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: ${props => props.theme.colors.info}22;
  color: ${props => props.theme.colors.info};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid ${props => props.theme.colors.info};
`;

const DeleteButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.danger};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.danger}22;
    transform: scale(1.1);
  }
`;

const LoadingText = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  padding: 32px;
  font-size: 15px;
`;

const EmptyText = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  padding: 32px;
  font-size: 15px;
`;

export default TaskList;
