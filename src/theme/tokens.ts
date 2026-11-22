// Lyfstyle "Pop Sugar": Pop's confident violet and sun on Sugar's soft blush base.
// Bold where you act (inputs, primary buttons), soft where you browse (pastel cards).
export const colors = {
  canvas: '#FFF3F6', // blush page background
  surface: '#FFFFFF',
  ink: '#22172F', // plum ink: text and dark surfaces
  muted: '#6E6380',
  tertiary: '#A498B3',
  violet: '#6A3DF5', // brand + hero blocks
  violetDeep: '#5328D9',
  violetSoft: '#E9E1FF',
  pink: '#FF5FA2', // copy buttons, likes
  pinkSoft: '#FFE1EC',
  sun: '#FFD84D', // Pro, highlights
  sunSoft: '#FFF1BF',
  lilac: '#CDB9FF',
  mint: '#A8E8CF',
  mintSoft: '#DDF6EC',
  line: '#EEDDE6',
  lineSoft: '#F6E9EF',
  success: '#1E8A5C',
  white: '#FFFFFF',
} as const;

// Pastel card colours, cycled through lists so the feed feels like a sticker sheet.
export const pastels = [colors.violetSoft, colors.pinkSoft, colors.mintSoft, colors.sunSoft] as const;

export const radii = { small: 12, medium: 18, large: 26, pill: 999 } as const;
export const spacing = (value: number) => value * 4;
