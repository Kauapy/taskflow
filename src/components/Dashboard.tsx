import { useState, lazy, Suspense } from 'react';
import styled from 'styled-components';
import { Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useProgress } from '../hooks/useProgress';
import { Task } from '../lib/supabase';
import Sidebar, { ViewId } from './Sidebar';
import TopBar from './TopBar';
import OnboardingPanel from './OnboardingPanel';
import HomeView from './HomeView';
import TaskList from './TaskList';
import AddTask from './AddTask';
import Missions from './Missions';
import SharedTasks from './SharedTasks';
import ShareTaskDialog from './ShareTaskDialog';

// Lazy-load: o bundle do recharts (~370kB) só carrega quando o usuário abre a aba Análises.
const Analytics = lazy(() => import('./Analytics'));

const VIEW_META: Record<ViewId, { title: string; subtitle?: string }> = {
  home:      { title: 'Painel',          subtitle: 'Sua visão geral do dia' },
  tasks:     { title: 'Tarefas',         subtitle: 'Gerencie suas atividades' },
  missions:  { title: 'Missões',         subtitle: 'Desafios para subir de nível' },
  shared:    { title: 'Compartilhadas',  subtitle: 'Tarefas que outros enviaram a você' },
  analytics: { title: 'Análises',        subtitle: 'Estatísticas da sua produtividade' },
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const {
    tasks, loading: tasksLoading,
    addTask, completeTask, deleteTask, updateTask, shareTask,
    createShareLink, listShareLinks, revokeShareLink,
  } = useTasks();
  const { progress, loading: progressLoading } = useProgress();

  const [view, setView] = useState<ViewId>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);

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

  const handleAddTask = async (
    title: string,
    urgency: 'baixa' | 'media' | 'alta',
    location: string,
    category: string,
    dueDate?: string,
    attachments?: string[]
  ) => {
    setTaskError(null);
    const result = await addTask(title, urgency, location, category, dueDate, attachments);
    if (result?.success) {
      setShowAddTask(false);
    } else {
      setTaskError(result?.errorMessage ?? 'Erro desconhecido ao criar tarefa.');
    }
  };

  const handleEditTask = async (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'urgency' | 'location' | 'category' | 'due_date' | 'attachments'>>
  ) => {
    await updateTask(id, updates);
  };

  const handleQuickAdd = () => {
    setView('tasks');
    setShowAddTask(true);
  };

  const { title, subtitle } = VIEW_META[view];

  return (
    <Layout>
      <Sidebar
        active={view}
        onChange={setView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      <Main>
        <TopBar
          title={title}
          subtitle={subtitle}
          userEmail={user?.email ?? ''}
          onQuickAdd={handleQuickAdd}
          onSignOut={signOut}
        />

        <ContentGrid>
          <Center>
            {view === 'home' && (
              <HomeView
                userEmail={user?.email ?? ''}
                tasks={tasks}
                progress={progress}
                onCreateTask={handleQuickAdd}
                onViewTasks={() => setView('tasks')}
              />
            )}

            {view === 'tasks' && (
              <TasksWrap>
                <TasksHeader>
                  <SearchBar>
                    <Search size={16} aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Pesquisar tarefas…"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      aria-label="Pesquisar tarefas"
                    />
                  </SearchBar>
                </TasksHeader>

                {taskError && (
                  <ErrorBanner>
                    <strong>Erro ao criar tarefa:</strong> {taskError}
                  </ErrorBanner>
                )}

                {showAddTask && (
                  <AddTask
                    onAdd={handleAddTask}
                    onCancel={() => { setShowAddTask(false); setTaskError(null); }}
                  />
                )}

                <TasksGrid>
                  <TasksColumn>
                    <ColumnTitle>Ativas ({filteredActiveTasks.length})</ColumnTitle>
                    <TaskList
                      tasks={filteredActiveTasks}
                      onComplete={completeTask}
                      onDelete={deleteTask}
                      onEdit={handleEditTask}
                      onShare={setSharingTask}
                      loading={tasksLoading}
                    />
                  </TasksColumn>
                  <TasksColumn>
                    <ColumnTitle>Concluídas ({filteredCompletedTasks.length})</ColumnTitle>
                    <TaskList
                      tasks={filteredCompletedTasks}
                      onComplete={completeTask}
                      onDelete={deleteTask}
                      onEdit={handleEditTask}
                      onShare={setSharingTask}
                      loading={tasksLoading}
                      completed
                    />
                  </TasksColumn>
                </TasksGrid>
              </TasksWrap>
            )}

            {view === 'missions' && (
              <Missions progress={progress} loading={progressLoading} />
            )}

            {view === 'shared' && <SharedTasks />}

            {view === 'analytics' && (
              <Suspense fallback={<LoadingHint>Carregando análises…</LoadingHint>}>
                <Analytics />
              </Suspense>
            )}
          </Center>

          {/* Painel direito — visível em todas as views, exceto missões (onde já é o foco) */}
          {view !== 'missions' && (
            <RightCol>
              <OnboardingPanel
                progress={progress}
                tasks={tasks}
                onNavigate={setView}
              />
            </RightCol>
          )}
        </ContentGrid>
      </Main>

      <ShareTaskDialog
        task={sharingTask}
        onShare={shareTask}
        onCreateLink={createShareLink}
        onListLinks={listShareLinks}
        onRevokeLink={revokeShareLink}
        onClose={() => setSharingTask(null)}
      />
    </Layout>
  );
};

// ──────────────────────────────────────────────────────── styled

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${p => p.theme.colors.background};
`;

const Main = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 28px;
  padding: 28px;
  flex: 1;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 720px) {
    padding: 16px;
    gap: 16px;
  }
`;

const Center = styled.section`
  min-width: 0;
`;

const RightCol = styled.div`
  position: sticky;
  top: 28px;

  @media (max-width: 1100px) {
    position: static;
  }
`;

const TasksWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TasksHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 220px;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 10px;
  padding: 10px 14px;
  color: ${p => p.theme.colors.textSecondary};

  &:focus-within {
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px ${p => p.theme.colors.primary}22;
  }

  input {
    flex: 1;
    border: none;
    background: transparent;
    color: ${p => p.theme.colors.text};
    font-size: 14px;
    outline: none;

    &::placeholder { color: ${p => p.theme.colors.textSecondary}; }
  }
`;

const ErrorBanner = styled.div`
  background: ${p => p.theme.colors.danger}18;
  border: 1px solid ${p => p.theme.colors.danger}55;
  border-radius: 8px;
  color: ${p => p.theme.colors.danger};
  padding: 10px 14px;
  font-size: 13px;

  strong { display: block; margin-bottom: 2px; font-size: 13px; }
`;

const TasksGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const TasksColumn = styled.div``;

const ColumnTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: ${p => p.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 12px;
`;

const LoadingHint = styled.p`
  font-size: 14px;
  color: ${p => p.theme.colors.textSecondary};
  text-align: center;
  padding: 40px;
`;

export default Dashboard;
