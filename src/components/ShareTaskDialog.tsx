import { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import {
  X, Share2, Mail, Link2, AlertCircle, CheckCircle, Copy, Eye, Trash2, Plus
} from 'lucide-react';
import { Task, TaskShareLink } from '../lib/types';

type Tab = 'email' | 'link';

interface ShareTaskDialogProps {
  task: Task | null;
  onShare: (taskId: string, email: string) => Promise<{ success: boolean; errorMessage?: string }>;
  onCreateLink: (
    taskId: string,
    expiresInDays?: number
  ) => Promise<{ success: boolean; link?: TaskShareLink; url?: string; errorMessage?: string }>;
  onListLinks: (taskId: string) => Promise<TaskShareLink[]>;
  onRevokeLink: (linkId: string) => Promise<{ success: boolean; errorMessage?: string }>;
  onClose: () => void;
}

const ShareTaskDialog = ({
  task, onShare, onCreateLink, onListLinks, onRevokeLink, onClose,
}: ShareTaskDialogProps) => {
  const [tab, setTab] = useState<Tab>('email');

  // Estado da aba E-mail
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Estado da aba Link
  const [links, setLinks] = useState<TaskShareLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number>(0); // 0 = sem expiração
  const [linkError, setLinkError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const refreshLinks = useCallback(async () => {
    if (!task) return;
    setLinksLoading(true);
    const list = await onListLinks(task.id);
    setLinks(list);
    setLinksLoading(false);
  }, [task, onListLinks]);

  // Reseta o formulário e carrega os links SÓ quando o dialog abre para uma
  // tarefa (o id muda). Depender de onClose/refreshLinks aqui faria o effect
  // re-rodar a cada render do pai (ex.: polling de 5s), resetando a aba
  // selecionada para 'email' — bug que impedia abrir a aba "Por link público".
  useEffect(() => {
    if (!task) return;
    setTab('email');
    setEmail(''); setEmailError(''); setEmailSuccess(''); setEmailSubmitting(false);
    setExpiresInDays(0); setLinkError(''); setGenerating(false); setCopiedToken(null);
    refreshLinks();
    emailInputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  // Listener de Escape em effect separado (pode re-rodar sem efeito colateral).
  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [task, onClose]);

  if (!task) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(''); setEmailSuccess(''); setEmailSubmitting(true);
    const result = await onShare(task.id, email);
    setEmailSubmitting(false);
    if (result.success) {
      setEmailSuccess('Convite enviado! O destinatário verá em "Compartilhadas → Pendentes".');
      setEmail('');
    } else {
      setEmailError(result.errorMessage ?? 'Não foi possível compartilhar.');
    }
  };

  const handleGenerate = async () => {
    setLinkError(''); setGenerating(true);
    const result = await onCreateLink(task.id, expiresInDays > 0 ? expiresInDays : undefined);
    setGenerating(false);
    if (!result.success) {
      setLinkError(result.errorMessage ?? 'Não foi possível gerar o link.');
      return;
    }
    await refreshLinks();
  };

  const handleCopy = async (token: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 1800);
    } catch {
      setLinkError('Não foi possível copiar. Selecione e copie manualmente.');
    }
  };

  const handleRevoke = async (linkId: string) => {
    const result = await onRevokeLink(linkId);
    if (!result.success) {
      setLinkError(result.errorMessage ?? 'Não foi possível revogar.');
      return;
    }
    await refreshLinks();
  };

  return (
    <Backdrop onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="share-title">
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

        <Tabs role="tablist">
          <TabBtn
            role="tab"
            aria-selected={tab === 'email'}
            active={tab === 'email'}
            onClick={() => setTab('email')}
          >
            <Mail size={14} aria-hidden="true" /> Por e-mail
          </TabBtn>
          <TabBtn
            role="tab"
            aria-selected={tab === 'link'}
            active={tab === 'link'}
            onClick={() => setTab('link')}
          >
            <Link2 size={14} aria-hidden="true" /> Por link público
          </TabBtn>
        </Tabs>

        {tab === 'email' ? (
          <Form onSubmit={handleEmailSubmit}>
            <Hint>
              O destinatário precisa ter conta no Taskflow. O convite aparece como
              <em> Pendente </em> até ser aceito.
            </Hint>

            <Label htmlFor="share-email">E-mail do destinatário</Label>
            <Input
              id="share-email"
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              required
              disabled={emailSubmitting}
            />

            {emailError && (
              <Message type="error"><AlertCircle size={14} aria-hidden="true" />{emailError}</Message>
            )}
            {emailSuccess && (
              <Message type="success"><CheckCircle size={14} aria-hidden="true" />{emailSuccess}</Message>
            )}

            <Actions>
              <CancelBtn type="button" onClick={onClose} disabled={emailSubmitting}>Fechar</CancelBtn>
              <SubmitBtn type="submit" disabled={emailSubmitting || !email.trim()}>
                {emailSubmitting ? 'Enviando…' : 'Compartilhar'}
              </SubmitBtn>
            </Actions>
          </Form>
        ) : (
          <LinkPanel>
            <Hint>
              Gere um link público que pode ser enviado para qualquer pessoa
              (WhatsApp, e-mail, SMS) — quem abrir verá a tarefa em modo somente
              leitura, sem precisar de conta. Você pode revogar a qualquer momento.
            </Hint>

            <Generator>
              <ExpiresField>
                <Label htmlFor="link-expires">Validade</Label>
                <Select
                  id="link-expires"
                  value={expiresInDays}
                  onChange={e => setExpiresInDays(Number(e.target.value))}
                  disabled={generating}
                >
                  <option value={0}>Sem expiração</option>
                  <option value={1}>1 dia</option>
                  <option value={7}>7 dias</option>
                  <option value={30}>30 dias</option>
                </Select>
              </ExpiresField>
              <GenerateBtn type="button" onClick={handleGenerate} disabled={generating}>
                <Plus size={14} aria-hidden="true" />
                {generating ? 'Gerando…' : 'Gerar link'}
              </GenerateBtn>
            </Generator>

            {linkError && (
              <Message type="error"><AlertCircle size={14} aria-hidden="true" />{linkError}</Message>
            )}

            <LinkList>
              {linksLoading
                ? <SmallHint>Carregando links…</SmallHint>
                : links.length === 0
                  ? <SmallHint>Nenhum link gerado ainda.</SmallHint>
                  : links.map(link => {
                      const url = `${window.location.origin}/shared/${link.token}`;
                      const expired = link.expires_at && new Date(link.expires_at) < new Date();
                      const inactive = link.revoked || expired;
                      const status = link.revoked ? 'Revogado' : expired ? 'Expirado' : 'Ativo';
                      return (
                        <LinkItem key={link.id} inactive={!!inactive}>
                          <LinkUrl title={url}>{url}</LinkUrl>
                          <LinkMeta>
                            <StatusBadge status={status}>{status}</StatusBadge>
                            <ViewBadge>
                              <Eye size={11} aria-hidden="true" />
                              {link.view_count}
                            </ViewBadge>
                            {link.expires_at && !link.revoked && (
                              <ViewBadge>
                                expira em {new Date(link.expires_at).toLocaleDateString('pt-BR')}
                              </ViewBadge>
                            )}
                          </LinkMeta>
                          <LinkActions>
                            <IconBtn
                              type="button"
                              onClick={() => handleCopy(link.token, url)}
                              disabled={!!inactive}
                              title="Copiar link"
                              aria-label={`Copiar link ${link.token}`}
                            >
                              <Copy size={14} aria-hidden="true" />
                              {copiedToken === link.token ? ' Copiado!' : ''}
                            </IconBtn>
                            {!link.revoked && (
                              <IconBtn
                                type="button"
                                onClick={() => handleRevoke(link.id)}
                                title="Revogar link"
                                aria-label={`Revogar link ${link.token}`}
                                destructive
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </IconBtn>
                            )}
                          </LinkActions>
                        </LinkItem>
                      );
                    })
              }
            </LinkList>

            <Actions>
              <CancelBtn type="button" onClick={onClose}>Fechar</CancelBtn>
            </Actions>
          </LinkPanel>
        )}
      </Card>
    </Backdrop>
  );
};

// ───────────────────────────────────────────────────────────── styled

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
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
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
  margin-bottom: 14px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  border-bottom: 1px solid ${p => p.theme.colors.border};
`;

const TabBtn = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  margin-bottom: -1px;
  border: 1px solid ${p => (p.active ? p.theme.colors.border : 'transparent')};
  border-bottom: 2px solid ${p => (p.active ? p.theme.colors.primary : 'transparent')};
  background: ${p => (p.active ? p.theme.colors.background : 'transparent')};
  color: ${p => (p.active ? p.theme.colors.text : p.theme.colors.textSecondary)};
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px 8px 0 0;
  &:hover { color: ${p => p.theme.colors.text}; }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LinkPanel = styled.div`
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

const Select = styled.select`
  padding: 8px 10px;
  border-radius: 8px;
  border: 1.5px solid ${p => p.theme.colors.border};
  background: ${p => p.theme.colors.background};
  color: ${p => p.theme.colors.text};
  font-size: 13px;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: ${p => p.theme.colors.primary};
  }
`;

const Generator = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
`;

const ExpiresField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const GenerateBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 8px;
  background: ${p => p.theme.colors.primary};
  color: white;
  font-size: 13px;
  font-weight: 700;
  &:hover:not(:disabled) { background: ${p => p.theme.colors.primaryDark}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
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

const SmallHint = styled.p`
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};
  font-style: italic;
  text-align: center;
  padding: 12px;
`;

const LinkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
`;

const LinkItem = styled.div<{ inactive: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: ${p => p.theme.colors.background};
  border: 1px solid ${p => p.theme.colors.border};
  opacity: ${p => (p.inactive ? 0.55 : 1)};
`;

const LinkUrl = styled.code`
  font-size: 11px;
  color: ${p => p.theme.colors.text};
  word-break: break-all;
  background: ${p => p.theme.colors.surface};
  padding: 4px 6px;
  border-radius: 4px;
`;

const LinkMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const StatusBadge = styled.span<{ status: string }>`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${p =>
    p.status === 'Ativo'
      ? p.theme.colors.success + '22'
      : p.status === 'Expirado'
        ? p.theme.colors.warning + '22'
        : p.theme.colors.danger + '22'};
  color: ${p =>
    p.status === 'Ativo'
      ? p.theme.colors.success
      : p.status === 'Expirado'
        ? p.theme.colors.warning
        : p.theme.colors.danger};
`;

const ViewBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: ${p => p.theme.colors.textSecondary};
`;

const LinkActions = styled.div`
  display: flex;
  gap: 4px;
  justify-content: flex-end;
`;

const IconBtn = styled.button<{ destructive?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: transparent;
  color: ${p => (p.destructive ? p.theme.colors.danger : p.theme.colors.text)};
  border: 1px solid ${p => (p.destructive ? p.theme.colors.danger + '55' : p.theme.colors.border)};
  &:hover:not(:disabled) {
    background: ${p =>
      p.destructive ? p.theme.colors.danger + '18' : p.theme.colors.surfaceHover};
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
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
