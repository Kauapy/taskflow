import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  CheckCircle2, AlertCircle, MapPin, Calendar, User, Eye, ArrowRight, Link2
} from 'lucide-react';
import { apiFetch, ApiError } from '../lib/api';
import { SharedTaskView } from '../lib/types';

interface Props {
  token: string;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; data: SharedTaskView };

const URGENCY = {
  alta:  { label: 'Alta',  color: '#EF4444' },
  media: { label: 'Média', color: '#F59E0B' },
  baixa: { label: 'Baixa', color: '#10B981' },
} as const;

const SharedTaskViewer = ({ token }: Props) => {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Rota pública — sem token de auth (auth: false).
        const { task } = await apiFetch<{ task: SharedTaskView }>(
          'GET',
          `/public/shared/${encodeURIComponent(token)}`,
          undefined,
          { auth: false }
        );
        if (cancelled) return;
        setState({ kind: 'ok', data: task });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({ kind: 'not_found' });
        } else {
          setState({ kind: 'error', message: err instanceof ApiError ? err.message : 'Erro ao carregar.' });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <Page>
      <Header>
        <Brand>
          <Link2 size={18} aria-hidden="true" />
          <span>Taskflow</span>
        </Brand>
        <SmallTag>Tarefa compartilhada</SmallTag>
      </Header>

      <Main>
        {state.kind === 'loading' && (
          <Card>
            <Loading>Carregando…</Loading>
          </Card>
        )}

        {state.kind === 'not_found' && (
          <Card>
            <ErrorTitle>
              <AlertCircle size={32} aria-hidden="true" />
              Link inválido ou expirado
            </ErrorTitle>
            <p>
              Este link não corresponde a uma tarefa ativa. Pode ter sido revogado pelo
              autor, ter expirado, ou conter um erro de digitação.
            </p>
            <PrimaryLink href="/">Voltar à página inicial</PrimaryLink>
          </Card>
        )}

        {state.kind === 'error' && (
          <Card>
            <ErrorTitle>
              <AlertCircle size={32} aria-hidden="true" />
              Erro ao carregar
            </ErrorTitle>
            <p>{state.message}</p>
            <PrimaryLink href="/">Voltar à página inicial</PrimaryLink>
          </Card>
        )}

        {state.kind === 'ok' && (
          <Card>
            <Sender>
              <User size={14} aria-hidden="true" />
              Compartilhado por <strong>{state.data.shared_by_email}</strong>
            </Sender>

            <TaskTitle completed={state.data.completed}>{state.data.title}</TaskTitle>

            <BadgeRow>
              <UrgencyBadge color={URGENCY[state.data.urgency].color}>
                <AlertCircle size={12} aria-hidden="true" />
                {URGENCY[state.data.urgency].label}
              </UrgencyBadge>

              {state.data.location && (
                <Badge>
                  <MapPin size={12} aria-hidden="true" />
                  {state.data.location}
                </Badge>
              )}

              {state.data.category && (
                <Badge>{state.data.category}</Badge>
              )}

              {state.data.completed && (
                <DoneBadge>
                  <CheckCircle2 size={12} aria-hidden="true" />
                  Concluída
                </DoneBadge>
              )}

              <ViewsBadge>
                <Eye size={12} aria-hidden="true" />
                {state.data.view_count} visualização{state.data.view_count === 1 ? '' : 'ões'}
              </ViewsBadge>
            </BadgeRow>

            {state.data.due_date && (
              <DetailRow>
                <DetailLabel>
                  <Calendar size={12} aria-hidden="true" /> Vence em
                </DetailLabel>
                <DetailValue>
                  {new Date(state.data.due_date).toLocaleString('pt-BR', {
                    dateStyle: 'short', timeStyle: 'short',
                  })}
                </DetailValue>
              </DetailRow>
            )}

            <DetailRow>
              <DetailLabel>Criada em</DetailLabel>
              <DetailValue>
                {new Date(state.data.created_at).toLocaleString('pt-BR', {
                  dateStyle: 'short', timeStyle: 'short',
                })}
              </DetailValue>
            </DetailRow>

            <Cta>
              <CtaText>
                Quer organizar suas tarefas com gamificação e análises?
              </CtaText>
              <PrimaryLink href="/">
                Criar minha conta no Taskflow <ArrowRight size={14} aria-hidden="true" />
              </PrimaryLink>
            </Cta>
          </Card>
        )}
      </Main>

      <Footer>Modo somente-leitura · sem login necessário</Footer>
    </Page>
  );
};

// ──────────────────────────────────────────────────────────── styled

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${p => p.theme.colors.background};
  color: ${p => p.theme.colors.text};
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.surface};
`;

const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: ${p => p.theme.colors.primary};
`;

const SmallTag = styled.span`
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 560px;
  background: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 4px 16px ${p => p.theme.colors.shadow};

  p { font-size: 14px; color: ${p => p.theme.colors.textSecondary}; line-height: 1.5; }
`;

const Loading = styled.div`
  text-align: center;
  padding: 32px;
  color: ${p => p.theme.colors.textSecondary};
`;

const ErrorTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: ${p => p.theme.colors.danger};
`;

const Sender = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${p => p.theme.colors.textSecondary};

  strong { color: ${p => p.theme.colors.text}; font-weight: 600; }
`;

const TaskTitle = styled.h1<{ completed: boolean }>`
  font-size: 26px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  text-decoration: ${p => (p.completed ? 'line-through' : 'none')};
  word-break: break-word;
  line-height: 1.3;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: ${p => p.theme.colors.background};
  color: ${p => p.theme.colors.textSecondary};
  border: 1px solid ${p => p.theme.colors.border};
`;

const UrgencyBadge = styled(Badge)<{ color: string }>`
  background: ${p => p.color}18;
  color: ${p => p.color};
  border-color: ${p => p.color}55;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const DoneBadge = styled(Badge)`
  background: ${p => p.theme.colors.success}18;
  color: ${p => p.theme.colors.success};
  border-color: ${p => p.theme.colors.success}55;
`;

const ViewsBadge = styled(Badge)`
  background: transparent;
`;

const DetailRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
`;

const DetailLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: ${p => p.theme.colors.textSecondary};
  min-width: 100px;
`;

const DetailValue = styled.span`
  color: ${p => p.theme.colors.text};
`;

const Cta = styled.div`
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid ${p => p.theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
`;

const CtaText = styled.p`
  font-size: 14px !important;
  color: ${p => p.theme.colors.text} !important;
  font-weight: 500;
`;

const PrimaryLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: ${p => p.theme.colors.primary};
  color: white;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.15s;
  &:hover { background: ${p => p.theme.colors.primaryDark}; transform: translateY(-1px); }
`;

const Footer = styled.footer`
  text-align: center;
  padding: 16px;
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};
  border-top: 1px solid ${p => p.theme.colors.border};
`;

export default SharedTaskViewer;
