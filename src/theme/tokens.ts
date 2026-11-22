// Lyfstyle "Pop Sugar": hot pink and sun yellow on a soft blush base.
// Bold where you act (inputs, primary buttons), soft where you browse (pastel cards).
export const colors = {
  canvas: '#FFF3F6', // blush page background
  surface: '#FFFFFF',
  ink: '#22172F', // plum ink: text, dark buttons
  muted: '#6E6380',
  tertiary: '#A498B3',
  brand: '#FF3D8B', // hot pink: icon, hero blocks, primary buttons
  brandDeep: '#D81E6C',
  onBrand: '#22172F', // text on hot-pink buttons (contrast 5:1)
  pink: '#22172F', // small "Copy" buttons use plum ink so they stand apart from the brand pink
  pinkSoft: '#FFE1EC',
  peachSoft: '#FFE6DA',
  sun: '#FFD84D', // Pro, highlights
  sunSoft: '#FFF1BF',
  lilac: '#FFC2DA', // light candy pink (kept name for older call sites)
  mint: '#A8E8CF',
  mintSoft: '#DDF6EC',
  line: '#EEDDE6',
  lineSoft: '#F6E9EF',
  success: '#1E8A5C',
  white: '#FFFFFF',
} as const;

// Pastel card colours, cycled through lists so the feed feels like a sticker sheet.
export const pastels = [colors.pinkSoft, colors.sunSoft, colors.mintSoft, colors.peachSoft] as const;

export const radii = { small: 12, medium: 18, large: 26, pill: 999 } as const;
export const spacing = (value: number) => value * 4;
