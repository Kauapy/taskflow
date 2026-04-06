import { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircle, AlertCircle, Sun, Moon } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signIn, signUp } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error);
      } else {
        setSuccess('Conta criada! Fazendo login...');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError('Email ou senha incorretos');
      }
    }
  };

  return (
    <Container>
      <ThemeToggle onClick={toggleTheme}>
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </ThemeToggle>

      <LoginCard>
        <Logo>
          <CheckCircle size={48} />
          <h1>Taskflow</h1>
        </Logo>

        <Subtitle>
          Gerencie suas tarefas de forma inteligente e gamificada
        </Subtitle>

        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Message type="error">
              <AlertCircle size={16} />
              {error}
            </Message>
          )}

          {success && (
            <Message type="success">
              <CheckCircle size={16} />
              {success}
            </Message>
          )}

          <Button type="submit">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </Button>

          <ToggleText onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Já tem uma conta? Entre' : 'Não tem conta? Cadastre-se'}
          </ToggleText>
        </Form>
      </LoginCard>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, ${props => props.theme.colors.surface} 100%);
`;

const ThemeToggle = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.primary};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadow};

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: white;
    transform: scale(1.1) rotate(15deg);
  }
`;

const LoginCard = styled.div`
  background: ${props => props.theme.colors.surface};
  border-radius: 20px;
  padding: 48px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 8px 32px ${props => props.theme.colors.shadowMedium};
  border: 1px solid ${props => props.theme.colors.border};
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  svg {
    color: ${props => props.theme.colors.primary};
  }

  h1 {
    font-size: 32px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
  }
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 32px;
  font-size: 14px;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 14px 18px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-size: 15px;
  transition: all 0.2s ease;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}33;
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const Button = styled.button`
  padding: 14px 18px;
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
  margin-top: 8px;

  &:hover {
    background: ${props => props.theme.colors.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary}66;
  }

  &:active {
    transform: translateY(0);
  }
`;

const Message = styled.div<{ type: 'error' | 'success' }>`
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  background: ${props => props.type === 'error'
    ? props.theme.colors.danger + '22'
    : props.theme.colors.success + '22'};
  color: ${props => props.type === 'error'
    ? props.theme.colors.danger
    : props.theme.colors.success};
  border: 1px solid ${props => props.type === 'error'
    ? props.theme.colors.danger
    : props.theme.colors.success};
`;

const ToggleText = styled.button`
  background: none;
  color: ${props => props.theme.colors.primary};
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
`;

export default Login;
