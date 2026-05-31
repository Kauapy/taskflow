/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Restringe a busca apenas aos testes em src/. Sem isso, o Vitest
    // varre worktrees do git (.claude/worktrees/) e roda testes duplicados.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
    env: {
      // Base do backend nos testes. Não há chamadas de rede reais (os testes
      // são de lógica pura e de componentes com fetch mockado/sem efeito).
      VITE_API_URL: 'http://localhost:4000',
    },
  },
});
