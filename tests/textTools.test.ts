import assert from 'node:assert/strict';
import test from 'node:test';
import { emojiArt, repeatText, usernameIdeas } from '../src/tools/textTools';
import { presetCount, presetPacks } from '../src/content/presets';

test('repeater joins and clamps the count', () => {
  assert.equal(repeatText('hi', 3, 'space'), 'hi hi hi');
  assert.equal(repeatText('hi', 2, 'newline'), 'hi\nhi');
  assert.equal(repeatText('x', 9999, 'none').length, 500);
  assert.equal(repeatText('x', 0, 'none'), 'x');
});

test('emoji art draws 5x5 letters and skips unsupported characters', () => {
  const art = emojiArt('Hi', '💖', '  ');
  const blocks = art.split('\n\n');
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].split('\n').length, 5);
  assert.equal(blocks[0].split('\n')[2], '💖💖💖💖💖');
  assert.equal(emojiArt('é', '💖'), '');
});

test('username ideas keep plain handles valid', () => {
  const ideas = usernameIdeas('Zoë Smith!');
  assert.equal(ideas[0].plain, 'zoesmith');
  assert.ok(ideas.every((idea) => /^[a-z0-9._]+$/.test(idea.plain)));
  assert.deepEqual(usernameIdeas('!!!'), []);
});

test('presets: 7 packs, 3 free, over 100 items, no duplicates', () => {
  assert.equal(presetPacks.length, 7);
  assert.equal(presetPacks.filter((pack) => !pack.isPro).length, 3);
  assert.ok(presetCount >= 100);
  const all = presetPacks.flatMap((pack) => pack.items);
  assert.equal(new Set(all).size, all.length);
});
