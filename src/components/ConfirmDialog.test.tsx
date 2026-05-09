import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../styles/theme';
import ConfirmDialog from './ConfirmDialog';

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);

describe('<ConfirmDialog />', () => {
  it('não renderiza nada quando open=false', () => {
    wrap(
      <ConfirmDialog
        open={false}
        title="Excluir"
        message="Tem certeza?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renderiza título e mensagem quando open=true', () => {
    wrap(
      <ConfirmDialog
        open
        title="Excluir tarefa"
        message="Esta ação não pode ser desfeita."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Excluir tarefa')).toBeInTheDocument();
    expect(screen.getByText(/não pode ser desfeita/i)).toBeInTheDocument();
  });

  it('chama onConfirm ao clicar no botão de confirmação', () => {
    const onConfirm = vi.fn();
    wrap(
      <ConfirmDialog
        open
        title="t"
        message="m"
        confirmLabel="Excluir"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('chama onCancel ao clicar no botão de cancelar', () => {
    const onCancel = vi.fn();
    wrap(
      <ConfirmDialog
        open
        title="t"
        message="m"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('chama onCancel quando o usuário pressiona Esc', () => {
    const onCancel = vi.fn();
    wrap(
      <ConfirmDialog
        open
        title="t"
        message="m"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
