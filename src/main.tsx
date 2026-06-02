import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalStyles } from './styles/GlobalStyles';

/**
 * Filtra props customizadas (completed, checking, urgencyColor, variant,
 * overdue, etc.) para que NÃO sejam encaminhadas ao DOM — styled-components v6
 * encaminha tudo por padrão, gerando warnings do React. Para elementos HTML
 * nativos, só deixamos passar atributos válidos; para componentes, tudo passa.
 */
function shouldForwardProp(propName: string, target: unknown): boolean {
  if (typeof target === 'string') {
    return isPropValid(propName);
  }
  return true;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <ThemeProvider>
        <GlobalStyles />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </StyleSheetManager>
  </StrictMode>
);
