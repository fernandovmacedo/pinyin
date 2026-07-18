// Unit tests for the share-link encoding logic. Run with
// `npm run test:unit`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toBase64Url,
  fromBase64Url,
  readSharedText,
  resolveInitialText,
  buildShareUrl,
} from './share-link.js';

test('toBase64Url / fromBase64Url round-trip arbitrary UTF-8 text', () => {
  const samples = [
    'nǐ hǎo',
    'Ǚǚ ü ê 中文 🙂 line\nbreak',
    "a'b-c_d",
    'padding-edge-cases-1',
    'padding-edge-cases-12',
    'padding-edge-cases-123',
  ];
  for (const text of samples) {
    assert.equal(fromBase64Url(toBase64Url(text)), text, text);
  }
});

test('toBase64Url output is URL-safe: no +, /, or = padding', () => {
  const encoded = toBase64Url('nǐ hǎo? wǒ 😀'.repeat(10));
  assert.doesNotMatch(encoded, /[+/=]/);
});

test('fromBase64Url throws on malformed input', () => {
  assert.throws(() => fromBase64Url('not-valid-base64!!!'));
});

test('readSharedText accepts a hash with or without a leading #', () => {
  const encoded = toBase64Url('nǐ hǎo');
  assert.equal(readSharedText(`#${encoded}`), 'nǐ hǎo');
  assert.equal(readSharedText(encoded), 'nǐ hǎo');
});

test('readSharedText returns null for empty or malformed input', () => {
  assert.equal(readSharedText(''), null);
  assert.equal(readSharedText('#'), null);
  assert.equal(readSharedText('#!!!not-base64!!!'), null);
});

test('resolveInitialText prefers a valid shared link over the saved draft', () => {
  const encoded = toBase64Url('shared text');
  assert.deepEqual(resolveInitialText(`#${encoded}`, 'draft text'), {
    text: 'shared text',
    fromShare: true,
  });
});

test('resolveInitialText falls back to the draft when the hash is empty or malformed', () => {
  assert.deepEqual(resolveInitialText('', 'draft text'), {
    text: 'draft text',
    fromShare: false,
  });
  assert.deepEqual(resolveInitialText('#!!!', 'draft text'), {
    text: 'draft text',
    fromShare: false,
  });
  assert.deepEqual(resolveInitialText('', ''), { text: '', fromShare: false });
});

test('buildShareUrl encodes the text into the hash and drops any existing search/hash', () => {
  const url = buildShareUrl('nǐ hǎo', 'https://example.com/pinyin/?old=1#old');
  const parsed = new URL(url);
  assert.equal(parsed.search, '');
  assert.equal(readSharedText(parsed.hash), 'nǐ hǎo');
});

test('buildShareUrl clears the hash entirely for empty text', () => {
  const url = buildShareUrl('', 'https://example.com/pinyin/#stale');
  assert.equal(new URL(url).hash, '');
});
