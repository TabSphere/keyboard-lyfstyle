import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FRAME_PRESETS,
  JOINER_PRESETS,
  keyboardPayload,
  letterChoices,
  newCustomStyle,
  resolveCustomStyle,
  sanitizeSpec,
} from '../src/customStyles';
import { getStyle, registerCustomStyles, transformText } from '../src/styleEngine';

test('a custom style uses its base alphabet', () => {
  const style = resolveCustomStyle({ ...newCustomStyle(1), base: 'sans-bold', name: 'Mine' });
  assert.equal(style.kind, 'alphabet');
  assert.equal(style.group, 'My styles');
  assert.equal(style.mapping.a, getStyle('sans-bold').mapping.a);
});

test('effects stack on the base letters, precomposed ones too', () => {
  const underlined = resolveCustomStyle({ ...newCustomStyle(2), base: 'bold', effect: 'underline' });
  assert.equal(underlined.mapping.a, `${getStyle('bold').mapping.a}̲`);
  const tilde = resolveCustomStyle({ ...newCustomStyle(3), base: 'normal', effect: 'tilde' });
  assert.equal(tilde.mapping.a.normalize('NFC'), 'ã');
});

test('hand-picked letters win over the base', () => {
  const style = resolveCustomStyle({ ...newCustomStyle(4), base: 'script', overrides: { a: 'α' } });
  assert.equal(style.mapping.a, 'α');
  assert.equal(style.mapping.b, getStyle('script').mapping.b);
});

test('frames and joiners work through transformText once registered', () => {
  const style = resolveCustomStyle({ ...newCustomStyle(5), base: 'normal', prefix: '✨ ', suffix: ' ✨', joiner: '.' });
  registerCustomStyles([style]);
  assert.equal(style.kind, 'composite');
  assert.equal(transformText('hi u', style.id), '✨ h.i u ✨');
  assert.equal(transformText('   ', style.id), '   ');
  registerCustomStyles([]);
  assert.equal(getStyle(style.id).id, 'normal');
});

test('the keyboards only get letters', () => {
  const style = resolveCustomStyle({ ...newCustomStyle(6), base: 'circled', prefix: '[', joiner: '-' });
  const [sent] = JSON.parse(keyboardPayload([style]));
  assert.deepEqual(Object.keys(sent).sort(), ['id', 'mapping', 'name']);
  assert.equal(sent.mapping.a, 'ⓐ');
});

test('stored specs are cleaned', () => {
  assert.equal(sanitizeSpec({ id: 'evil' }), null);
  assert.equal(sanitizeSpec(null), null);
  const spec = sanitizeSpec({ id: 'custom-9', name: 'x'.repeat(80), overrides: { a: 'αααααααα', '<': 'x', b: 7 } });
  assert.ok(spec);
  assert.equal(spec.name.length, 24);
  assert.deepEqual(spec.overrides, { a: 'αααααα' });
});

test('presets and letter choices come from the catalogue', () => {
  assert.ok(FRAME_PRESETS.length >= 10);
  assert.ok(JOINER_PRESETS.length >= 1);
  const choices = letterChoices('a');
  assert.equal(choices[0], 'a');
  assert.ok(choices.includes('𝓪'));
  assert.equal(new Set(choices).size, choices.length);
});
