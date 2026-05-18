import { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { CheckCircle, AlertCircle, Sun, Moon, CheckSquare } from 'lucide-react';

type Mode = 'login' | 'signup';

const Login = () => {
  const [mode, setMode] = useState<Mode>('login');

  // Estado independente para cada formulário, para preservar o que o usuário
  // digitou ao alternar entre os dois.
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail || !loginPassword) {
      setLoginError('Preencha todos os campos');
      return;
    }
    setSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setSubmitting(false);
    if (error) setLoginError('E-mail ou senha incorretos');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');
    if (!signupEmail || !signupPassword) {
      setSignupError('Preencha todos os campos');
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword);
    setSubmitting(false);
    if (error) setSignupError(error);
    else setSignupSuccess('Conta criada! Fazendo login…');
  };

  const isSignup = mode === 'signup';

  return (
    <Page>
      <ThemeBtn
        onClick={toggleTheme}
        aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        title="Alternar tema"
      >
        {isDark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
      </ThemeBtn>

      <Container active={isSignup}>
        {/* Formulário de Login */}
        <FormPanel side="left" active={!isSignup}>
          <Form onSubmit={handleLogin}>
            <Brand>
              <CheckSquare size={28} aria-hidden="true" />
              <BrandName>Taskflow</BrandName>
            </Brand>
            <FormTitle>Entrar</FormTitle>

            <Input
              type="email"
              placeholder="E-mail"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Senha"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              disabled={submitting}
              autoComplete="current-password"
            />

            {loginError && (
              <Message type="error">
                <AlertCircle size={14} aria-hidden="true" />
                {loginError}
              </Message>
            )}

            <PrimaryBtn type="submit" disabled={submitting}>
              {submitting ? 'Entrando…' : 'ENTRAR'}
            </PrimaryBtn>
          </Form>
        </FormPanel>

        {/* Formulário de Cadastro */}
        <FormPanel side="right" active={isSignup}>
          <Form onSubmit={handleSignup}>
            <Brand>
              <CheckSquare size={28} aria-hidden="true" />
              <BrandName>Taskflow</BrandName>
            </Brand>
            <FormTitle>Criar conta</FormTitle>

            <Input
              type="email"
              placeholder="E-mail"
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              disabled={submitting}
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Senha (mínimo 6 caracteres)"
              value={signupPassword}
              onChange={e => setSignupPassword(e.target.value)}
              disabled={submitting}
              autoComplete="new-password"
              minLength={6}
            />

            {signupError && (
              <Message type="error">
                <AlertCircle size={14} aria-hidden="true" />
                {signupError}
              </Message>
            )}
            {signupSuccess && (
              <Message type="success">
                <CheckCircle size={14} aria-hidden="true" />
                {signupSuccess}
              </Message>
            )}

            <PrimaryBtn type="submit" disabled={submitting}>
              {submitting ? 'Criando…' : 'CRIAR CONTA'}
            </PrimaryBtn>
          </Form>
        </FormPanel>

        {/* Painel laranja deslizante (overlay) */}
        <OverlayContainer active={isSignup}>
          <Overlay active={isSignup}>
            <OverlayPanel side="left">
              <OverlayTitle>Bem-vindo de volta!</OverlayTitle>
              <OverlayText>
                Já tem uma conta? Faça login e continue de onde parou — suas
                tarefas, missões e progresso te esperam.
              </OverlayText>
              <GhostBtn onClick={() => setMode('login')} type="button">
                ENTRAR
              </GhostBtn>
            </OverlayPanel>

            <OverlayPanel side="right">
              <OverlayTitle>Olá, novo amigo!</OverlayTitle>
              <OverlayText>
                Crie sua conta e descubra o Taskflow: tarefas com gamificação,
                missões, sequência de dias e análises da sua produtividade.
              </OverlayText>
              <GhostBtn onClick={() => setMode('signup')} type="button">
                CRIAR CONTA
              </GhostBtn>
            </OverlayPanel>
          </Overlay>
        </OverlayContainer>

        {/* Toggle em mobile (substitui o overlay deslizante em telas pequenas) */}
        <MobileToggle>
          {isSignup ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              setMode(isSignup ? 'login' : 'signup');
            }}
          >
            {isSignup ? 'Entrar' : 'Cadastre-se'}
          </a>
        </MobileToggle>
      </Container>
    </Page>
  );
};

// ─────────────────────────────────────────────────────── animations

const showSignup = keyframes`
  0%, 49.99% { opacity: 0; z-index: 1; }
  50%, 100%  { opacity: 1; z-index: 5; }
`;

// ───────────────────────────────────────────────────────── styled

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: linear-gradient(
    135deg,
    ${p => p.theme.colors.background} 0%,
    ${p => p.theme.colors.surface} 100%
  );
  position: relative;
`;

const ThemeBtn = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: ${p => p.theme.colors.surface};
  color: ${p => p.theme.colors.primary};
  border: 2px solid ${p => p.theme.colors.border};
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px ${p => p.theme.colors.shadow};
  z-index: 200;

  &:hover {
    background: ${p => p.theme.colors.primary};
    color: white;
    transform: scale(1.08) rotate(15deg);
  }
`;

const Container = styled.div<{ active: boolean }>`
  position: relative;
  width: 100%;
  max-width: 820px;
  min-height: 520px;
  background: ${p => p.theme.colors.surface};
  border-radius: 14px;
  box-shadow: 0 14px 36px ${p => p.theme.colors.shadowLarge};
  overflow: hidden;
  border: 1px solid ${p => p.theme.colors.border};

  @media (max-width: 720px) {
    min-height: 0;
    max-width: 440px;
  }
`;

const FormPanel = styled.div<{ side: 'left' | 'right'; active: boolean }>`
  position: absolute;
  top: 0;
  height: 100%;
  width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 36px;
  transition: all 0.6s ease-in-out;

  ${p =>
    p.side === 'left'
      ? css`
          left: 0;
          z-index: ${p.active ? 2 : 1};
          transform: translateX(${p.active ? '0' : '100%'});
          opacity: ${p.active ? 1 : 0};
        `
      : css`
          left: 0;
          opacity: ${p.active ? 1 : 0};
          z-index: ${p.active ? 5 : 1};
          transform: translateX(${p.active ? '100%' : '0'});
          ${p.active && css`animation: ${showSignup} 0.6s;`}
        `}

  @media (max-width: 720px) {
    position: relative;
    width: 100%;
    transform: none;
    padding: 32px 24px;
    display: ${p => (p.active ? 'flex' : 'none')};
    opacity: 1;
    animation: none;
  }
`;

const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: ${p => p.theme.colors.surface};
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${p => p.theme.colors.primary};
  margin-bottom: 4px;
`;

const BrandName = styled.span`
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(
    135deg,
    ${p => p.theme.colors.primary} 0%,
    ${p => p.theme.colors.secondary} 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const FormTitle = styled.h2`
  font-size: 26px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1.5px solid ${p => p.theme.colors.border};
  border-radius: 8px;
  background: ${p => p.theme.colors.background};
  color: ${p => p.theme.colors.text};
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px ${p => p.theme.colors.primary}33;
  }

  &::placeholder { color: ${p => p.theme.colors.textSecondary}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const PrimaryBtn = styled.button`
  padding: 12px 20px;
  background: ${p => p.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1.4px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    background: ${p => p.theme.colors.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 6px 14px ${p => p.theme.colors.primary}66;
  }

  &:active { transform: translateY(0); }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const Message = styled.div<{ type: 'error' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: ${p =>
    p.type === 'error' ? p.theme.colors.danger + '22' : p.theme.colors.success + '22'};
  color: ${p => (p.type === 'error' ? p.theme.colors.danger : p.theme.colors.success)};
  border: 1px solid
    ${p => (p.type === 'error' ? p.theme.colors.danger : p.theme.colors.success)};
`;

const OverlayContainer = styled.div<{ active: boolean }>`
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s ease-in-out;
  z-index: 100;
  transform: translateX(${p => (p.active ? '-100%' : '0')});

  @media (max-width: 720px) { display: none; }
`;

const Overlay = styled.div<{ active: boolean }>`
  position: relative;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(
    135deg,
    ${p => p.theme.colors.primary} 0%,
    ${p => p.theme.colors.primaryDark} 100%
  );
  color: white;
  transform: translateX(${p => (p.active ? '50%' : '0')});
  transition: transform 0.6s ease-in-out;
`;

const OverlayPanel = styled.div<{ side: 'left' | 'right' }>`
  position: absolute;
  top: 0;
  height: 100%;
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 36px;
  text-align: center;
  ${p => (p.side === 'left' ? 'left: 0;' : 'right: 0;')}
`;

const OverlayTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const OverlayText = styled.p`
  font-size: 14px;
  line-height: 1.55;
  margin-bottom: 24px;
  opacity: 0.95;
  max-width: 280px;
`;

const GhostBtn = styled.button`
  padding: 12px 36px;
  background: transparent;
  color: white;
  border: 1.5px solid white;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s ease;

  &:hover {
    background: white;
    color: ${p => p.theme.colors.primary};
    transform: translateY(-1px);
  }
`;

const MobileToggle = styled.p`
  display: none;
  text-align: center;
  padding: 8px 24px 24px;
  color: ${p => p.theme.colors.textSecondary};
  font-size: 14px;

  a {
    color: ${p => p.theme.colors.primary};
    font-weight: 700;
    text-decoration: none;
    margin-left: 4px;
    &:hover { text-decoration: underline; }
  }

  @media (max-width: 720px) {
    display: block;
  }
`;

export default Login;
