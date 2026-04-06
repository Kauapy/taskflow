import { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';

interface AddTaskProps {
  onAdd: (title: string, urgency: 'baixa' | 'media' | 'alta', location: string) => void;
  onCancel: () => void;
}

const AddTask = ({ onAdd, onCancel }: AddTaskProps) => {
  const [title, setTitle] = useState('');
  const [urgency, setUrgency] = useState<'baixa' | 'media' | 'alta'>('media');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd(title, urgency, location);
    setTitle('');
    setUrgency('media');
    setLocation('');
  };

  return (
    <Container>
      <Header>
        <h3>Nova Tarefa</h3>
        <CloseButton onClick={onCancel}>
          <X size={20} />
        </CloseButton>
      </Header>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Título da tarefa</Label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Comprar mantimentos"
            autoFocus
          />
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

export default AddTask;
