export const lightTheme = {
  name: 'light',
  colors: {
    primary: '#FF6B35',
    primaryDark: '#E55A2B',
    primaryLight: '#FF8C61',
    secondary: '#FFA07A',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceHover: '#F1F3F5',
    text: '#212529',
    textSecondary: '#6C757D',
    border: '#DEE2E6',
    success: '#28A745',
    warning: '#FFC107',
    danger: '#DC3545',
    info: '#17A2B8',
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowMedium: 'rgba(0, 0, 0, 0.15)',
    shadowLarge: 'rgba(0, 0, 0, 0.2)',
  },
};

export const darkTheme = {
  name: 'dark',
  colors: {
    primary: '#FF6B35',
    primaryDark: '#E55A2B',
    primaryLight: '#FF8C61',
    secondary: '#FFA07A',
    background: '#1A1A1A',
    surface: '#2D2D2D',
    surfaceHover: '#3A3A3A',
    text: '#F8F9FA',
    textSecondary: '#ADB5BD',
    border: '#495057',
    success: '#28A745',
    warning: '#FFC107',
    danger: '#DC3545',
    info: '#17A2B8',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowLarge: 'rgba(0, 0, 0, 0.5)',
  },
};

export type Theme = typeof lightTheme;
