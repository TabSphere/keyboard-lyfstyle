import assert from 'node:assert/strict';
import test from 'node:test';
import golden from '../shared/golden-tests.json';
import {
  applyDecoration,
  availableStyles,
  catalogue,
  compatibilityMessage,
  getStyle,
  transformText,
  unsupportedCharacters,
} from '../src/styleEngine';

test('catalogue has the agreed 12 free and 12 Pro styles', () => {
  const styled = catalogue.styles.filter((style) => style.id !== 'normal');
  assert.equal(styled.length, 24);
  assert.equal(styled.filter((style) => !style.isPro).length, 12);
  assert.equal(styled.filter((style) => style.isPro).length, 12);
  assert.equal(new Set(styled.map((style) => style.id)).size, 24);
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
  assert.equal(transformText('H̶', 'normal'), 'H̶');
  assert.equal(transformText('H', 'strike'), 'H̶');
  assert.equal(transformText('H', 'underline'), 'H̲');
});

test('style selection never falls back to a Pro style', () => {
  assert.equal(getStyle('does-not-exist').id, 'normal');
  assert.equal(availableStyles(false).length, 12);
  assert.equal(availableStyles(true).length, 24);
  assert.ok(availableStyles(false).every((style) => !style.isPro));
});

test('decorations are explicit composer operations', () => {
  assert.equal(applyDecoration('Lyfstyle', 'corner-frame'), '「 Lyfstyle 」');
  assert.equal(applyDecoration('Bio', 'fine-divider'), 'Bio\n──────────');
  assert.equal(applyDecoration('Plain', 'unknown'), 'Plain');
});

test('all mathematical styles produce supplementary code points without replacement characters', () => {
  for (const style of catalogue.styles.filter((item) => item.category === 'Classic' || item.category === 'Bold')) {
    const output = transformText('Az', style.id);
    assert.ok(!output.includes('�'), style.id);
  }
});

test('TypeScript matches every native golden fixture', () => {
  for (const fixture of golden.cases) {
    assert.equal(transformText(fixture.input, fixture.styleId), fixture.expected, fixture.styleId);
  }
});
