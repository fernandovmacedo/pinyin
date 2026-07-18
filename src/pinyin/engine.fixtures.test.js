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
    // Each boundary separates third tones, so treating any of them as a
    // sandhi separator would produce a visible false-positive hint.
    text: 'Tā hǎo!\nNǐ我hǎo。 Nǐ ne?',
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
    sandhi: [
      {
        match: 'tǐng',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'tíng',
      },
    ],
  },
  {
    name: 'multiple tone marks are invalid even when the same text can be read as two syllables',
    text: 'hǎò xǐǎo',
    invalid: [
      { match: 'hǎò', rule: 'multiple-tone-marks', suggestion: '' },
      { match: 'xǐǎo', rule: 'multiple-tone-marks', suggestion: '' },
    ],
    apostrophes: [
      { match: 'hǎò', suggestion: "hǎ'ò" },
      { match: 'xǐǎo', suggestion: "xǐ'ǎo" },
    ],
    sandhi: [
      {
        match: 'xǐ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'xí',
      },
    ],
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
    name: 'zero-onset spelling is diagnosed at the start of an unspaced compound',
    text: 'Tā iǒudiǎn lèi.',
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
    name: 'an unabbreviated final keeps both interpretations inside an unspaced compound',
    text: 'Zhège cūenluò hěn ānjìng.',
    invalid: [
      { match: 'cūen', rule: 'abbreviated-final-spelling', suggestion: 'cūn' },
    ],
    apostrophes: [{ match: 'cūen', suggestion: "cū'en" }],
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
    name: 'ü after y is corrected standalone and inside an unspaced run with tone and case preserved',
    text: 'YǙAN, wǒyǚelái.',
    invalid: [
      {
        match: 'YǙAN',
        rule: 'umlaut-spelling-after-y',
        suggestion: 'YUǍN',
      },
      {
        match: 'yǚe',
        rule: 'umlaut-spelling-after-y',
        suggestion: 'yuě',
      },
    ],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: "missing syllable-boundary apostrophes (Xi'an, nü'er) in running text",
    text: 'Wǒ qùguò Xīān. Tā yǒu yí gè nǚér.',
    invalid: [
      { match: 'Xīān', rule: 'multiple-tone-marks', suggestion: '' },
      { match: 'nǚér', rule: 'multiple-tone-marks', suggestion: '' },
    ],
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
      {
        match: 'Wǒ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Wó',
      },
      {
        match: 'hěn',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'hén',
      },
      {
        match: 'Bù',
        spokenTone: 2,
        rule: 'bu-tone-sandhi',
        suggestion: 'Bú',
      },
      // The second, lowercase yī (before tiān) changes; the capitalized
      // one earlier (before the neutral-tone ge) does not.
      {
        match: 'yī',
        spokenTone: 4,
        rule: 'yi-tone-sandhi',
        suggestion: 'yì',
      },
    ],
  },
  {
    name: 'erhua spellings validate and still participate in sandhi',
    text: 'Wǒmen zài gōngyuán wánr le yīdiǎnr.',
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'yī',
        spokenTone: 4,
        rule: 'yi-tone-sandhi',
        suggestion: 'yì',
      },
    ],
  },
  {
    name: 'title case and correct apostrophes: nothing to flag but the sandhi hint',
    text: "Nǐ hǎo, Xī'ān! Tā de nǚ'ér.",
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'Nǐ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Ní',
      },
    ],
  },

  // ── One fixture per initial-family combination rule ──────────────────
  // Each family's "this final never follows this initial" rule should be
  // the one shown, and a lone confident nearest-syllable candidate (ü→u
  // costs only half an edit) should survive as a suggestion.
  {
    name: 'retroflex initial with ü explains the retroflex rule, and the invalid run breaks the sandhi chain',
    // mǎi gets no third-tone hint: its neighbor shǖ is not a parseable
    // syllable, so for sandhi purposes the chain simply ends there.
    text: 'Wǒ mǎi shǖ.',
    invalid: [
      { match: 'shǖ', rule: 'retroflex-final-mismatch', suggestion: 'shū' },
    ],
    apostrophes: [],
    sandhi: [
      {
        match: 'Wǒ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Wó',
      },
    ],
  },
  {
    name: 'dental sibilant with ü is flagged mid-word without disturbing the valid syllables around it',
    text: 'Wǒmen fēnchéng sān gè xiǎozǚ.',
    invalid: [
      { match: 'zǚ', rule: 'dental-sibilant-final-mismatch', suggestion: 'zǔ' },
    ],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'labial initial with an impossible final groups into one range but withholds an ambiguous suggestion',
    // fa, fan, bai, dai, hai, … are all one edit from fai, so no
    // suggestion clears the confidence margin.
    text: 'Tā fài le hěn duō shíjiān.',
    invalid: [{ match: 'fài', rule: 'labial-final-mismatch', suggestion: '' }],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'alveolar initial with ü (where nü/lü are valid but tü is not)',
    text: 'Wǒ ài chī tǚdòu.',
    invalid: [
      { match: 'tǚ', rule: 'alveolar-final-mismatch', suggestion: 'tǔ' },
    ],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'velar initial with ü inside a compound word',
    text: 'Dòngwùyuán yǒu lǎohǚ.',
    invalid: [{ match: 'hǚ', rule: 'velar-final-mismatch', suggestion: 'hǔ' }],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'ü kept after y gets the dedicated spelling rule and the plain-u respelling',
    text: 'Xià yǚ le.',
    invalid: [
      {
        match: 'yǚ',
        rule: 'umlaut-spelling-after-y',
        suggestion: 'yǔ',
      },
    ],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'ü after a palatal gets the dedicated spelling rule inside an unspaced word',
    text: 'Wǒ xǖyào xiūxi.',
    invalid: [
      {
        match: 'xǖ',
        rule: 'umlaut-spelling-after-palatal',
        suggestion: 'xū',
      },
    ],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'the longest palatal-ü syllable is diagnosed inside an unspaced word',
    text: 'Wǒ xǚanzé zhège.',
    invalid: [
      {
        match: 'xǚan',
        rule: 'umlaut-spelling-after-palatal',
        suggestion: 'xuǎn',
      },
    ],
    apostrophes: [],
    sandhi: [],
  },

  // ── The v-for-ü typing convention ────────────────────────────────────
  {
    name: 'v is read as ü, so lv-style spellings validate silently',
    text: 'Wǒ xǐhuan lvsè.',
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'Wǒ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Wó',
      },
    ],
  },
  {
    name: 'jv normalizes to jü, which is still wrong after a palatal: write ju',
    text: 'Wǒ chī jvzi.',
    invalid: [
      { match: 'jv', rule: 'palatal-final-mismatch', suggestion: 'ju' },
    ],
    apostrophes: [],
    sandhi: [],
  },

  // ── More tone-mark placement and respelling coverage ─────────────────
  {
    name: 'tone-mark priority catches the common ao, ou, and ue mistakes in running text',
    // In ao, a takes the mark; in ou, o takes it; and in xue (the
    // palatal spelling of üe), e takes it. The ui/iu last-letter cases
    // are exercised in the next fixture.
    text: 'Wǒ xǐhuan haǒ de goǔ. Dōngtiān yǒu xǔe.',
    invalid: [
      { match: 'haǒ', rule: 'tone-mark-placement', suggestion: 'hǎo' },
      { match: 'goǔ', rule: 'tone-mark-placement', suggestion: 'gǒu' },
      { match: 'xǔe', rule: 'tone-mark-placement', suggestion: 'xuě' },
    ],
    apostrophes: [],
    sandhi: [
      {
        match: 'Wǒ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Wó',
      },
      {
        match: 'yǒu',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'yóu',
      },
    ],
  },
  {
    name: 'the two classic placement traps (ui and iu take the tone on the last letter), plus bù sandhi on the misspelled neighbor',
    // dùi is misspelled but still parses as the syllable dui with a 4th
    // tone, so the bù before it correctly picks up bu-tone-sandhi.
    text: 'Zhè bù dùi, nà yǒu lìu běn.',
    invalid: [
      { match: 'dùi', rule: 'tone-mark-placement', suggestion: 'duì' },
      { match: 'lìu', rule: 'tone-mark-placement', suggestion: 'liù' },
    ],
    apostrophes: [],
    sandhi: [
      {
        match: 'bù',
        spokenTone: 2,
        rule: 'bu-tone-sandhi',
        suggestion: 'bú',
      },
    ],
  },
  {
    name: 'the other two abbreviated finals (uei→ui, uen→un), each also readable as two run-together syllables',
    // Like the niou fixture: cūen is either cūn spelled long or cū + en
    // missing an apostrophe, and guěi is either guǐ or gu + ěi. Both
    // checks report their own reading.
    text: 'Nàge cūen yǒu guěi.',
    invalid: [
      { match: 'cūen', rule: 'abbreviated-final-spelling', suggestion: 'cūn' },
      { match: 'guěi', rule: 'abbreviated-final-spelling', suggestion: 'guǐ' },
    ],
    apostrophes: [
      { match: 'cūen', suggestion: "cū'en" },
      { match: 'guěi', suggestion: "gu'ěi" },
    ],
    sandhi: [],
  },
  {
    name: 'zero-onset spelling with a u-final: uo must be written wo',
    text: 'Uǒ ài nǐ.',
    invalid: [{ match: 'Uǒ', rule: 'zero-onset-spelling', suggestion: 'Wǒ' }],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'ü remains meaningful after n and l, so correct spellings are not false positives',
    // Dropping the umlaut here creates a different valid Pinyin syllable
    // (nǚ → nǔ; lǜ → lù). Without Hanzi or lexical context, the checker
    // must preserve both spellings rather than guess the writer's word.
    text: "Wǒ de nǚ'ér xǐhuan lǜchá.",
    invalid: [],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'corrections preserve title case and all caps across diagnostic paths',
    text: 'Dùi, QǗN, QVN.',
    invalid: [
      { match: 'Dùi', rule: 'tone-mark-placement', suggestion: 'Duì' },
      {
        match: 'QǗN',
        rule: 'umlaut-spelling-after-palatal',
        suggestion: 'QÚN',
      },
      { match: 'QVN', rule: 'palatal-final-mismatch', suggestion: 'QUN' },
    ],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'a bare unfinished initial is flagged with the fallback table rule and no suggestion',
    // This is what the editor's compositionRange exists to suppress
    // while the syllable is still being typed.
    text: 'Nǐ hǎo zh',
    invalid: [
      { match: 'zh', rule: 'initial-final-table-mismatch', suggestion: '' },
    ],
    apostrophes: [],
    sandhi: [
      {
        match: 'Nǐ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Ní',
      },
    ],
  },

  // ── More apostrophe coverage ─────────────────────────────────────────
  {
    name: 'unnecessary ASCII and curly apostrophes are advisory corrections',
    text: "Zhōng'guó hé Běi’jīng.",
    invalid: [],
    apostrophes: [],
    unnecessary: [
      {
        match: "Zhōng'guó",
        rule: 'unnecessary-apostrophe',
        suggestion: 'Zhōngguó',
      },
      {
        match: 'Běi’jīng',
        rule: 'unnecessary-apostrophe',
        suggestion: 'Běijīng',
      },
    ],
    sandhi: [],
  },
  {
    name: 'missing apostrophes before o and inside a proper name; the diagnostic spans just the affected pair',
    // Tiānānmén yields one diagnostic covering Tiānān (mén starts with a
    // consonant, so the second boundary is fine as written).
    text: 'Wǒmen zài Tiānānmén kàn hǎiōu.',
    invalid: [],
    apostrophes: [
      { match: 'Tiānān', suggestion: "Tiān'ān" },
      { match: 'hǎiōu', suggestion: "hǎi'ōu" },
    ],
    sandhi: [],
  },
  {
    name: 'a curly apostrophe splits runs, so a correctly separated name is not flagged',
    text: 'Tiān’ānmén hěn dà.',
    invalid: [],
    apostrophes: [],
    sandhi: [],
  },

  // ── More sandhi composition ──────────────────────────────────────────
  {
    name: 'yī in all three of its contexts: 4th before tones 1–3, 2nd before a 4th, inside compounds too',
    text: 'Yī nián, yīqǐ, yīyàng.',
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'Yī',
        spokenTone: 4,
        rule: 'yi-tone-sandhi',
        suggestion: 'Yì',
      },
      {
        match: 'yī',
        spokenTone: 4,
        rule: 'yi-tone-sandhi',
        suggestion: 'yì',
      },
      {
        match: 'yī',
        occurrence: 1,
        spokenTone: 2,
        rule: 'yi-tone-sandhi',
        suggestion: 'yí',
      },
    ],
  },
  {
    name: 'bù sandhi fires inside an unspaced compound word',
    text: 'Zhège cài bùcuò.',
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'bù',
        spokenTone: 2,
        rule: 'bu-tone-sandhi',
        suggestion: 'bú',
      },
    ],
  },
  {
    name: 'a chain of four third tones resolves pairwise: every syllable but the last is spoken second',
    text: 'Wǒ yě hěn hǎo.',
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'Wǒ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Wó',
      },
      {
        match: 'yě',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'yé',
      },
      {
        match: 'hěn',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'hén',
      },
    ],
  },
  {
    name: 'a comma is a phrase break: the third tones on either side of it do not pair',
    text: 'Nǐ hǎo, wǒ hǎo.',
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'Nǐ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Ní',
      },
      {
        match: 'wǒ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'wó',
      },
    ],
  },
  {
    name: 'a bare newline is also a phrase break, even with no punctuation',
    text: 'Nǐ hǎo\nWǒ hǎo',
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'Nǐ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Ní',
      },
      {
        match: 'Wǒ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Wó',
      },
    ],
  },
  {
    name: 'hyphens and apostrophes keep syllables adjacent, so sandhi crosses them',
    text: "Xiǎo-mǎ hěn kě'ài.",
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'Xiǎo',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'Xiáo',
      },
      {
        match: 'mǎ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'má',
      },
      {
        match: 'hěn',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'hén',
      },
    ],
  },
  {
    name: 'a written-toneless (neutral) syllable between two third tones blocks the pair',
    text: 'Nǐmen hǎo ma?',
    invalid: [],
    apostrophes: [],
    sandhi: [],
  },
  {
    name: 'all-caps text still parses, and its sandhi hint still fires',
    text: 'NǏ HǍO MA?',
    invalid: [],
    apostrophes: [],
    sandhi: [
      {
        match: 'NǏ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'NÍ',
      },
    ],
  },

  // ── Everything at once ───────────────────────────────────────────────
  {
    name: 'repeated misspellings are each flagged, and a misplaced tone mark still counts as third tone for sandhi',
    // xǐao normalizes to the parseable syllable xiao carrying tone 3, so
    // the second xǐao (before gǒu) gets a third-tone hint even while
    // both occurrences are flagged for tone-mark placement.
    text: 'Zhèlǐ yǒu xǐao māo hé xǐao gǒu.',
    invalid: [
      { match: 'xǐao', rule: 'tone-mark-placement', suggestion: 'xiǎo' },
      {
        match: 'xǐao',
        occurrence: 1,
        rule: 'tone-mark-placement',
        suggestion: 'xiǎo',
      },
    ],
    apostrophes: [],
    sandhi: [
      {
        match: 'lǐ',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'lí',
      },
      {
        match: 'yǒu',
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'yóu',
      },
      {
        match: 'xǐao',
        occurrence: 1,
        spokenTone: 2,
        rule: 'third-tone-sandhi',
        suggestion: 'xiáo',
      },
    ],
  },
  {
    name: 'digit tone numbers are not diagnosed: the editor converts them at the keystroke, not here',
    text: 'wo3 hao3',
    invalid: [],
    apostrophes: [],
    sandhi: [],
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

    const actualUnnecessary = engine
      .getUnnecessaryApostropheDiagnostics(fixture.text)
      .map((r) => ({
        start: r.start,
        end: r.end,
        rule: r.diagnostic.rule.id,
        suggestion: r.diagnostic.suggestion,
      }));
    const expectedUnnecessary = (fixture.unnecessary || []).map((e) => ({
      ...findRange(fixture.text, e.match, e.occurrence || 0),
      rule: e.rule,
      suggestion: e.suggestion,
    }));
    assert.deepEqual(
      actualUnnecessary,
      expectedUnnecessary,
      'getUnnecessaryApostropheDiagnostics',
    );

    const actualSandhi = engine.getToneSandhiHints(fixture.text).map((r) => ({
      start: r.start,
      end: r.end,
      spokenTone: r.spokenTone,
      rule: r.diagnostic.rule.id,
      suggestion: r.diagnostic.suggestion,
    }));
    const expectedSandhi = fixture.sandhi.map((e) => ({
      ...findRange(fixture.text, e.match, e.occurrence || 0),
      spokenTone: e.spokenTone,
      rule: e.rule,
      suggestion: e.suggestion,
    }));
    assert.deepEqual(actualSandhi, expectedSandhi, 'getToneSandhiHints');
  });
}
