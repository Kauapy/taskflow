import { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Task } from '../lib/supabase';
import {
  CheckCircle2, Circle, Trash2, MapPin, AlertCircle,
  Pencil, Check, X, Clock, ChevronDown, ChevronUp, Flame
} from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, updates: Partial<Pick<Task, 'title' | 'urgency' | 'location' | 'category' | 'due_date' | 'attachments'>>) => void;
  loading: boolean;
  completed?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const URGENCY_CONFIG = {
  alta:  { label: 'Alta',  color: '#EF4444', bg: '#FEF2F2', icon: '🔥' },
  media: { label: 'Média', color: '#F59E0B', bg: '#FFFBEB', icon: '⚡' },
  baixa: { label: 'Baixa', color: '#10B981', bg: '#ECFDF5', icon: '🌿' },
} as const;

function useCountdown(dueDate?: string | null) {
  const [label, setLabel] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!dueDate) { setLabel(''); return; }
    const tick = () => {
      const diff = new Date(dueDate).getTime() - Date.now();
      if (diff <= 0) { setLabel('Vencida'); setIsOverdue(true); return; }
      setIsOverdue(false);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setLabel(`${d}d ${h}h`);
      else if (h > 0) setLabel(`${h}h ${m}m`);
      else setLabel(`${m}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [dueDate]);

  return { label, isOverdue };
}

// ── Sub-component: single task card ───────────────────────────────────────────

interface TaskCardItemProps {
  task: Task;
  completed: boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, updates: Partial<Pick<Task, 'title' | 'urgency' | 'location' | 'category' | 'due_date' | 'attachments'>>) => void;
}

const TaskCardItem = ({ task, completed, onComplete, onDelete, onEdit }: TaskCardItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editUrgency, setEditUrgency] = useState<'baixa' | 'media' | 'alta'>(task.urgency);
  const [editLocation, setEditLocation] = useState(task.location || '');
  const [editCategory, setEditCategory] = useState((task as any).category || '');
  const [editDueDate, setEditDueDate] = useState((task as any).due_date ? new Date((task as any).due_date).toISOString().slice(0, 16) : '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [checking, setChecking] = useState(false);
  const { label: countdown, isOverdue } = useCountdown((task as any).due_date);

  const urgency = URGENCY_CONFIG[task.urgency] ?? URGENCY_CONFIG.media;

  const handleCheck = () => {
    if (completed || checking) return;
    setChecking(true);
    setTimeout(() => onComplete(task.id), 400);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && onEdit) {
      onEdit(task.id, {
        title: editTitle.trim(),
        urgency: editUrgency,
        location: editLocation.trim(),
        category: editCategory,
        due_date: editDueDate || null,
      });
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditUrgency(task.urgency);
    setEditLocation(task.location || '');
    setEditCategory((task as any).category || '');
    setEditDueDate((task as any).due_date ? new Date((task as any).due_date).toISOString().slice(0, 16) : '');
    setEditing(false);
  };

  const handleDeleteClick = () => {
    if (confirmDelete) { onDelete(task.id); }
    else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <Card urgencyColor={urgency.color} completed={task.completed} checking={checking}>
      {/* ── Top row ─────────────────────────────────────── */}
      <TopRow>
        {/* Check button */}
        <CheckBtn onClick={handleCheck} completed={task.completed} checking={checking} disabled={completed}>
          {task.completed || checking
            ? <CheckCircle2 size={26} />
            : <Circle size={26} />}
        </CheckBtn>

        {/* Title / edit form */}
        <TitleArea>
          {editing ? (
            <EditForm>
              <EditInput
                autoFocus
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onFocus={e => e.target.select()}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                placeholder="Título da tarefa"
              />
              <EditGrid>
                <UrgencyPicker>
                  {(['baixa', 'media', 'alta'] as const).map(u => (
                    <UrgencyOption
                      key={u}
                      selected={editUrgency === u}
                      color={URGENCY_CONFIG[u].color}
                      onClick={() => setEditUrgency(u)}
                      type="button"
                    >
                      {URGENCY_CONFIG[u].icon} {URGENCY_CONFIG[u].label}
                    </UrgencyOption>
                  ))}
                </UrgencyPicker>
                <SecondaryInput
                  placeholder="Localização (opcional)"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <SecondarySelect
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                >
                  <option value="">Sem categoria</option>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Pessoal">Pessoal</option>
                  <option value="Estudos">Estudos</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Casa">Casa</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Outros">Outros</option>
                </SecondarySelect>
                <SecondaryInput
                  type="datetime-local"
                  value={editDueDate}
                  onChange={e => setEditDueDate(e.target.value)}
                  title="Data de vencimento"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
              </EditGrid>
            </EditForm>
          ) : (
            <>
              <TaskTitle completed={task.completed}>{task.title}</TaskTitle>
              <BadgeRow>
                <UrgencyBadge color={urgency.color}>
                  <AlertCircle size={12} />
                  {urgency.label}
                </UrgencyBadge>
                {task.location && (
                  <LocationBadge>
                    <MapPin size={12} />
                    {task.location}
                  </LocationBadge>
                )}
                {countdown && (
                  <CountdownBadge overdue={isOverdue}>
                    <Clock size={12} />
                    {countdown}
                  </CountdownBadge>
                )}
              </BadgeRow>
            </>
          )}
        </TitleArea>

        {/* Actions */}
        <Actions>
          {editing ? (
            <>
              <ActionBtn title="Salvar" variant="success" onClick={handleSaveEdit}>
                <Check size={16} />
              </ActionBtn>
              <ActionBtn title="Cancelar" variant="neutral" onClick={handleCancelEdit}>
                <X size={16} />
              </ActionBtn>
            </>
          ) : (
            <>
              {!completed && onEdit && (
                <ActionBtn title="Editar" variant="neutral" onClick={() => { setEditing(true); setExpanded(false); }}>
                  <Pencil size={15} />
                </ActionBtn>
              )}
              <DeleteBtn confirm={confirmDelete} onClick={handleDeleteClick} title={confirmDelete ? 'Clique para confirmar' : 'Apagar'}>
                {confirmDelete ? <><X size={14}/> Confirmar</> : <Trash2 size={15} />}
              </DeleteBtn>
              <ExpandBtn onClick={() => setExpanded(p => !p)} title="Detalhes">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </ExpandBtn>
            </>
          )}
        </Actions>
      </TopRow>

      {/* ── Expanded detail panel ────────────────────────── */}
      {expanded && !editing && (
        <DetailPanel>
          <DetailRow>
            <DetailLabel>Criada em</DetailLabel>
            <DetailValue>
              {new Date(task.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </DetailValue>
          </DetailRow>
          {(task as any).due_date && (
            <DetailRow>
              <DetailLabel>Vence em</DetailLabel>
              <DetailValue overdue={isOverdue}>
                {new Date((task as any).due_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                {isOverdue && <OverdueTag>Vencida!</OverdueTag>}
              </DetailValue>
            </DetailRow>
          )}
          {task.completed && task.completed_at && (
            <DetailRow>
              <DetailLabel>Concluída em</DetailLabel>
              <DetailValue>
                {new Date(task.completed_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              </DetailValue>
            </DetailRow>
          )}
          {(task as any).category && (
            <DetailRow>
              <DetailLabel>Categoria</DetailLabel>
              <DetailValue>{(task as any).category}</DetailValue>
            </DetailRow>
          )}
        </DetailPanel>
      )}

      {/* ── Urgency accent bar ───────────────────────────── */}
      <AccentBar color={urgency.color} />
    </Card>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const TaskList = ({ tasks, onComplete, onDelete, onEdit, loading, completed = false }: TaskListProps) => {
  if (loading) return <StatusText>Carregando tarefas...</StatusText>;
  if (tasks.length === 0) return (
    <EmptyState>
      <EmptyIcon>{completed ? '✅' : '📋'}</EmptyIcon>
      <p>{completed ? 'Nenhuma tarefa concluída ainda.' : 'Nenhuma tarefa ativa. Crie uma!'}</p>
    </EmptyState>
  );

  return (
    <List>
      {tasks.map(task => (
        <TaskCardItem
          key={task.id}
          task={task}
          completed={completed}
          onComplete={onComplete}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </List>
  );
};

// ── Animations ─────────────────────────────────────────────────────────────────

const popIn = keyframes`
  0%   { transform: scale(0.95); opacity: 0; }
  60%  { transform: scale(1.02); }
  100% { transform: scale(1);   opacity: 1; }
`;

const checkPulse = keyframes`
  0%   { transform: scale(1); }
  40%  { transform: scale(1.3); }
  100% { transform: scale(1); }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Styled components ──────────────────────────────────────────────────────────

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Card = styled.div<{ urgencyColor: string; completed: boolean; checking: boolean }>`
  position: relative;
  background: ${p => p.theme.colors.background};
  border: 1.5px solid ${p => p.completed ? p.theme.colors.border : p.urgencyColor}33;
  border-radius: 14px;
  padding: 14px 14px 14px 18px;
  overflow: hidden;
  animation: ${popIn} 0.25s ease;
  transition: box-shadow 0.2s, transform 0.2s, opacity 0.4s;
  opacity: ${p => p.completed ? 0.65 : 1};

  ${p => p.checking && css`
    opacity: 0.5;
    transform: scale(0.98);
  `}

  &:hover {
    box-shadow: 0 6px 20px ${p => p.urgencyColor}22;
    transform: translateY(-2px);
    border-color: ${p => p.urgencyColor}66;
  }
`;

const AccentBar = styled.div<{ color: string }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: ${p => p.color};
  border-radius: 14px 0 0 14px;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const CheckBtn = styled.button<{ completed: boolean; checking: boolean }>`
  flex-shrink: 0;
  background: transparent;
  color: ${p => p.completed || p.checking ? p.theme.colors.success : p.theme.colors.textSecondary};
  padding: 2px;
  transition: color 0.2s, transform 0.2s;

  ${p => (p.completed || p.checking) && css`
    animation: ${checkPulse} 0.4s ease;
  `}

  &:hover:not(:disabled) {
    color: ${p => p.theme.colors.success};
    transform: scale(1.15);
  }
  &:disabled { cursor: default; }
`;

const TitleArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const TaskTitle = styled.h4<{ completed: boolean }>`
  font-size: 15px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
  text-decoration: ${p => p.completed ? 'line-through' : 'none'};
  line-height: 1.4;
  word-break: break-word;
`;

const EditInput = styled.input`
  font-size: 15px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
  background: ${p => p.theme.colors.surface};
  border: 2px solid ${p => p.theme.colors.primary};
  border-radius: 8px;
  padding: 6px 10px;
  width: 100%;
  outline: none;
`;

const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const EditGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const SecondaryInput = styled.input`
  font-size: 13px;
  color: ${p => p.theme.colors.text};
  background: ${p => p.theme.colors.background};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 6px;
  padding: 6px 10px;
  outline: none;
  transition: border-color 0.15s;
  &:focus {
    border-color: ${p => p.theme.colors.primary}88;
  }
`;

const SecondarySelect = styled.select`
  font-size: 13px;
  color: ${p => p.theme.colors.text};
  background: ${p => p.theme.colors.background};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 6px;
  padding: 6px 10px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
  &:focus {
    border-color: ${p => p.theme.colors.primary}88;
  }
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

const UrgencyBadge = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  background: ${p => p.color}18;
  color: ${p => p.color};
  border: 1px solid ${p => p.color}55;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const LocationBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  background: ${p => p.theme.colors.info}18;
  color: ${p => p.theme.colors.info};
  border: 1px solid ${p => p.theme.colors.info}44;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
`;

const CountdownBadge = styled.span<{ overdue: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  background: ${p => p.overdue ? '#FEE2E2' : '#EFF6FF'};
  color: ${p => p.overdue ? '#DC2626' : '#3B82F6'};
  border: 1px solid ${p => p.overdue ? '#FCA5A5' : '#93C5FD'};
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
`;

const UrgencyPicker = styled.div`
  display: flex;
  gap: 6px;
`;

const UrgencyOption = styled.button<{ selected: boolean; color: string }>`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  border: 1.5px solid ${p => p.color};
  background: ${p => p.selected ? p.color : 'transparent'};
  color: ${p => p.selected ? '#fff' : p.color};
  cursor: pointer;
  transition: all 0.15s;
  &:hover { background: ${p => p.color}; color: #fff; }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const ActionBtn = styled.button<{ variant: 'success' | 'neutral' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${p => p.variant === 'success' ? p.theme.colors.success + '18' : p.theme.colors.surface};
  color: ${p => p.variant === 'success' ? p.theme.colors.success : p.theme.colors.textSecondary};
  transition: all 0.15s;
  &:hover {
    background: ${p => p.variant === 'success' ? p.theme.colors.success : p.theme.colors.border};
    color: ${p => p.variant === 'success' ? '#fff' : p.theme.colors.text};
  }
`;

const DeleteBtn = styled.button<{ confirm: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: ${p => p.confirm ? '4px 10px' : '0'};
  width: ${p => p.confirm ? 'auto' : '32px'};
  height: 32px;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: ${p => p.confirm ? '#DC2626' : 'transparent'};
  color: ${p => p.confirm ? '#fff' : '#EF4444'};
  border: ${p => p.confirm ? 'none' : '1.5px solid transparent'};
  transition: all 0.2s;
  &:hover {
    background: ${p => p.confirm ? '#B91C1C' : '#FEE2E2'};
    border-color: #FCA5A5;
  }
`;

const ExpandBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  color: ${p => p.theme.colors.textSecondary};
  transition: all 0.15s;
  &:hover { background: ${p => p.theme.colors.surface}; color: ${p => p.theme.colors.text}; }
`;

const DetailPanel = styled.div`
  margin-top: 12px;
  margin-left: 38px;
  border-top: 1px solid ${p => p.theme.colors.border};
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: ${slideDown} 0.2s ease;
`;

const DetailRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 13px;
`;

const DetailLabel = styled.span`
  color: ${p => p.theme.colors.textSecondary};
  font-weight: 600;
  min-width: 90px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.span<{ overdue?: boolean }>`
  color: ${p => p.overdue ? '#DC2626' : p.theme.colors.text};
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const OverdueTag = styled.span`
  background: #FEE2E2;
  color: #DC2626;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 10px;
  text-transform: uppercase;
`;

const StatusText = styled.p`
  text-align: center;
  color: ${p => p.theme.colors.textSecondary};
  padding: 32px;
  font-size: 15px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: ${p => p.theme.colors.textSecondary};
  font-size: 15px;
  text-align: center;
`;

const EmptyIcon = styled.span`
  font-size: 40px;
  line-height: 1;
`;

export default TaskList;
