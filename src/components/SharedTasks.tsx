import styled from 'styled-components';
import { Check, X, Inbox, Mail, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useShares } from '../hooks/useShares';
import { IncomingShare } from '../lib/types';

const URGENCY = {
  alta:  { label: 'Alta',  color: '#EF4444' },
  media: { label: 'Média', color: '#F59E0B' },
  baixa: { label: 'Baixa', color: '#10B981' },
} as const;

const SharedTasks = () => {
  const { incoming, loading, acceptShare, declineShare } = useShares();

  if (loading) {
    return <StatusText>Carregando compartilhamentos…</StatusText>;
  }

  const pending = incoming.filter(s => s.status === 'pending');
  const accepted = incoming.filter(s => s.status === 'accepted');

  if (incoming.length === 0) {
    return (
      <EmptyState>
        <Inbox size={48} aria-hidden="true" />
        <p>Ninguém compartilhou tarefas com você ainda.</p>
        <small>Quando alguém compartilhar, o convite aparece aqui.</small>
      </EmptyState>
    );
  }

  return (
    <Wrap>
      <Section>
        <SectionTitle>Pendentes ({pending.length})</SectionTitle>
        {pending.length === 0
          ? <Hint>Nenhum convite pendente.</Hint>
          : (
            <List>
              {pending.map(s => (
                <PendingCard
                  key={s.id}
                  share={s}
                  onAccept={() => acceptShare(s.id)}
                  onDecline={() => declineShare(s.id)}
                />
              ))}
            </List>
          )
        }
      </Section>

      <Section>
        <SectionTitle>Aceitas ({accepted.length})</SectionTitle>
        {accepted.length === 0
          ? <Hint>Nenhuma tarefa aceita ainda.</Hint>
          : (
            <List>
              {accepted.map(s => (
                <AcceptedCard
                  key={s.id}
                  share={s}
                  onRemove={() => declineShare(s.id)}
                />
              ))}
            </List>
          )
        }
      </Section>
    </Wrap>
  );
};

interface PendingCardProps {
  share: IncomingShare;
  onAccept: () => void;
  onDecline: () => void;
}

const PendingCard = ({ share, onAccept, onDecline }: PendingCardProps) => {
  const urgency = URGENCY[share.task_urgency] ?? URGENCY.media;
  return (
    <Card accent={urgency.color}>
      <CardTop>
        <TaskTitle>{share.task_title}</TaskTitle>
        <Badges>
          <UrgencyBadge color={urgency.color}>
            <AlertCircle size={11} aria-hidden="true" />
            {urgency.label}
          </UrgencyBadge>
          {share.task_location && (
            <LocationBadge>
              <MapPin size={11} aria-hidden="true" />
              {share.task_location}
            </LocationBadge>
          )}
          {share.task_completed && (
            <DoneBadge>
              <CheckCircle2 size={11} aria-hidden="true" />
              Concluída
            </DoneBadge>
          )}
        </Badges>
      </CardTop>
      <Sender>
        <Mail size={12} aria-hidden="true" />
        Compartilhado por <strong>{share.sharer_email}</strong>
      </Sender>
      <Actions>
        <DeclineBtn onClick={onDecline} aria-label={`Recusar convite de ${share.sharer_email}`}>
          <X size={14} aria-hidden="true" /> Recusar
        </DeclineBtn>
        <AcceptBtn onClick={onAccept} aria-label={`Aceitar convite de ${share.sharer_email}`}>
          <Check size={14} aria-hidden="true" /> Aceitar
        </AcceptBtn>
      </Actions>
    </Card>
  );
};

interface AcceptedCardProps {
  share: IncomingShare;
  onRemove: () => void;
}

const AcceptedCard = ({ share, onRemove }: AcceptedCardProps) => {
  const urgency = URGENCY[share.task_urgency] ?? URGENCY.media;
  return (
    <Card accent={urgency.color}>
      <CardTop>
        <TaskTitle>{share.task_title}</TaskTitle>
        <Badges>
          <UrgencyBadge color={urgency.color}>
            <AlertCircle size={11} aria-hidden="true" />
            {urgency.label}
          </UrgencyBadge>
          {share.task_location && (
            <LocationBadge>
              <MapPin size={11} aria-hidden="true" />
              {share.task_location}
            </LocationBadge>
          )}
          {share.task_completed && (
            <DoneBadge>
              <CheckCircle2 size={11} aria-hidden="true" />
              Concluída
            </DoneBadge>
          )}
        </Badges>
      </CardTop>
      <Sender>
        <Mail size={12} aria-hidden="true" />
        De <strong>{share.sharer_email}</strong>
      </Sender>
      <Actions>
        <DeclineBtn onClick={onRemove} aria-label={`Remover compartilhamento de ${share.sharer_email}`}>
          <X size={14} aria-hidden="true" /> Remover
        </DeclineBtn>
      </Actions>
    </Card>
  );
};

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Card = styled.div<{ accent: string }>`
  background: ${p => p.theme.colors.background};
  border: 1.5px solid ${p => p.accent}44;
  border-left: 4px solid ${p => p.accent};
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CardTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TaskTitle = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
  word-break: break-word;
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const UrgencyBadge = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  background: ${p => p.color}18;
  color: ${p => p.color};
  border: 1px solid ${p => p.color}55;
`;

const LocationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: ${p => p.theme.colors.info}18;
  color: ${p => p.theme.colors.info};
  border: 1px solid ${p => p.theme.colors.info}44;
`;

const DoneBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  background: ${p => p.theme.colors.success}18;
  color: ${p => p.theme.colors.success};
  border: 1px solid ${p => p.theme.colors.success}44;
`;

const Sender = styled.p`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};

  strong {
    color: ${p => p.theme.colors.text};
    font-weight: 600;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`;

const ActionBtnBase = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.15s;
`;

const AcceptBtn = styled(ActionBtnBase)`
  background: ${p => p.theme.colors.success};
  color: white;
  &:hover { opacity: 0.9; transform: translateY(-1px); }
`;

const DeclineBtn = styled(ActionBtnBase)`
  background: transparent;
  color: ${p => p.theme.colors.danger};
  border: 1px solid ${p => p.theme.colors.danger}55;
  &:hover { background: ${p => p.theme.colors.danger}18; }
`;

const StatusText = styled.p`
  text-align: center;
  color: ${p => p.theme.colors.textSecondary};
  padding: 32px;
  font-size: 15px;
`;

const Hint = styled.p`
  font-size: 13px;
  color: ${p => p.theme.colors.textSecondary};
  font-style: italic;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  color: ${p => p.theme.colors.textSecondary};
  text-align: center;

  p { font-size: 15px; }
  small { font-size: 13px; opacity: 0.8; }
  svg { color: ${p => p.theme.colors.textSecondary}; opacity: 0.5; margin-bottom: 4px; }
`;

export default SharedTasks;
