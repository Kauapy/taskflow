import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../styles/theme';
import AddTask from './AddTask';

// Mock useAuth porque o AddTask precisa do user.id para o upload.
// Em testes não há sessão Supabase, então fornecemos um usuário fake.
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock o lib/storage para não tentar chamar Supabase Storage em testes
vi.mock('../lib/storage', () => ({
  uploadAttachment: vi.fn(async () => ({ data: null, error: 'mocked' })),
  deleteAttachment: vi.fn(async () => ({ error: null })),
  nameFromPublicUrl: (u: string) => u,
  pathFromPublicUrl: () => null,
}));

const wrap = (ui: React.ReactNode) =>
  render(<ThemeProvider theme={lightTheme}>{ui}</ThemeProvider>);

describe('<AddTask />', () => {
  it('desabilita o submit enquanto o título estiver vazio', () => {
    wrap(<AddTask onAdd={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
  });

  it('chama onAdd com os campos preenchidos quando válido', () => {
    const onAdd = vi.fn();
    wrap(<AddTask onAdd={onAdd} onCancel={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText(/Comprar mantimentos/i), {
      target: { value: 'Estudar para a prova' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Alta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledWith(
      'Estudar para a prova',
      'alta',
      '',
      '',
      undefined,
      []
    );
  });

  it('expõe um botão para selecionar arquivos como anexo', () => {
    wrap(<AddTask onAdd={() => {}} onCancel={() => {}} />);
    expect(
      screen.getByRole('button', { name: /Selecionar arquivos/i })
    ).toBeInTheDocument();
    // Dica menciona o limite de 10 MB
    expect(screen.getByText(/10 MB/i)).toBeInTheDocument();
  });

  it('chama onCancel ao clicar em Fechar (X)', () => {
    const onCancel = vi.fn();
    wrap(<AddTask onAdd={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /Fechar formul/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
