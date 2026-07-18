// Pure Pinyin logic: tone-mark placement and syllable-level diagnostics.
// Nothing here touches the DOM or module-level UI state, so it can be
// imported and tested directly (see tests/engine.spec.js) without a
// browser or a stubbed editor.

// Vowel table: 12 rows of 5 [untoned, tone1, tone2, tone3, tone4]
const VOWELS = [
  'a',
  0x0101,
  0x00e1,
  0x01ce,
  0x00e0, // a, ā, á, ǎ, à
  'e',
  0x0113,
  0x00e9,
  0x011b,
  0x00e8, // e, ē, é, ě, è
  'i',
  0x012b,
  0x00ed,
  0x01d0,
  0x00ec, // i, ī, í, ǐ, ì
  'o',
  0x014d,
  0x00f3,
  0x01d2,
  0x00f2, // o, ō, ó, ǒ, ò
  'u',
  0x016b,
  0x00fa,
  0x01d4,
  0x00f9, // u, ū, ú, ǔ, ù
  0x00fc,
  0x01d6,
  0x01d8,
  0x01da,
  0x01dc, // ü, ǖ, ǘ, ǚ, ǜ
  'A',
  0x0100,
  0x00c1,
  0x01cd,
  0x00c0, // A, Ā, Á, Ǎ, À
  'E',
  0x0112,
  0x00c9,
  0x011a,
  0x00c8, // E, Ē, É, Ě, È
  'I',
  0x012a,
  0x00cd,
  0x01cf,
  0x00cc, // I, Ī, Í, Ǐ, Ì
  'O',
  0x014c,
  0x00d3,
  0x01d1,
  0x00d2, // O, Ō, Ó, Ǒ, Ò
  'U',
  0x016a,
  0x00da,
  0x01d3,
  0x00d9, // U, Ū, Ú, Ǔ, Ù
  0x00dc,
  0x01d5,
  0x01d7,
  0x01d9,
  0x01db, // Ü, Ǖ, Ǘ, Ǚ, Ǜ
];
const NUM_VOWELS = 60;
const TONED_VOWEL_BASES = new Map([
  ['ā', 'a'],
  ['á', 'a'],
  ['ǎ', 'a'],
  ['à', 'a'],
  ['ē', 'e'],
  ['é', 'e'],
  ['ě', 'e'],
  ['è', 'e'],
  ['ī', 'i'],
  ['í', 'i'],
  ['ǐ', 'i'],
  ['ì', 'i'],
  ['ō', 'o'],
  ['ó', 'o'],
  ['ǒ', 'o'],
  ['ò', 'o'],
  ['ū', 'u'],
  ['ú', 'u'],
  ['ǔ', 'u'],
  ['ù', 'u'],
  ['ǖ', 'ü'],
  ['ǘ', 'ü'],
  ['ǚ', 'ü'],
  ['ǜ', 'ü'],
]);

// Convert Unicode code point to character
export function chr(codePoint) {
  if (typeof codePoint === 'number') {
    return String.fromCodePoint(codePoint);
  }
  return codePoint; // Already a string
}
// Lookup character in vowel array
export function lookupChar(ch) {
  for (let i = 0; i < NUM_VOWELS; i++) {
    if (chr(VOWELS[i]) === ch) {
      return i;
    }
  }
  return -1;
}
// Check if character is a Pinyin character (letter or toned vowel)
export function isPinyinCharacter(ch) {
  const code = ch.codePointAt(0);
  return (
    (code >= 0x61 && code <= 0x7a) || // a-z
    (code >= 0x41 && code <= 0x5a) || // A-Z
    lookupChar(ch) > -1
  );
}
export function normalizePinyin(text) {
  return Array.from(text.toLowerCase(), (ch) => {
    if (TONED_VOWEL_BASES.has(ch)) {
      return TONED_VOWEL_BASES.get(ch);
    }
    return ch === 'v' ? 'ü' : ch;
  }).join('');
}
// Find the last contiguous run of vowels in the string
// Returns {first: index, last: index} or null if no vowels found
export function findLastVowels(str) {
  let first = null;
  let last = null;
  for (let i = str.length - 1; i >= 0; i--) {
    const ch = str[i];
    if (lookupChar(ch) > -1) {
      if (last === null) {
        last = i;
        first = i;
      } else if (i === first - 1) {
        first = i;
      } else {
        break;
      }
    } else if (last !== null) {
      break;
    }
  }
  if (last === null) {
    return null;
  }
  return { first, last };
}
// Remove tone marks from a vowel run, returning the modified string
export function removeTone(str, first, last) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (i >= first && i <= last) {
      const idx = lookupChar(ch);
      if (idx > -1) {
        // Strip tone: idx - idx % 5 gives the untoned base
        result += chr(VOWELS[idx - (idx % 5)]);
      } else {
        result += ch;
      }
    } else {
      result += ch;
    }
  }
  return result;
}
// Apply tone to a vowel run
export function setTone(str, tone) {
  const vowels = findLastVowels(str);
  if (!vowels) {
    return str; // No vowels, no change
  }
  // First remove existing tones
  let result = removeTone(str, vowels.first, vowels.last);
  if (tone === 5) {
    return result;
  }
  // Recalculate vowels in the result (string may be different length)
  const newVowels = findLastVowels(result);
  if (!newVowels) {
    return result;
  }
  // Determine which vowel gets the tone
  let toneIndex = null;
  // Search from the end
  for (let i = newVowels.last; i >= newVowels.first; i--) {
    const ch = result[i];
    // a and e always get the tone
    if (ch === 'a' || ch === 'A' || ch === 'e' || ch === 'E') {
      toneIndex = i;
      break;
    }
    // o gets the tone in an "ou" combination
    else if ((ch === 'u' || ch === 'U') && i > newVowels.first) {
      const pred = result[i - 1];
      if (pred === 'o' || pred === 'O') {
        toneIndex = i - 1;
        break;
      }
    }
  }
  // If no special case, last vowel gets the tone
  if (toneIndex === null) {
    toneIndex = newVowels.last;
  }
  // Apply the tone
  const ch = result[toneIndex];
  const idx = lookupChar(ch);
  if (idx > -1 && idx % 5 === 0) {
    // Valid untoned vowel, add tone
    const tonedChar = chr(VOWELS[idx + tone]);
    result =
      result.substring(0, toneIndex) +
      tonedChar +
      result.substring(toneIndex + 1);
  }
  return result;
}
// Handle the 'v' character (inserts ü, double-v for literal v). The case
// of the typed key decides ü vs Ü, so title-case words like Nǚshì keep a
// lowercase vowel after an uppercase initial.
export function handleVCharacter(text, useUpper = false) {
  const lastChar = text.length > 0 ? text[text.length - 1] : '';
  if (lastChar === chr(0x00fc) || lastChar === chr(0x00dc)) {
    // Double-v: replace with a literal v matching the typed case
    return text.substring(0, text.length - 1) + (useUpper ? 'V' : 'v');
  }
  return text + chr(useUpper ? 0x00dc : 0x00fc);
}

// Walk text, calling callback(runStart, runEnd) for each maximal run of
// Pinyin characters (letters and toned vowels). Shared by every pass
// that scans text for syllable-level diagnostics.
function forEachPinyinRun(text, callback) {
  let runStart = null;
  for (let index = 0; index < text.length; index++) {
    if (isPinyinCharacter(text[index])) {
      if (runStart === null) {
        runStart = index;
      }
    } else if (runStart !== null) {
      callback(runStart, index);
      runStart = null;
    }
  }
  if (runStart !== null) {
    callback(runStart, text.length);
  }
}
// A separator between two Pinyin runs that keeps them adjacent for
// tone sandhi purposes: spaces, tabs, hyphens, and apostrophes.
// Anything else (sentence punctuation, newlines, digits, CJK) is a
// phrase break, so sandhi does not reach across it.
function isSandhiSeparator(separator) {
  return /^[ \t\-'’‘]+$/.test(separator);
}
function syllableEditDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let aIndex = 0; aIndex < a.length; aIndex++) {
    const current = [aIndex + 1];
    for (let bIndex = 0; bIndex < b.length; bIndex++) {
      const substitutionCost =
        a[aIndex] === b[bIndex]
          ? 0
          : (a[aIndex] === 'ü' && b[bIndex] === 'u') ||
              (a[aIndex] === 'u' && b[bIndex] === 'ü')
            ? 0.5
            : 1;
      current.push(
        Math.min(
          previous[bIndex + 1] + 1,
          current[bIndex] + 1,
          previous[bIndex] + substitutionCost,
        ),
      );
    }
    previous = current;
  }
  return previous[b.length];
}
const SUGGESTION_CONFIDENCE_MARGIN = 0.5;

// Build the syllable-aware diagnostics engine from a validated rules
// manifest (see rules/manifest.js). Everything the engine knows about
// valid syllables and combination rules is derived once here, rather
// than re-derived on every lookup.
export function createPinyinEngine(manifest) {
  const syllables = new Set(manifest.syllables);
  // Erhua: standard Mandarin Pinyin appends r to almost any syllable to
  // spell the retroflex diminutive (wánr, huàr). This is a generative
  // spelling rule, not a fixed list, so it is derived here instead of
  // being enumerated in rules.json.
  for (const syllable of manifest.syllables) {
    if (syllable !== 'er') {
      syllables.add(syllable + 'r');
    }
  }
  // Syllables grouped by their first character, and the initials list
  // pre-sorted longest-first: both let the DP passes below test only
  // the candidates that could possibly match at a given position,
  // instead of rescanning every known syllable at every character.
  const syllablesByFirstChar = new Map();
  for (const syllable of syllables) {
    const first = syllable[0];
    const bucket = syllablesByFirstChar.get(first);
    if (bucket) {
      bucket.push(syllable);
    } else {
      syllablesByFirstChar.set(first, [syllable]);
    }
  }
  const sortedInitials = manifest.rules
    .flatMap((rule) => rule.initials || [])
    .sort((first, second) => second.length - first.length);

  function syllablesStartingAt(normalized, index) {
    return syllablesByFirstChar.get(normalized[index]) || [];
  }

  function getInitialAndFinal(syllable) {
    const initial =
      sortedInitials.find((candidate) => syllable.startsWith(candidate)) || '';
    return { initial, final: syllable.substring(initial.length) };
  }

  function getRule(ruleId) {
    return manifest.rules.find((rule) => rule.id === ruleId);
  }

  function getDiagnostic(syllable, ruleId = null, suggestion = '') {
    const normalized = normalizePinyin(syllable);
    const { initial, final } = getInitialAndFinal(normalized);
    const rule =
      (ruleId && getRule(ruleId)) ||
      manifest.rules.find(
        (candidate) => candidate.initials.includes(initial) && initial && final,
      ) ||
      getRule('initial-final-table-mismatch');
    return { rule, syllable, initial, final: final || '∅', suggestion };
  }

  function findSyllableSegments(run) {
    const normalized = normalizePinyin(run);
    const best = Array(normalized.length + 1).fill(null);
    best[0] = [];
    for (let index = 0; index < normalized.length; index++) {
      if (!best[index]) {
        continue;
      }
      for (const syllable of syllablesStartingAt(normalized, index)) {
        if (!normalized.startsWith(syllable, index)) {
          continue;
        }
        const end = index + syllable.length;
        const candidate = best[index].concat({ start: index, end, syllable });
        if (!best[end] || candidate.length < best[end].length) {
          best[end] = candidate;
        }
      }
    }
    return best[normalized.length] || [];
  }

  // Like findSyllableSegments, but rejects a segment that would swallow
  // two tone-marked vowels, since a real syllable carries at most one.
  // This lets a run typed as two separate toned syllables (e.g. "xi1"
  // then "an4", giving xīàn with no separator) be told apart from a
  // single syllable that happens to normalize the same way (xiàn).
  function findSpokenSyllableSegments(run) {
    const normalized = normalizePinyin(run);
    const isToned = Array.from(run, (ch) => lookupChar(ch) % 5 > 0);
    const best = Array(normalized.length + 1).fill(null);
    best[0] = [];
    for (let index = 0; index < normalized.length; index++) {
      if (!best[index]) {
        continue;
      }
      for (const syllable of syllablesStartingAt(normalized, index)) {
        if (!normalized.startsWith(syllable, index)) {
          continue;
        }
        const end = index + syllable.length;
        const toneCount = isToned.slice(index, end).filter(Boolean).length;
        if (toneCount > 1) {
          continue;
        }
        const candidate = best[index].concat({ start: index, end, syllable });
        if (!best[end] || candidate.length < best[end].length) {
          best[end] = candidate;
        }
      }
    }
    return best[normalized.length] || [];
  }

  function getSpellingDiagnostics(run) {
    const diagnostics = [];
    for (const segment of findSyllableSegments(run)) {
      const spelling = run.substring(segment.start, segment.end);
      const tones = Array.from(spelling, (ch) => lookupChar(ch) % 5).filter(
        (tone) => tone > 0,
      );
      if (tones.length !== 1) {
        continue;
      }
      const suggestion = setTone(segment.syllable, tones[0]);
      if (spelling.toLowerCase() !== suggestion) {
        diagnostics.push({
          start: segment.start,
          end: segment.end,
          diagnostic: getDiagnostic(
            spelling,
            'tone-mark-placement',
            suggestion,
          ),
        });
      }
    }
    const normalized = normalizePinyin(run);
    // Carry the run's tone mark over to a respelled suggestion so, for
    // example, iǒu suggests yǒu rather than a toneless you.
    const runTone =
      Array.from(run, (ch) => lookupChar(ch) % 5).find((value) => value > 0) ||
      0;
    const withRunTone = (base) => (runTone ? setTone(base, runTone) : base);
    const zeroOnsetSpellings = new Map([
      ['i', 'yi'],
      ['ia', 'ya'],
      ['ie', 'ye'],
      ['iao', 'yao'],
      ['iou', 'you'],
      ['ian', 'yan'],
      ['iang', 'yang'],
      ['in', 'yin'],
      ['ing', 'ying'],
      ['iong', 'yong'],
      ['u', 'wu'],
      ['ua', 'wa'],
      ['uo', 'wo'],
      ['uai', 'wai'],
      ['uei', 'wei'],
      ['uan', 'wan'],
      ['uen', 'wen'],
      ['uang', 'wang'],
      ['ueng', 'weng'],
      ['ü', 'yu'],
      ['üe', 'yue'],
      ['üan', 'yuan'],
      ['ün', 'yun'],
      ['iu', 'you'],
      ['ui', 'wei'],
      ['un', 'wen'],
    ]);
    const zeroOnsetSuggestion = zeroOnsetSpellings.get(normalized);
    if (zeroOnsetSuggestion && syllables.has(zeroOnsetSuggestion)) {
      diagnostics.push({
        start: 0,
        end: run.length,
        diagnostic: getDiagnostic(
          run,
          'zero-onset-spelling',
          withRunTone(zeroOnsetSuggestion),
        ),
      });
    }
    const { initial } = getInitialAndFinal(normalized);
    const abbreviations = new Map([
      ['iou', 'iu'],
      ['uei', 'ui'],
      ['uen', 'un'],
    ]);
    for (const [longFinal, shortFinal] of abbreviations) {
      if (
        initial &&
        normalized === initial + longFinal &&
        syllables.has(initial + shortFinal)
      ) {
        diagnostics.push({
          start: 0,
          end: run.length,
          diagnostic: getDiagnostic(
            run,
            'abbreviated-final-spelling',
            withRunTone(initial + shortFinal),
          ),
        });
      }
    }
    const umlautMatch = !/[vV]/.test(run) && normalized.match(/^([jqx])ü(.*)$/);
    if (umlautMatch) {
      const suggestionBase = umlautMatch[1] + 'u' + umlautMatch[2];
      if (syllables.has(suggestionBase)) {
        diagnostics.push({
          start: 0,
          end: run.length,
          diagnostic: getDiagnostic(
            run,
            'umlaut-spelling-after-palatal',
            withRunTone(suggestionBase),
          ),
        });
      }
    }
    return diagnostics;
  }

  function suggestNearestSyllable(spelling) {
    const normalized = normalizePinyin(spelling);
    if (!normalized || normalized.length > 8) {
      return '';
    }
    const maxDistance = normalized.length <= 3 ? 1 : 2;
    const candidates = manifest.syllables
      .filter(
        (candidate) =>
          Math.abs(candidate.length - normalized.length) <= maxDistance,
      )
      .map((candidate) => ({
        candidate,
        distance: syllableEditDistance(normalized, candidate),
      }))
      .filter(({ distance }) => distance <= maxDistance);
    if (candidates.length === 0) {
      return '';
    }
    candidates.sort(
      (first, second) =>
        first.distance - second.distance ||
        first.candidate.localeCompare(second.candidate),
    );
    if (
      candidates.length > 1 &&
      candidates[1].distance - candidates[0].distance <
        SUGGESTION_CONFIDENCE_MARGIN
    ) {
      return '';
    }
    const best = candidates[0].candidate;
    const tone =
      Array.from(spelling, (ch) => lookupChar(ch) % 5).find(
        (value) => value > 0,
      ) || 0;
    return tone ? setTone(best, tone) : best;
  }

  function findInvalidOffsets(run) {
    const normalized = normalizePinyin(run);
    const best = Array(normalized.length + 1).fill(null);
    best[0] = { score: 0, invalid: [] };
    for (let index = 0; index < normalized.length; index++) {
      if (!best[index]) {
        continue;
      }
      const skipped = {
        score: best[index].score,
        invalid: best[index].invalid.concat(index),
      };
      if (!best[index + 1] || skipped.score > best[index + 1].score) {
        best[index + 1] = skipped;
      }
      for (const syllable of syllablesStartingAt(normalized, index)) {
        if (!normalized.startsWith(syllable, index)) {
          continue;
        }
        const end = index + syllable.length;
        const candidate = {
          score: best[index].score + syllable.length,
          invalid: best[index].invalid,
        };
        if (!best[end] || candidate.score > best[end].score) {
          best[end] = candidate;
        }
      }
    }
    return best[normalized.length].invalid;
  }

  // compositionRange (nullable {start, end}) excludes the syllable the
  // caller is currently typing from validation, so an in-progress
  // syllable is not flagged invalid mid-keystroke.
  function getInvalidPinyinRanges(text, compositionRange = null) {
    const compStart = compositionRange ? compositionRange.start : null;
    const compositionEnd = compositionRange ? compositionRange.end : null;
    const invalid = new Set();
    const diagnosticsByStart = new Map();
    forEachPinyinRun(text, (runStart, end) => {
      const run = text.substring(runStart, end);
      for (const spellingDiagnostic of getSpellingDiagnostics(run)) {
        const start = runStart + spellingDiagnostic.start;
        diagnosticsByStart.set(start, spellingDiagnostic.diagnostic);
        for (
          let cursor = start;
          cursor < runStart + spellingDiagnostic.end;
          cursor++
        ) {
          invalid.add(cursor);
        }
      }
      const invalidOffsets = findInvalidOffsets(run);
      for (const offset of invalidOffsets) {
        const index = runStart + offset;
        if (
          compStart === null ||
          index < compStart ||
          index >= compositionEnd
        ) {
          invalid.add(index);
        }
      }
      // If a stray initial is followed by a vowel-only syllable (jo, qa,
      // xe), keep the attempted initial-final combination together. This
      // lets the learner see the relevant combination rule instead of a
      // misleading diagnosis for the initial letter alone.
      for (const offset of invalidOffsets) {
        const { initial, final } = getInitialAndFinal(
          normalizePinyin(run[offset]),
        );
        if (!initial || final) {
          continue;
        }
        for (
          let cursor = offset + 1;
          cursor < run.length && lookupChar(run[cursor]) > -1;
          cursor++
        ) {
          const index = runStart + cursor;
          if (
            compStart === null ||
            index < compStart ||
            index >= compositionEnd
          ) {
            invalid.add(index);
          }
        }
      }
    });
    const ranges = [];
    for (let index = 0; index < text.length; index++) {
      if (!invalid.has(index)) {
        continue;
      }
      const start = index;
      while (invalid.has(index + 1)) {
        index++;
      }
      const end = index + 1;
      const spelling = text.substring(start, end);
      ranges.push({
        start,
        end,
        diagnostic:
          diagnosticsByStart.get(start) ||
          getDiagnostic(spelling, null, suggestNearestSyllable(spelling)),
      });
    }
    return ranges;
  }

  // Flags a syllable boundary that needs an apostrophe: a syllable
  // beginning with a, o, or e directly following another syllable with
  // no separator (Xian instead of Xi'an). Only fires within a run that
  // is otherwise fully valid Pinyin and was typed as separately toned
  // syllables, so it never overrides an actual error.
  function getMissingApostropheDiagnostics(text) {
    const diagnostics = [];
    forEachPinyinRun(text, (runStart, end) => {
      const run = text.substring(runStart, end);
      const segments = findSpokenSyllableSegments(run);
      for (let i = 1; i < segments.length; i++) {
        const curr = segments[i];
        const firstChar = normalizePinyin(run[curr.start]);
        if (firstChar !== 'a' && firstChar !== 'o' && firstChar !== 'e') {
          continue;
        }
        const prev = segments[i - 1];
        const clause = run.substring(prev.start, curr.end);
        // Match rules.json's own examples (Xi'an, nü'er), which use the
        // plain ASCII apostrophe rather than the curly Unicode one.
        const suggestion =
          run.substring(prev.start, curr.start) +
          "'" +
          run.substring(curr.start, curr.end);
        diagnostics.push({
          start: runStart + prev.start,
          end: runStart + curr.end,
          diagnostic: getDiagnostic(clause, 'missing-apostrophe', suggestion),
        });
      }
    });
    return diagnostics;
  }

  // Tone number (1-4) for each syllable in the text, for the optional
  // tone-coloring toggle. Only covers runs that are fully valid Pinyin;
  // untoned or neutral-tone syllables are left uncolored.
  function getToneRanges(text) {
    const ranges = [];
    forEachPinyinRun(text, (runStart, end) => {
      const run = text.substring(runStart, end);
      for (const segment of findSpokenSyllableSegments(run)) {
        const spelling = run.substring(segment.start, segment.end);
        const tone = Array.from(spelling, (ch) => lookupChar(ch) % 5).find(
          (value) => value > 0,
        );
        if (!tone) {
          continue;
        }
        ranges.push({
          start: runStart + segment.start,
          end: runStart + segment.end,
          tone,
        });
      }
    });
    return ranges;
  }

  // Tone sandhi hints: syllables whose pronounced tone differs from
  // the written one. Covers third-tone pairs (nǐ hǎo → ní hǎo) and the
  // tone changes of bù and yī. Uses written tones as context so chains
  // of three or more third tones resolve pairwise, right to left.
  function getToneSandhiHints(text) {
    // Pass 1: a document-wide ordered list of syllables, spanning run
    // boundaries, each carrying whether it is adjacent to the syllable
    // before it.
    const syllableList = [];
    let prevRunEnd = null;
    forEachPinyinRun(text, (runStart, runEnd) => {
      const run = text.substring(runStart, runEnd);
      const segments = findSpokenSyllableSegments(run);
      if (segments.length === 0) {
        prevRunEnd = null;
        return;
      }
      segments.forEach((segment, i) => {
        const spelling = run.substring(segment.start, segment.end);
        const tone =
          Array.from(spelling, (ch) => lookupChar(ch) % 5).find(
            (value) => value > 0,
          ) || 0;
        const adjacentToPrev =
          i > 0 ||
          (prevRunEnd !== null &&
            isSandhiSeparator(text.substring(prevRunEnd, runStart)));
        syllableList.push({
          start: runStart + segment.start,
          end: runStart + segment.end,
          syllable: segment.syllable,
          tone,
          adjacentToPrev,
        });
      });
      prevRunEnd = runEnd;
    });
    // Pass 2: apply the sandhi rules against written tones. Reading the
    // next syllable's written tone (rather than its already
    // sandhi-adjusted tone) makes the third-tone rule resolve chains
    // pairwise, right to left, in a single non-cascading pass: wǒ hěn
    // hǎo (3-3-3) becomes wó hén hǎo (2-2-3).
    const hints = [];
    for (let i = 0; i < syllableList.length - 1; i++) {
      const curr = syllableList[i];
      const next = syllableList[i + 1];
      if (!next.adjacentToPrev) {
        continue;
      }
      let spokenTone = null;
      let ruleId = null;
      if (curr.tone === 3 && next.tone === 3) {
        spokenTone = 2;
        ruleId = 'third-tone-sandhi';
      } else if (curr.syllable === 'bu' && curr.tone === 4 && next.tone === 4) {
        spokenTone = 2;
        ruleId = 'bu-tone-sandhi';
      } else if (curr.syllable === 'yi' && curr.tone === 1 && next.tone === 4) {
        spokenTone = 2;
        ruleId = 'yi-tone-sandhi';
      } else if (
        curr.syllable === 'yi' &&
        curr.tone === 1 &&
        next.tone >= 1 &&
        next.tone <= 3
      ) {
        spokenTone = 4;
        ruleId = 'yi-tone-sandhi';
      }
      if (spokenTone === null) {
        continue;
      }
      const spelling = text.substring(curr.start, curr.end);
      hints.push({
        start: curr.start,
        end: curr.end,
        spokenTone,
        diagnostic: getDiagnostic(
          spelling,
          ruleId,
          setTone(spelling, spokenTone),
        ),
      });
    }
    return hints;
  }

  return {
    syllables,
    getInitialAndFinal,
    getRule,
    getDiagnostic,
    findSyllableSegments,
    findSpokenSyllableSegments,
    getSpellingDiagnostics,
    suggestNearestSyllable,
    findInvalidOffsets,
    getInvalidPinyinRanges,
    getMissingApostropheDiagnostics,
    getToneRanges,
    getToneSandhiHints,
  };
}
