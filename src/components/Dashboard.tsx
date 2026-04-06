import { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTasks } from '../hooks/useTasks';
import { useProgress } from '../hooks/useProgress';
import { LogOut, Sun, Moon, Search, Plus } from 'lucide-react';
import TaskList from './TaskList';
import AddTask from './AddTask';
import Missions from './Missions';

const Dashboard = () => {
  const { signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { tasks, loading: tasksLoading, addTask, completeTask, deleteTask } = useTasks();
  const { progress, loading: progressLoading } = useProgress();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const filteredActiveTasks = activeTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompletedTasks = completedTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTask = async (title: string, urgency: 'baixa' | 'media' | 'alta', location: string) => {
    await addTask(title, urgency, location);
    setShowAddTask(false);
  };

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Logo>
            <h1>Taskflow</h1>
          </Logo>

          <HeaderActions>
            <ThemeToggle onClick={toggleTheme}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </ThemeToggle>
            <LogoutButton onClick={signOut}>
              <LogOut size={20} />
            </LogoutButton>
          </HeaderActions>
        </HeaderContent>
      </Header>

      <Main>
        <Section>
          <SectionHeader>
            <h2>Missões</h2>
          </SectionHeader>
          <Missions progress={progress} loading={progressLoading} />
        </Section>

        <Section>
          <SectionHeader>
            <h2>Tarefas</h2>
            <AddButton onClick={() => setShowAddTask(true)}>
              <Plus size={20} />
              Nova Tarefa
            </AddButton>
          </SectionHeader>

          <SearchBar>
            <Search size={20} />
            <input
              type="text"
              placeholder="Pesquisar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>

          {showAddTask && (
            <AddTask
              onAdd={handleAddTask}
              onCancel={() => setShowAddTask(false)}
            />
          )}

          <TasksContainer>
            <TaskSection>
              <TaskSectionTitle>Ativas ({filteredActiveTasks.length})</TaskSectionTitle>
              <TaskList
                tasks={filteredActiveTasks}
                onComplete={completeTask}
                onDelete={deleteTask}
                loading={tasksLoading}
              />
            </TaskSection>

            <TaskSection>
              <TaskSectionTitle>Concluídas ({filteredCompletedTasks.length})</TaskSectionTitle>
              <TaskList
                tasks={filteredCompletedTasks}
                onComplete={completeTask}
                onDelete={deleteTask}
                loading={tasksLoading}
                completed
              />
            </TaskSection>
          </TasksContainer>
        </Section>
      </Main>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
`;

const Header = styled.header`
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  h1 {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.colors.secondary} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const ThemeToggle = styled.button`
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.primary};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 10px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    transform: scale(1.05);
  }
`;

const LogoutButton = styled.button`
  background: ${props => props.theme.colors.danger};
  color: white;
  border-radius: 10px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
    transform: scale(1.05);
  }
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const Section = styled.section`
  background: ${props => props.theme.colors.surface};
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px ${props => props.theme.colors.shadow};
  border: 1px solid ${props => props.theme.colors.border};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
`;

const AddButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary}66;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${props => props.theme.colors.background};
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid ${props => props.theme.colors.border};
  margin-bottom: 24px;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}33;
  }

  svg {
    color: ${props => props.theme.colors.textSecondary};
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    color: ${props => props.theme.colors.text};
    font-size: 15px;

    &::placeholder {
      color: ${props => props.theme.colors.textSecondary};
    }
  }
`;

const TasksContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TaskSection = styled.div``;

const TaskSectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 16px;
`;

export default Dashboard;
