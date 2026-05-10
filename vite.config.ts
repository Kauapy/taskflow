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
      // Stubs para o cliente Supabase. createClient só valida que existem
      // strings; não há chamadas de rede nos testes (são mockadas/puras).
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
});
