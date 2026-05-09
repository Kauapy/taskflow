import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../styles/theme';
import AddTask from './AddTask';

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

  it('rejeita anexo quando a URL não é http(s)', () => {
    wrap(<AddTask onAdd={() => {}} onCancel={() => {}} />);
    const input = screen.getByPlaceholderText(/Cole uma URL/i);
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'javascript:alert(1)' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(
      screen.getByText(/Apenas URLs http:\/\/ ou https:\/\/ são aceitas/i)
    ).toBeInTheDocument();
  });

  it('chama onCancel ao clicar em Fechar (X)', () => {
    const onCancel = vi.fn();
    wrap(<AddTask onAdd={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /Fechar formul/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
