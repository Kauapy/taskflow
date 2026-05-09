import 'styled-components';
import { Theme } from './styles/theme';

declare module 'styled-components' {
  // Augmentação do tipo padrão do styled-components com o shape do nosso Theme.
  // O empty-interface extends é o padrão recomendado pela própria lib.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}
