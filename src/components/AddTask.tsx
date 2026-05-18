import { useRef, useState } from 'react';
import styled from 'styled-components';
import { X, Paperclip, Upload } from 'lucide-react';
import { uploadAttachment, deleteAttachment, pathFromPublicUrl } from '../lib/storage';
import { useAuth } from '../hooks/useAuth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface AttachedFile {
  url: string;
  name: string;
  size: number;
  uploading: boolean;
}

interface AddTaskProps {
  onAdd: (title: string, urgency: 'baixa' | 'media' | 'alta', location: string, category: string, dueDate?: string, attachments?: string[]) => void;
  onCancel: () => void;
}

const AddTask = ({ onAdd, onCancel }: AddTaskProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [urgency, setUrgency] = useState<'baixa' | 'media' | 'alta'>('media');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [attachmentError, setAttachmentError] = useState<string>('');
  const [errors, setErrors] = useState<{ title?: string; date?: string; location?: string }>({});

  const TITLE_MAX = 200;
  const LOCATION_MAX = 100;

  const getLocalMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleFiles = async (picked: FileList | null) => {
    if (!picked || !user) return;
    setAttachmentError('');

    for (const file of Array.from(picked)) {
      if (file.size > MAX_FILE_SIZE) {
        setAttachmentError(`"${file.name}" excede 10 MB.`);
        continue;
      }

      // Placeholder enquanto o upload acontece
      const placeholder: AttachedFile = {
        url: '', name: file.name, size: file.size, uploading: true,
      };
      setFiles(prev => [...prev, placeholder]);

      const { data, error } = await uploadAttachment(file, user.id);

      setFiles(prev => {
        const idx = prev.findIndex(
          f => f.uploading && f.name === file.name && f.size === file.size
        );
        if (idx === -1) return prev;
        const copy = [...prev];
        if (error || !data) {
          // remove o placeholder em caso de erro
          copy.splice(idx, 1);
        } else {
          copy[idx] = { url: data.url, name: data.name, size: data.size, uploading: false };
        }
        return copy;
      });

      if (error) {
        setAttachmentError(`Falha ao enviar "${file.name}": ${error}`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = async (idx: number) => {
    const target = files[idx];
    if (!target) return;
    setFiles(prev => prev.filter((_, i) => i !== idx));
    // Best-effort: apaga do Storage também
    if (target.url) {
      const path = pathFromPublicUrl(target.url);
      if (path) await deleteAttachment(path);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: { title?: string; date?: string; location?: string } = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = 'O título da tarefa não pode estar vazio.';
    } else if (trimmedTitle.length > TITLE_MAX) {
      newErrors.title = `O título excede ${TITLE_MAX} caracteres.`;
    }

    if (location.length > LOCATION_MAX) {
      newErrors.location = `A localização excede ${LOCATION_MAX} caracteres.`;
    }

    if (dueDate) {
      const selectedDate = new Date(dueDate);
      const limit = new Date();
      limit.setMinutes(limit.getMinutes() - 1); // 1 minuto de tolerância para preenchimento
      if (selectedDate < limit) {
        newErrors.date = 'A data de vencimento não pode estar no passado.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (files.some(f => f.uploading)) {
      setAttachmentError('Aguarde o upload terminar antes de salvar.');
      return;
    }

    const urls = files.filter(f => f.url).map(f => f.url);
    onAdd(trimmedTitle, urgency, location.trim(), category, dueDate || undefined, urls);
    setTitle('');
    setUrgency('media');
    setLocation('');
    setCategory('');
    setDueDate('');
    setFiles([]);
    setAttachmentError('');
  };

  return (
    <Container>
      <Header>
        <h3>Nova Tarefa</h3>
        <CloseButton onClick={onCancel} aria-label="Fechar formulário">
          <X size={20} aria-hidden="true" />
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
            maxLength={200}
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
            maxLength={100}
          />
          {errors.location && <FieldError>{errors.location}</FieldError>}
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
          <Label>Anexos (opcional)</Label>
          <FileButton
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Selecionar arquivos para anexar"
          >
            <Upload size={16} aria-hidden="true" />
            Selecionar arquivos
          </FileButton>
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            multiple
            onChange={e => handleFiles(e.target.files)}
            aria-label="Selecionar arquivos para anexar"
          />
          <FileHint>
            Qualquer tipo de arquivo, até 10 MB cada. Os arquivos ficam acessíveis
            por link público.
          </FileHint>
          {attachmentError && <FieldError>{attachmentError}</FieldError>}
          {files.length > 0 && (
            <AttachmentsList>
              {files.map((file, index) => (
                <AttachmentItem key={`${file.url || file.name}-${index}`}>
                  <FileMeta>
                    <Paperclip size={14} aria-hidden="true" />
                    <FileName title={file.name}>{file.name}</FileName>
                    <FileSize>{(file.size / 1024).toFixed(1)} KB</FileSize>
                    {file.uploading && <UploadingTag>enviando…</UploadingTag>}
                  </FileMeta>
                  <RemoveAttachment
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label={`Remover anexo ${file.name}`}
                    disabled={file.uploading}
                  >
                    <X size={14} aria-hidden="true" />
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
  color: ${props => props.theme.colors.danger};
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
  gap: 8px;
`;

const FileMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;

  svg { flex-shrink: 0; }
`;

const FileName = styled.span`
  font-size: 13px;
  color: ${p => p.theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const FileSize = styled.span`
  font-size: 11px;
  color: ${p => p.theme.colors.textSecondary};
  flex-shrink: 0;
`;

const UploadingTag = styled.span`
  font-size: 11px;
  color: ${p => p.theme.colors.primary};
  font-weight: 600;
  flex-shrink: 0;
`;

const RemoveAttachment = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.danger};
    color: white;
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const FileButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1.5px dashed ${p => p.theme.colors.border};
  border-radius: 10px;
  background: ${p => p.theme.colors.background};
  color: ${p => p.theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  width: fit-content;

  &:hover {
    color: ${p => p.theme.colors.primary};
    border-color: ${p => p.theme.colors.primary};
    background: ${p => p.theme.colors.surface};
  }

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary};
    outline-offset: 2px;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileHint = styled.p`
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};
  line-height: 1.4;
  margin-top: 2px;
`;

export default AddTask;
