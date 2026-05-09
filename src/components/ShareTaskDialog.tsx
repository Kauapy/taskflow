import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { X, Share2, AlertCircle, CheckCircle } from 'lucide-react';
import { Task } from '../lib/supabase';

interface ShareTaskDialogProps {
  task: Task | null;
  onShare: (taskId: string, email: string) => Promise<{ success: boolean; errorMessage?: string }>;
  onClose: () => void;
}

const ShareTaskDialog = ({ task, onShare, onClose }: ShareTaskDialogProps) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!task) return;
    setEmail('');
    setError('');
    setSuccess('');
    setSubmitting(false);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [task, onClose]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const result = await onShare(task.id, email);

    setSubmitting(false);
    if (result.success) {
      setSuccess('Convite enviado! O destinatário verá em "Compartilhadas comigo → Pendentes".');
      setEmail('');
    } else {
      setError(result.errorMessage ?? 'Não foi possível compartilhar.');
    }
  };

  return (
    <Backdrop
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
    >
      <Card onClick={e => e.stopPropagation()}>
        <Header>
          <h3 id="share-title">
            <Share2 size={18} aria-hidden="true" /> Compartilhar tarefa
          </h3>
          <CloseBtn onClick={onClose} aria-label="Fechar">
            <X size={20} aria-hidden="true" />
          </CloseBtn>
        </Header>

        <TaskInfo>{task.title}</TaskInfo>

        <Form onSubmit={handleSubmit}>
          <Label htmlFor="share-email">E-mail do destinatário</Label>
          <Input
            id="share-email"
            ref={inputRef}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="usuario@exemplo.com"
            required
            disabled={submitting}
          />

          {error && (
            <Message type="error">
              <AlertCircle size={14} aria-hidden="true" />
              {error}
            </Message>
          )}
          {success && (
            <Message type="success">
              <CheckCircle size={14} aria-hidden="true" />
              {success}
            </Message>
          )}

          <Hint>
            O destinatário precisa ter uma conta no Taskflow. O convite aparece como <em>Pendente</em> até ser aceito.
          </Hint>

          <Actions>
            <CancelBtn type="button" onClick={onClose} disabled={submitting}>
              Fechar
            </CancelBtn>
            <SubmitBtn type="submit" disabled={submitting || !email.trim()}>
              {submitting ? 'Enviando…' : 'Compartilhar'}
            </SubmitBtn>
          </Actions>
        </Form>
      </Card>
    </Backdrop>
  );
};

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const Card = styled.div`
  background: ${p => p.theme.colors.surface};
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 460px;
  box-shadow: 0 12px 40px ${p => p.theme.colors.shadowLarge};
  border: 1px solid ${p => p.theme.colors.border};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 700;
    color: ${p => p.theme.colors.text};
  }
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  color: ${p => p.theme.colors.textSecondary};
  &:hover { background: ${p => p.theme.colors.surfaceHover}; color: ${p => p.theme.colors.text}; }
`;

const TaskInfo = styled.div`
  background: ${p => p.theme.colors.background};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
  margin-bottom: 16px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
`;

const Input = styled.input`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1.5px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.background};
  color: ${p => p.theme.colors.text};
  font-size: 14px;
  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.primary};
    box-shadow: 0 0 0 3px ${p => p.theme.colors.primary}33;
  }
  &:disabled { opacity: 0.6; }
`;

const Message = styled.div<{ type: 'error' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: ${p => (p.type === 'error' ? p.theme.colors.danger : p.theme.colors.success)}18;
  color: ${p => (p.type === 'error' ? p.theme.colors.danger : p.theme.colors.success)};
  border: 1px solid ${p => (p.type === 'error' ? p.theme.colors.danger : p.theme.colors.success)}55;
`;

const Hint = styled.p`
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`;

const CancelBtn = styled.button`
  padding: 10px 16px;
  border-radius: 10px;
  background: transparent;
  color: ${p => p.theme.colors.text};
  border: 1.5px solid ${p => p.theme.colors.border};
  font-size: 14px;
  font-weight: 600;
  &:hover:not(:disabled) { background: ${p => p.theme.colors.surfaceHover}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SubmitBtn = styled.button`
  padding: 10px 16px;
  border-radius: 10px;
  background: ${p => p.theme.colors.primary};
  color: white;
  font-size: 14px;
  font-weight: 600;
  &:hover:not(:disabled) { background: ${p => p.theme.colors.primaryDark}; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default ShareTaskDialog;
