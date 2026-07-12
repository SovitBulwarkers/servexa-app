// Design tokens — premium "Urban Company"-inspired palette:
// deep ink surfaces, a confident violet/coral accent, big bold type.
export const colors = {
  primary: '#2A1F5E',
  primaryDark: '#1A1240',
  primaryLight: '#EFEAFB',
  accent: '#FF5A5F',
  accentDark: '#E14448',
  accentLight: '#FFECEC',
  gradientStart: '#2A1F5E',
  gradientEnd: '#5B3FE0',

  background: '#F7F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EEFA',
  surfaceDark: '#15102E',

  textPrimary: '#120E28',
  textSecondary: '#615C78',
  textMuted: '#9A94B3',
  textOnPrimary: '#FFFFFF',

  border: '#EAE6F5',
  borderLight: '#F3F1FA',

  success: '#1FAE6E',
  successLight: '#E6F8EE',
  warning: '#E89A0A',
  warningLight: '#FEF4E3',
  danger: '#E5484D',
  dangerLight: '#FCEAEB',
  info: '#2A1F5E',

  star: '#FFB020',
  overlay: 'rgba(18, 14, 40, 0.55)',
  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  pill: 999,
};

export const fontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 21,
  xxl: 26,
  xxxl: 30,
  display: 36,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const shadow = {
  card: {
    shadowColor: '#120E28',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  raised: {
    shadowColor: '#120E28',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#120E28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
};

export const theme = { colors, spacing, radius, fontSize, fontWeight, shadow };
export default theme;
