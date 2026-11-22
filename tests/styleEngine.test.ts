import assert from 'node:assert/strict';
import test from 'node:test';
import golden from '../shared/golden-tests.json';
import {
  availableStyles,
  catalogue,
  compatibilityMessage,
  getStyle,
  keyboardStyles,
  themes,
  transformText,
  unsupportedCharacters,
} from '../src/styleEngine';

const styled = catalogue.styles.filter((style) => style.id !== 'normal');

test('catalogue has 112 styles; Script, Sans Bold and Sparkles are free', () => {
  assert.equal(styled.length, 112);
  assert.equal(new Set(styled.map((style) => style.id)).size, 112);
  assert.deepEqual(styled.filter((style) => !style.isPro).map((style) => style.id).sort(), ['frame-sparkles', 'sans-bold', 'script']);
});

test('only per-character styles reach the keyboards', () => {
  const keyboard = keyboardStyles();
  assert.equal(keyboard.length, 60);
  assert.ok(keyboard.every((style) => style.kind === 'alphabet' || style.kind === 'overlay'));
  assert.ok(styled.filter((style) => style.kind === 'composite').every((style) => !style.keyboard));
});

test('normal mode preserves every input exactly', () => {
  const input = 'Hello 𝓗 H̶ é q 123\n👨‍👩‍👧‍👦';
  assert.equal(transformText(input, 'normal'), input);
});

test('bold handles ASCII and preserves accents, emoji and line breaks', () => {
  assert.equal(transformText('Hello 123', 'bold'), '𝐇𝐞𝐥𝐥𝐨 𝟏𝟐𝟑');
  assert.equal(transformText('é 👨‍👩‍👧‍👦\n', 'bold'), 'é 👨‍👩‍👧‍👦\n');
});

test('unsupported characters pass through without silent substitution', () => {
  assert.equal(transformText('qé1', 'superscript'), 'qé¹');
  assert.deepEqual(unsupportedCharacters('qé1', 'superscript'), ['q', 'é']);
  assert.match(compatibilityMessage('qé1', 'superscript'), /2 characters kept normal: q, é/);
});

test('capital-only styles preserve lowercase instead of changing case', () => {
  assert.equal(transformText('Aa', 'squared'), '🄰a');
  assert.deepEqual(unsupportedCharacters('Aa', 'squared'), ['a']);
});

test('combining styles remain deterministic', () => {
  assert.equal(transformText('H', 'strike'), 'H̶');
  assert.equal(transformText('H', 'underline'), 'H̲');
  assert.equal(transformText('H', 'slash'), 'H̸');
});

test('new alphabets map both cases', () => {
  assert.equal(transformText('Ab', 'wizard'), 'ᗩᗷ');
  assert.equal(transformText('Hi', 'bubble-filled'), '🅗🅘');
});

test('emoji frames wrap the whole message and use their base font', () => {
  assert.equal(transformText('hi', 'frame-sparkles'), '✨ 𝓱𝓲 ✨');
  assert.equal(transformText('hi', 'frame-bow'), '🎀 hi 🎀');
  assert.equal(transformText('   ', 'frame-bow'), '   ', 'empty text gets no frame');
});

test('joiners go between letters only, not around spaces or emoji', () => {
  assert.equal(transformText('love you', 'between-hearts'), 'l♡o♡v♡e y♡o♡u');
  assert.equal(transformText('a😀b', 'between-stars'), 'a😀b');
});

test('kaomoji styles add a face after the text', () => {
  assert.equal(transformText('hello', 'kaomoji-bear'), 'hello ʕ•ᴥ•ʔ');
});

test('style selection never falls back to a Pro style', () => {
  assert.equal(getStyle('does-not-exist').id, 'normal');
  assert.equal(availableStyles(true).length, 112);
  assert.ok(availableStyles(false).every((style) => !style.isPro));
});

test('112 keyboard themes (88 picture), 3 free, all grouped', () => {
  assert.equal(themes.length, 112);
  assert.equal(themes.filter((item) => item.image).length, 88);
  assert.ok(themes.every((item) => item.group));
  assert.deepEqual(themes.filter((item) => !item.isPro).map((item) => item.id).sort(), ['blush', 'midnight', 'pop-pink']);
  assert.ok(themes.every((item) => /^#[0-9A-F]{6}$/i.test(item.background) && /^#[0-9A-F]{6}$/i.test(item.accent)));
});

test('no style produces replacement characters', () => {
  for (const style of styled) {
    assert.ok(!transformText('Az09', style.id).includes('�'), style.id);
  }
});

test('TypeScript matches every native golden fixture', () => {
  for (const fixture of golden.cases) {
    assert.equal(transformText(fixture.input, fixture.styleId), fixture.expected, fixture.styleId);
  }
});
