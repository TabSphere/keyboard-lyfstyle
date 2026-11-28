import { useMemo } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme/tokens';

export type Hsv = { h: number; s: number; v: number };

const HUES = 36;
const RINGS = 5;

export function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return `#${[f(5), f(3), f(1)].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export function hexToHsv(hex: string): Hsv {
  const value = parseInt(hex.slice(1), 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: (h + 360) % 360, s: max ? d / max : 0, v: max };
}

function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) => `${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  return `M${p(r0, a0)} L${p(r1, a0)} A${r1} ${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} ${r0 > 0 ? `A${r0} ${r0} 0 0 0 ${p(r0, a0)}` : ''} Z`;
}

/**
 * Tap or drag on the wheel to pick hue (around) and strength (outwards).
 * The row underneath sets brightness.
 */
export function ColourWheel({ value, onChange, size = 260 }: { value: Hsv; onChange: (next: Hsv) => void; size?: number }) {
  const radius = size / 2 - 4;
  const centre = size / 2;
  const wedges = useMemo(() => {
    const items: { d: string; fill: string }[] = [];
    for (let ring = 0; ring < RINGS; ring += 1) {
      for (let hue = 0; hue < HUES; hue += 1) {
        const a0 = ((hue - 0.5) / HUES) * Math.PI * 2;
        const a1 = ((hue + 0.5) / HUES) * Math.PI * 2;
        items.push({
          d: sector(centre, centre, (ring / RINGS) * radius, ((ring + 1) / RINGS) * radius, a0, a1 + 0.004),
          fill: hsvToHex({ h: (hue / HUES) * 360, s: (ring + 0.5) / RINGS, v: value.v }),
        });
      }
    }
    return items;
  }, [centre, radius, value.v]);

  const pick = (event: GestureResponderEvent) => {
    const dx = event.nativeEvent.locationX - centre;
    const dy = event.nativeEvent.locationY - centre;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const strength = Math.min(1, Math.hypot(dx, dy) / radius);
    onChange({ h: (angle + 360) % 360, s: strength, v: value.v });
  };

  const markerAngle = (value.h * Math.PI) / 180;
  const markerX = centre + Math.cos(markerAngle) * value.s * radius;
  const markerY = centre + Math.sin(markerAngle) * value.s * radius;
  const brightness = [1, 0.88, 0.74, 0.6, 0.45, 0.3, 0.15];

  return (
    <View style={styles.wrap}>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Colour wheel. Drag to choose a colour."
        style={{ width: size, height: size }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={pick}
        onResponderMove={pick}
      >
        <Svg width={size} height={size} pointerEvents="none">
          {wedges.map((item, index) => <Path key={index} d={item.d} fill={item.fill} />)}
          <Circle cx={markerX} cy={markerY} r={13} fill={hsvToHex(value)} stroke="#FFFFFF" strokeWidth={4} />
          <Circle cx={markerX} cy={markerY} r={15} fill="none" stroke={colors.ink} strokeWidth={1.5} />
        </Svg>
      </View>
      <View style={styles.brightness}>
        {brightness.map((v) => {
          const active = Math.abs(value.v - v) < 0.06;
          return (
            <Pressable
              key={v}
              accessibilityRole="button"
              accessibilityLabel={`Brightness ${Math.round(v * 100)}%`}
              accessibilityState={{ selected: active }}
              onPress={() => onChange({ ...value, v })}
              style={[styles.swatch, { backgroundColor: hsvToHex({ ...value, v }) }, active && styles.swatchActive]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14 },
  brightness: { flexDirection: 'row', gap: 8 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'rgba(34,23,47,0.12)' },
  swatchActive: { borderColor: colors.ink, borderWidth: 3 },
});
