// Lyfstyle v2 palette: "Ink + Highlighter".
// The UI stays neutral; the highlighter is used for fills (selected states, primary
// actions, marker highlights), never as text on light backgrounds (contrast is too low).
export const colors = {
  canvas: '#F7F7F5', // page background; also light text on ink surfaces
  surface: '#FFFFFF', // cards and raised areas
  ink: '#111114', // primary text, dark surfaces
  muted: '#64646B', // secondary text
  accent: '#D9FF3F', // highlighter fill
  onAccent: '#111114', // text and icons drawn on the highlighter
  line: '#E2E2DE',
  success: '#216B4B',
  white: '#FFFFFF',
} as const;

export const radii = { small: 10, medium: 18, large: 28, pill: 999 } as const;
export const spacing = (value: number) => value * 4;
