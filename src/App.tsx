import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? <Dashboard /> : <Login />;
}

export default App;
