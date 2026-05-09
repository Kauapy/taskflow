import { useEffect, useRef } from 'react';
import styled from 'styled-components';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    cancelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <Backdrop
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-title"
      aria-describedby="cd-message"
    >
      <Card onClick={e => e.stopPropagation()}>
        <Title id="cd-title">{title}</Title>
        <Message id="cd-message">{message}</Message>
        <Actions>
          <CancelBtn ref={cancelRef} onClick={onCancel} type="button">
            {cancelLabel}
          </CancelBtn>
          <ConfirmBtn destructive={destructive} onClick={onConfirm} type="button">
            {confirmLabel}
          </ConfirmBtn>
        </Actions>
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
  max-width: 420px;
  box-shadow: 0 12px 40px ${p => p.theme.colors.shadowLarge};
  border: 1px solid ${p => p.theme.colors.border};
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${p => p.theme.colors.text};
  margin-bottom: 8px;
`;

const Message = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: ${p => p.theme.colors.textSecondary};
  margin-bottom: 20px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const CancelBtn = styled.button`
  padding: 10px 18px;
  border-radius: 10px;
  background: transparent;
  color: ${p => p.theme.colors.text};
  border: 1.5px solid ${p => p.theme.colors.border};
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s;
  &:hover {
    background: ${p => p.theme.colors.surfaceHover};
  }
`;

const ConfirmBtn = styled.button<{ destructive: boolean }>`
  padding: 10px 18px;
  border-radius: 10px;
  background: ${p => (p.destructive ? p.theme.colors.danger : p.theme.colors.primary)};
  color: white;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s;
  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }
`;

export default ConfirmDialog;
