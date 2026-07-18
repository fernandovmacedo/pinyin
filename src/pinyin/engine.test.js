// Unit tests for the pure Pinyin logic in engine.js. Run with
// `npm run test:unit` (node:test, no browser or DOM stub required —
// that's the whole point of keeping this module free of DOM access).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../data/rules.json' with { type: 'json' };
import {
  createPinyinEngine,
  setTone,
  normalizePinyin,
  handleVCharacter,
} from './engine.js';

const engine = createPinyinEngine(manifest);

// A reference implementation of the official tone-placement rule ("mark a;
// else e; else o in ou; else the last vowel"), written independently of
// setTone's own algorithm, so these tests can catch a bug setTone shares
// with itself.
const TONED = {
  a: 'āáǎà',
  e: 'ēéěè',
  i: 'īíǐì',
  o: 'ōóǒò',
  u: 'ūúǔù',
  ü: 'ǖǘǚǜ',
};
function referenceSetTone(syllable, tone) {
  const vowels = [...syllable]
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => TONED[c]);
  if (vowels.length === 0) return syllable;
  const find = (ch) => vowels.find((v) => v.c === ch);
  const target =
    find('a') ||
    find('e') ||
    (syllable.includes('ou') && find('o')) ||
    vowels[vowels.length - 1];
  return (
    syllable.slice(0, target.i) +
    TONED[target.c][tone - 1] +
    syllable.slice(target.i + 1)
  );
}

test('setTone places the mark on the standard vowel for every syllable and tone', () => {
  for (const syl of manifest.syllables) {
    for (let tone = 1; tone <= 4; tone++) {
      const got = setTone(syl, tone);
      const want = referenceSetTone(syl, tone);
      assert.equal(got, want, `setTone(${syl}, ${tone})`);
      assert.equal(
        normalizePinyin(got),
        syl,
        `normalizePinyin(setTone(${syl}, ${tone}))`,
      );
      assert.equal(setTone(got, 5), syl, `setTone(${got}, 5)`);
    }
  }
});

test('setTone handles erhua spellings the same as their base syllable', () => {
  for (const syl of manifest.syllables) {
    if (syl === 'er') continue;
    const got = setTone(syl + 'r', 3);
    assert.equal(got, referenceSetTone(syl, 3) + 'r', `setTone(${syl}r, 3)`);
  }
});

test('every syllable in the manifest, and its erhua form, validates', () => {
  for (const syl of engine.syllables) {
    assert.deepEqual(engine.findInvalidOffsets(syl), [], syl);
    assert.deepEqual(
      engine.getInvalidPinyinRanges(syl),
      [],
      `${syl} spelling diagnostics`,
    );
  }
});

test('marks marginal syllables without treating them as invalid', () => {
  const text = 'Tēi kēi zhèi cēi diǎ liǎ ruá zhèir';
  assert.deepEqual(engine.getInvalidPinyinRanges(text), []);
  assert.deepEqual(
    engine.getRegionalSyllableHints(text).map((hint) => ({
      spelling: text.substring(hint.start, hint.end),
      rule: hint.diagnostic.rule.id,
    })),
    ['Tēi', 'kēi', 'zhèi', 'cēi', 'diǎ', 'liǎ', 'ruá', 'zhèir'].map(
      (spelling) => ({
        spelling,
        rule: 'regional-nonstandard-syllable',
      }),
    ),
  );
});

test('flags a tone mark placed on the wrong vowel and suggests the fix', () => {
  function wrongPlacements(syl, tone) {
    const right = referenceSetTone(syl, tone);
    const out = [];
    for (let i = 0; i < syl.length; i++) {
      if (!TONED[syl[i]]) continue;
      const candidate =
        syl.slice(0, i) + TONED[syl[i]][tone - 1] + syl.slice(i + 1);
      if (candidate !== right) out.push(candidate);
    }
    return out;
  }
  let tested = 0;
  for (const syl of manifest.syllables) {
    for (const bad of wrongPlacements(syl, 3)) {
      tested++;
      const hit = engine
        .getSpellingDiagnostics(bad)
        .find((d) => d.diagnostic.rule.id === 'tone-mark-placement');
      assert.ok(hit, `expected ${bad} (from ${syl}) to be flagged`);
      assert.equal(hit.diagnostic.suggestion, referenceSetTone(syl, 3), bad);
    }
  }
  assert.ok(tested > 100, 'sanity check: exercised a meaningful sample');
});

test('does not flag a correctly toned syllable', () => {
  for (const syl of manifest.syllables) {
    for (let tone = 1; tone <= 4; tone++) {
      const good = referenceSetTone(syl, tone);
      const hit = engine
        .getSpellingDiagnostics(good)
        .find((d) => d.diagnostic.rule.id === 'tone-mark-placement');
      assert.equal(hit, undefined, good);
    }
  }
});

test('flags multiple tone marks across the whole normalized syllable with no suggestion', () => {
  for (const spelling of ['hǎò', 'xǐǎo', 'Xīān']) {
    const invalid = engine.getInvalidPinyinRanges(spelling);
    assert.equal(invalid.length, 1, spelling);
    assert.deepEqual(
      {
        start: invalid[0].start,
        end: invalid[0].end,
        rule: invalid[0].diagnostic.rule.id,
        suggestion: invalid[0].diagnostic.suggestion,
      },
      {
        start: 0,
        end: spelling.length,
        rule: 'multiple-tone-marks',
        suggestion: '',
      },
    );
    assert.equal(
      engine.getMissingApostropheDiagnostics(spelling).length,
      1,
      `${spelling} keeps its independent two-syllable interpretation`,
    );
  }
});

test('suggests corrections for common misspellings', () => {
  assert.equal(engine.suggestNearestSyllable('qvn'), 'qun');
  const ie = engine
    .getSpellingDiagnostics('ie')
    .find((d) => d.diagnostic.rule.id === 'zero-onset-spelling');
  assert.equal(ie.diagnostic.suggestion, 'ye');
});

test('uses the longest yü misspelling, including Erhua, and preserves tone and case', () => {
  const diagnostics = engine.getSpellingDiagnostics('YǙANR');
  assert.equal(diagnostics.length, 1);
  assert.deepEqual(
    {
      start: diagnostics[0].start,
      end: diagnostics[0].end,
      rule: diagnostics[0].diagnostic.rule.id,
      suggestion: diagnostics[0].diagnostic.suggestion,
    },
    {
      start: 0,
      end: 'YǙANR'.length,
      rule: 'umlaut-spelling-after-y',
      suggestion: 'YUǍNR',
    },
  );

  const embedded = engine.getInvalidPinyinRanges('wǒyǚelái');
  assert.equal(embedded.length, 1);
  assert.equal(embedded[0].diagnostic.rule.id, 'umlaut-spelling-after-y');
  assert.equal(embedded[0].diagnostic.suggestion, 'yuě');
});

test('literal v after y stays on the generic invalid-spelling path', () => {
  const invalid = engine.getInvalidPinyinRanges('yv');
  assert.equal(invalid.length, 1);
  assert.notEqual(invalid[0].diagnostic.rule.id, 'umlaut-spelling-after-y');
});

test('missing-apostrophe hint fires only when the run is spoken as two syllables', () => {
  const haiou = engine.getMissingApostropheDiagnostics('haiou');
  assert.equal(haiou.length, 1);
  assert.equal(haiou[0].diagnostic.suggestion, "hai'ou");

  // "xian" alone is a single valid syllable; nothing to split.
  assert.deepEqual(engine.getMissingApostropheDiagnostics('xian'), []);

  // Typed as two separately-toned syllables (xi1 + an4), it must split.
  assert.equal(engine.getMissingApostropheDiagnostics('xīàn').length, 1);
});

test('unnecessary-apostrophe advice covers exactly two valid adjacent runs', () => {
  const text = "Nǐ zài Zhōng'guó hé Běi’jīng.";
  assert.deepEqual(
    engine.getUnnecessaryApostropheDiagnostics(text).map((range) => ({
      spelling: text.slice(range.start, range.end),
      rule: range.diagnostic.rule.id,
      suggestion: range.diagnostic.suggestion,
    })),
    [
      {
        spelling: "Zhōng'guó",
        rule: 'unnecessary-apostrophe',
        suggestion: 'Zhōngguó',
      },
      {
        spelling: 'Běi’jīng',
        rule: 'unnecessary-apostrophe',
        suggestion: 'Běijīng',
      },
    ],
  );
});

test('unnecessary-apostrophe advice keeps required apostrophes and rejects invalid neighbors', () => {
  for (const spelling of ["Xī'ān", "nǚ'ér", "qvn'guó", "zhōng'jng"]) {
    assert.deepEqual(
      engine.getUnnecessaryApostropheDiagnostics(spelling),
      [],
      spelling,
    );
  }
});

test('unnecessary-apostrophe advice ignores leading, trailing, repeated, and mixed separators', () => {
  for (const spelling of [
    "'Zhōng",
    "Zhōng'",
    "Zhōng''guó",
    "Zhōng’'guó",
    "Zhōng-'guó",
    "Zhōng 'guó",
  ]) {
    assert.deepEqual(
      engine.getUnnecessaryApostropheDiagnostics(spelling),
      [],
      spelling,
    );
  }
});

function sandhiSummary(text) {
  return engine
    .getToneSandhiHints(text)
    .map((h) => `${text.slice(h.start, h.end)}->${h.spokenTone}`);
}

test('third-tone sandhi resolves chains pairwise, right to left', () => {
  assert.deepEqual(sandhiSummary('nǐ hǎo'), ['nǐ->2']);
  assert.deepEqual(sandhiSummary('wǒ hěn hǎo'), ['wǒ->2', 'hěn->2']);
  assert.deepEqual(sandhiSummary('nǐhǎo'), ['nǐ->2'], 'no separator needed');
});

test('sandhi crosses every supported inter-run separator', () => {
  for (const separator of [' ', '\t', '-', "'", '’', '‘']) {
    assert.deepEqual(
      sandhiSummary(`nǐ${separator}hǎo`),
      ['nǐ->2'],
      JSON.stringify(separator),
    );
  }
});

test('bù (不) changes tone only before another fourth tone', () => {
  assert.deepEqual(sandhiSummary('bù shì'), ['bù->2']);
  assert.deepEqual(sandhiSummary('bù shuō'), []);
});

test('yī (一) changes tone before tones 1-4 except at a phrase break', () => {
  assert.deepEqual(sandhiSummary('yī gè'), ['yī->2']);
  assert.deepEqual(sandhiSummary('yī tiān'), ['yī->4']);
  assert.deepEqual(sandhiSummary('yī ge'), [], 'neutral tone: no hint');
});

test('sandhi does not reach across a phrase break', () => {
  assert.deepEqual(sandhiSummary('nǐ hǎo. wǒ'), ['nǐ->2']);
});

test('picks the diagnostic rule matching the attempted initial', () => {
  assert.equal(engine.getDiagnostic('jo').rule.id, 'palatal-final-mismatch');
  assert.equal(
    engine.getDiagnostic('zhie').rule.id,
    'retroflex-final-mismatch',
  );
  assert.equal(
    engine.getDiagnostic('ae').rule.id,
    'initial-final-table-mismatch',
  );
});

test('suggestNearestSyllable never suggests something that is not a real syllable', () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzü';
  let rng = 12345;
  const rand = (n) => {
    rng = (rng * 1103515245 + 12345) % 2 ** 31;
    return rng % n;
  };
  for (let i = 0; i < 2000; i++) {
    let s = '';
    const len = 1 + rand(6);
    for (let j = 0; j < len; j++) s += alphabet[rand(alphabet.length)];
    const suggestion = engine.suggestNearestSyllable(s);
    if (suggestion) {
      assert.ok(
        manifest.syllables.includes(normalizePinyin(suggestion)),
        `${s} -> ${suggestion}`,
      );
    }
  }
});

test('handleVCharacter: v types ü, doubled v types a literal v', () => {
  assert.equal(handleVCharacter(''), 'ü');
  assert.equal(handleVCharacter('n'), 'nü');
  assert.equal(handleVCharacter('nü'), 'nv', 'second v undoes the first');
  assert.equal(handleVCharacter('N', true), 'NÜ');
  assert.equal(handleVCharacter('NÜ', true), 'NV');
});
