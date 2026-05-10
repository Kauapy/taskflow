import styled, { keyframes } from 'styled-components';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingScreen role="status" aria-live="polite">
        <Spinner aria-hidden="true" />
        <span>Carregando…</span>
      </LoadingScreen>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const LoadingScreen = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: ${p => p.theme.colors.background};
  color: ${p => p.theme.colors.textSecondary};
  font-size: 14px;
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid ${p => p.theme.colors.border};
  border-top-color: ${p => p.theme.colors.primary};
  animation: ${spin} 0.8s linear infinite;
`;

export default App;
