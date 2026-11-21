export const colors = {
  ivory: '#F4F1EA',
  paper: '#FCFAF5',
  ink: '#1D1D1B',
  muted: '#6B675F',
  coral: '#E85D3F',
  coralDark: '#B43E28',
  line: '#D8D2C7',
  success: '#216B4B',
  white: '#FFFFFF',
} as const;

export const radii = { small: 10, medium: 18, large: 28, pill: 999 } as const;
export const spacing = (value: number) => value * 4;
