import { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';

interface AddTaskProps {
  onAdd: (title: string, urgency: 'baixa' | 'media' | 'alta', location: string, category: string, dueDate?: string, attachments?: string[]) => void;
  onCancel: () => void;
}

const AddTask = ({ onAdd, onCancel }: AddTaskProps) => {
  const [title, setTitle] = useState('');
  const [urgency, setUrgency] = useState<'baixa' | 'media' | 'alta'>('media');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string, date?: string }>({});

  const getLocalMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    let hasError = false;
    const newErrors: { title?: string, date?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'O título da tarefa não pode estar vazio.';
      hasError = true;
    }

    if (dueDate) {
      const selectedDate = new Date(dueDate);
      const limit = new Date();
      limit.setMinutes(limit.getMinutes() - 1); // 1 minuto de tolerância para preenchimento
      if (selectedDate < limit) {
        newErrors.date = 'A data de vencimento não pode estar no passado.';
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    onAdd(title, urgency, location, category, dueDate || undefined, attachments);
    setTitle('');
    setUrgency('media');
    setLocation('');
    setCategory('');
    setDueDate('');
    setAttachments([]);
  };

  return (
    <Container>
      <Header>
        <h3>Nova Tarefa</h3>
        <CloseButton onClick={onCancel}>
          <X size={20} />
        </CloseButton>
      </Header>

      <Form onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <Label>Título da tarefa</Label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Comprar mantimentos"
            autoFocus
          />
          {errors.title && <FieldError>{errors.title}</FieldError>}
        </FormGroup>

        <FormGroup>
          <Label>Urgência</Label>
          <UrgencyButtons>
            <UrgencyButton
              type="button"
              urgency="baixa"
              selected={urgency === 'baixa'}
              onClick={() => setUrgency('baixa')}
            >
              Baixa
            </UrgencyButton>
            <UrgencyButton
              type="button"
              urgency="media"
              selected={urgency === 'media'}
              onClick={() => setUrgency('media')}
            >
              Média
            </UrgencyButton>
            <UrgencyButton
              type="button"
              urgency="alta"
              selected={urgency === 'alta'}
              onClick={() => setUrgency('alta')}
            >
              Alta
            </UrgencyButton>
          </UrgencyButtons>
        </FormGroup>

        <FormGroup>
          <Label>Localização (opcional)</Label>
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Casa, Trabalho, Mercado"
          />
        </FormGroup>

        <FormGroup>
          <Label>Categoria (opcional)</Label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Nenhuma</option>
            <option value="Trabalho">Trabalho</option>
            <option value="Pessoal">Pessoal</option>
            <option value="Estudos">Estudos</option>
            <option value="Saúde">Saúde</option>
            <option value="Casa">Casa</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Outros">Outros</option>
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Data de vencimento (opcional)</Label>
          <Input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={getLocalMinDate()}
          />
          {errors.date && <FieldError>{errors.date}</FieldError>}
        </FormGroup>

        <FormGroup>
          <Label>Anexos (URLs, opcional)</Label>
          <Input
            type="text"
            placeholder="Cole uma URL e pressione Enter"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const url = (e.target as HTMLInputElement).value.trim();
                if (url) {
                  setAttachments(prev => [...prev, url]);
                  (e.target as HTMLInputElement).value = '';
                }
              }
            }}
          />
          {attachments.length > 0 && (
            <AttachmentsList>
              {attachments.map((url, index) => (
                <AttachmentItem key={index}>
                  {url}
                  <RemoveAttachment onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}>
                    <X size={14} />
                  </RemoveAttachment>
                </AttachmentItem>
              ))}
            </AttachmentsList>
          )}
        </FormGroup>

        <Actions>
          <CancelButton type="button" onClick={onCancel}>
            Cancelar
          </CancelButton>
          <SubmitButton type="submit" disabled={!title.trim()}>
            Adicionar
          </SubmitButton>
        </Actions>
      </Form>
    </Container>
  );
};

const FieldError = styled.span`
  color: ${props => props.theme.colors.error};
  font-size: 13px;
  font-weight: 500;
  margin-top: 4px;
`;

const Container = styled.div`
  background: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.primary};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px ${props => props.theme.colors.shadowMedium};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
`;

const CloseButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const Input = styled.input`
  padding: 12px 14px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 10px;
  background: ${props => props.theme.colors.surface};
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

  /* Melhorias para inputs de date/time nativos */
  color-scheme: dark; /* Força o popup do calendário a usar tema escuro (Chrome/Edge) */
  
  &::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.6;
    transition: 0.2s ease;
    /* Caso o color-scheme não funcione em navegadores antigos, inverte a cor do ícone: filter: invert(0.8); */
  }

  &::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
`;

const Select = styled.select`
  padding: 12px 14px;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 10px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 15px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}33;
  }
`;

const UrgencyButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
`;

const UrgencyButton = styled.button<{ urgency: string; selected: boolean }>`
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: 2px solid ${props => {
    switch (props.urgency) {
      case 'alta': return '#DC3545';
      case 'media': return '#FFC107';
      case 'baixa': return '#28A745';
      default: return props.theme.colors.border;
    }
  }};
  background: ${props => props.selected ? (() => {
    switch (props.urgency) {
      case 'alta': return '#DC3545';
      case 'media': return '#FFC107';
      case 'baixa': return '#28A745';
      default: return props.theme.colors.border;
    }
  })() : props.theme.colors.surface};
  color: ${props => props.selected ? 'white' : (() => {
    switch (props.urgency) {
      case 'alta': return '#DC3545';
      case 'media': return '#FFC107';
      case 'baixa': return '#28A745';
      default: return props.theme.colors.text;
    }
  })()};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${props => props.theme.colors.shadow};
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.surfaceHover};
  }
`;

const SubmitButton = styled.button`
  flex: 1;
  padding: 12px;
  background: ${props => props.theme.colors.primary};
  color: white;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.primary}66;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AttachmentsList = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme.colors.surface};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  color: ${props => props.theme.colors.textSecondary};
`;

const RemoveAttachment = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.error};
    color: white;
  }
`;

export default AddTask;
