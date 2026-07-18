// Hand-marked fixtures: realistic multi-syllable sentences with expected
// diagnostics authored by hand from Pinyin orthography rules, independent
// of the engine's own output. engine.test.js already exercises each rule
// exhaustively at the single-syllable level (every manifest syllable,
// every tone); what that coverage cannot see is what happens when
// syllables compose — segmentation choices, run boundaries at punctuation
// and CJK text, sandhi chains, and cases where two independent checks
// legitimately disagree about the same misspelling. That is what these
// fixtures pin down.
//
// Expected ranges are written as `{ match: 'substring' }` rather than
// hand-counted offsets, resolved against the fixture's own text via
// indexOf. This sidesteps miscounting multi-byte tone-mark positions and
// keeps the mark visibly tied to what it is marking.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../data/rules.json' with { type: 'json' };
import { createPinyinEngine } from './engine.js';

const engine = createPinyinEngine(manifest);

function findRange(text, needle, occurrence = 0) {
  let index = -1;
  for (let i = 0; i <= occurrence; i++) {
    index = text.indexOf(needle, index + 1);
    if (index === -1) {
      throw new Error(
        `fixture error: "${needle}" (occurrence ${occurrence}) not found in ${JSON.stringify(text)}`,
      );
    }
  }
  return { start: index, end: index + needle.length };
}

const fixtures = [
  {
    name: 'fully valid sentence produces no diagnostics of any kind',
    text: 'Tā zài xuéxiào xuéxí Hànyǔ.',
    invalid: [],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'punctuation, a newline, and CJK text do not leak across run boundaries',
    text: 'Wǒ ài Zhōngguó!\n我爱中国。 Nǐ ne?',
    invalid: [],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'a wrong tone-mark vowel is still flagged mid-sentence, with the fix suggested',
    text: "Zhège xǐao māo tǐng kě'ài.",
    invalid: [
      { match: 'xǐao', rule: 'tone-mark-placement', suggestion: 'xiǎo' },
    ],
    apostrophes: [],
    // Incidental but correctly-derived: tǐng and kě are both written third
    // tone and adjacent, so third-tone sandhi fires independently of the
    // tone-mark bug above.
    sandhi: [{ match: 'tǐng', spokenTone: 2, rule: 'third-tone-sandhi' }],
  },
  {
    name: 'a stray initial followed by a vowel-only syllable stays grouped as one diagnostic',
    text: 'Zhège jo hěn qíguài.',
    // suggestNearestSyllable('jo') is genuinely ambiguous (bo/mo/po/wo/yo/ju
    // are all one edit away), so the engine withholds a suggestion rather
    // than guess.
    invalid: [{ match: 'jo', rule: 'palatal-final-mismatch', suggestion: '' }],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'a confident nearest-syllable suggestion for a common typo',
    text: 'Zhè shì tāmen de qvn.',
    invalid: [
      { match: 'qvn', rule: 'palatal-final-mismatch', suggestion: 'qun' },
    ],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'zero-onset spelling carries the run tone into its suggestion',
    text: 'Xiànzài iǒu hěn duō rén.',
    invalid: [{ match: 'iǒu', rule: 'zero-onset-spelling', suggestion: 'yǒu' }],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'an unabbreviated final is ambiguous with a missing apostrophe, and both checks fire independently',
    // "niou" parses two ways: the single syllable niu spelled long (fix:
    // abbreviate to niu), or the two syllables ni + ou run together (fix:
    // insert an apostrophe). getInvalidPinyinRanges and
    // getMissingApostropheDiagnostics each answer their own question
    // without knowing about the other's answer.
    text: 'Nàbiān yǒu tóu niou.',
    invalid: [
      { match: 'niou', rule: 'abbreviated-final-spelling', suggestion: 'niu' },
    ],
    apostrophes: [{ match: 'niou', suggestion: "ni'ou" }],
    sandhi: [],
  },
  {
    name: 'ü written out after a palatal initial, with its tone mark carried over',
    text: 'Zhè shì qǘn.',
    invalid: [
      {
        match: 'qǘn',
        rule: 'umlaut-spelling-after-palatal',
        suggestion: 'qún',
      },
    ],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: "missing syllable-boundary apostrophes (Xi'an, nü'er) in running text",
    text: 'Wǒ qùguò Xīān. Tā yǒu yí gè nǚér.',
    invalid: [],
    apostrophes: [
      { match: 'Xīān', suggestion: "Xī'ān" },
      { match: 'nǚér', suggestion: "nǚ'ér" },
    ],
    sandhi: [],
  },
  {
    name: 'a sandhi paragraph: third-tone chain, bù, yī, and phrase breaks that block it',
    // Bù shuō and the first Yī ge deliberately do NOT change (bù only
    // shifts before another 4th tone; yī does not shift before a neutral
    // tone), and the sentence-ending periods stop sandhi from reaching
    // into the next clause (hǎo does not pair with Bù, shuō does not pair
    // with Yī).
    text: 'Wǒ hěn hǎo. Bù shì, bù shuō. Yī ge rén, yī tiān.',
    invalid: [],
    apostrophes: [],
    sandhi: [
      { match: 'Wǒ', spokenTone: 2, rule: 'third-tone-sandhi' },
      { match: 'hěn', spokenTone: 2, rule: 'third-tone-sandhi' },
      { match: 'Bù', spokenTone: 2, rule: 'bu-tone-sandhi' },
      // The second, lowercase yī (before tiān) changes; the capitalized
      // one earlier (before the neutral-tone ge) does not.
      { match: 'yī', spokenTone: 4, rule: 'yi-tone-sandhi' },
    ],
  },
  {
    name: 'erhua spellings validate and still participate in sandhi',
    text: 'Wǒmen zài gōngyuán wánr le yīdiǎnr.',
    invalid: [],
    apostrophes: [],
    sandhi: [{ match: 'yī', spokenTone: 4, rule: 'yi-tone-sandhi' }],
  },
  {
    name: 'title case and an already-correct apostrophe: nothing to flag but the sandhi hint',
    text: "Nǐ hǎo, Xī'ān!",
    invalid: [],
    apostrophes: [],
    sandhi: [{ match: 'Nǐ', spokenTone: 2, rule: 'third-tone-sandhi' }],
  },
];

for (const fixture of fixtures) {
  test(fixture.name, () => {
    const actualInvalid = engine
      .getInvalidPinyinRanges(fixture.text)
      .map((r) => ({
        start: r.start,
        end: r.end,
        rule: r.diagnostic.rule.id,
        suggestion: r.diagnostic.suggestion,
      }));
    const expectedInvalid = fixture.invalid.map((e) => ({
      ...findRange(fixture.text, e.match, e.occurrence || 0),
      rule: e.rule,
      suggestion: e.suggestion,
    }));
    assert.deepEqual(actualInvalid, expectedInvalid, 'getInvalidPinyinRanges');

    const actualApostrophes = engine
      .getMissingApostropheDiagnostics(fixture.text)
      .map((r) => ({
        start: r.start,
        end: r.end,
        suggestion: r.diagnostic.suggestion,
      }));
    const expectedApostrophes = fixture.apostrophes.map((e) => ({
      ...findRange(fixture.text, e.match, e.occurrence || 0),
      suggestion: e.suggestion,
    }));
    assert.deepEqual(
      actualApostrophes,
      expectedApostrophes,
      'getMissingApostropheDiagnostics',
    );

    const actualSandhi = engine.getToneSandhiHints(fixture.text).map((r) => ({
      start: r.start,
      end: r.end,
      spokenTone: r.spokenTone,
      rule: r.diagnostic.rule.id,
    }));
    const expectedSandhi = fixture.sandhi.map((e) => ({
      ...findRange(fixture.text, e.match, e.occurrence || 0),
      spokenTone: e.spokenTone,
      rule: e.rule,
    }));
    assert.deepEqual(actualSandhi, expectedSandhi, 'getToneSandhiHints');
  });
}
