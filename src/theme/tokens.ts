// Lyfstyle Type Studio: warm paper, editorial ink and a restrained coral accent.
export const colors = {
  canvas: '#FAFAFA',
  surface: '#FFFFFF',
  ink: '#1B1916',
  muted: '#6B6359',
  tertiary: '#9C9388',
  accent: '#E5604A',
  accentDeep: '#C8472F',
  accentTint: '#FBE7E0',
  onAccent: '#FFFFFF',
  line: '#E6DFD3',
  lineSoft: '#EFEAE0',
  success: '#216B4B',
  white: '#FFFFFF',
} as const;

export const radii = { small: 10, medium: 16, large: 24, pill: 999 } as const;
export const spacing = (value: number) => value * 4;
