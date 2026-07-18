# Confidence-gated Pinyin suggestions

## Goal

Make invalid-syllable suggestions trustworthy rather than merely nearest:
show a "Did you mean" correction only when a single valid syllable is a
clearly better repair than every alternative, and show nothing (keeping the
rule explanation) when several repairs are equally plausible. Corrections
mandated by Hanyu Pinyin spelling rules stay authoritative and always win.

## What the code already does

The current implementation in `index.html` already covers more of the
original design space than first assumed. This plan is scoped around it:

- `getSpellingDiagnostics` produces exact, explainable repairs for tone
  placement, zero-onset spellings, abbreviated finals, and `ü` after
  `j/q/x`. These own their ranges via `diagnosticsByStart` and never fall
  through to the generic suggestion path.
- `normalizePinyin` maps `v` → `ü`, and `syllableEditDistance` charges only
  0.5 for a `ü` ↔ `u` substitution. Together these already implement the
  `j/q/x` dot-omission convention as a distance weight: `qvn` and `qǖn`
  suggest `qun`/`qūn` today, with tests locking that in.
- `suggestNearestSyllable` rejects empty input, ranges longer than eight
  normalized characters, and candidates beyond a length-scaled distance
  threshold; it scans `pinyinRules.syllables` (not generated erhua forms)
  and applies the user's tone via `setTone` only after ranking.

Two ideas from the earlier draft of this plan are dropped, with reasons
recorded in "Out of scope" below: an explicit deterministic `v`-transform
layer (redundant where reachable, unreachable where not), and rule-aware
scoring bonuses (the confidence guard makes them inert — see below).

## Research basis

- The [Hanyu Pinyin Scheme (1958)](https://www.moe.gov.cn/jyb_sjzl/ziliao/A19/195802/t19580201_186000.html)
  specifies the `y`/`w` zero-initial spellings, the `iou`/`uei`/`uen`
  abbreviations, `ü` dot omission after `j/q/x`, and apostrophe placement —
  all already implemented as explicit diagnostics.
- [ISO 7098:2015](https://www.iso.org/standard/61420.html) adopts that
  scheme for Modern Standard Mandarin romanization.
- The project sources [UT Austin Pinyin Rules](sources/ut-austin-pitch-perfect-pinyin-rules.md)
  and [Mastering Mandarin Sounds](sources/Mastering-Mandarin-Sounds.md)
  document the same conventions and the initial–final compatibility
  constraints behind the diagnostic rules.

The conservatism argument is the new part: for an input like `bng`, the
valid syllables `bang`, `beng`, `bing`, `bong` are all one insertion away,
share the initial, and share the final `ng`. No orthographic rule prefers
one; only a word dictionary could. Guessing (`bang`, today's behaviour, by
lexicographic accident) risks teaching the wrong syllable, which is worse
for a learner tool than admitting ambiguity.

## Recommended behaviour

1. Explicit spelling diagnostics keep their suggestions unchanged.
2. The generic path keeps its weighted-Levenshtein candidate search
   unchanged, including the `ü`/`u` half-cost.
3. New: a confidence-margin guard. Return the best candidate only when it
   is the sole candidate within the distance threshold, or when it beats
   the runner-up by at least `SUGGESTION_CONFIDENCE_MARGIN` (initially
   `0.5`, one `ü`/`u` substitution). Otherwise return `''` and let the
   rule explanation stand alone.

Accepted behavioural change: `bng` stops suggesting `bang` (four-way exact
tie). `qvn` → `qun` survives: `qun` sits at distance 0.5 and the runner-up
`qin` at 1.0, exactly the margin. `zzzzzzzzz` and `xxxx` still return `''`
via the existing threshold.

Why no rule-aware bonuses: any candidate that wins by strictly lower
distance needs no bonus, and any candidates tied on distance are rejected
by the guard — so a bonus could only change the outcome by overriding the
guard, which defeats its purpose. Same-initial and shared-final signals
also fail to separate the real ties (`bng`'s candidates share both; `jo`'s
`ji`/`ju` share the initial). If a future case demands a bonus, it must
stay strictly below 0.5 so it can never outrank a genuinely closer
syllable.

## Implementation plan

All changes are in `index.html`. No changes to `rules.json` or its version.

### 1. Add the margin guard to `suggestNearestSyllable`

- Define `const SUGGESTION_CONFIDENCE_MARGIN = 0.5;` next to the function
  so tuning is explicit and visible.
- After filtering candidates to the distance threshold, sort by distance,
  then lexicographically for determinism.
- Return `''` when there is more than one candidate and
  `candidates[1].distance - candidates[0].distance <
  SUGGESTION_CONFIDENCE_MARGIN`.
- Keep the existing empty/length/threshold rejections and the
  tone-after-ranking behaviour unchanged.

### 2. Delete the same-initial tie-breaker

The current comparator promotes same-initial candidates among equal
distances. Under the guard, an equal-distance tie always yields `''`, so
that tie-breaker can no longer influence any displayed suggestion — remove
it (and its per-candidate `getInitialAndFinal` calls) rather than keep
dead logic. The lexicographic comparison stays so the sort, and therefore
the margin computation, is deterministic.

### 3. Leave the call sites alone

`getInvalidPinyinRanges` already resolves each generic range with
`diagnosticsByStart.get(start) || getDiagnostic(spelling, null,
suggestNearestSyllable(spelling))`. The suggestion function needs no
knowledge of the resolved diagnostic, so no refactor is required there,
and `renderDiagnosticCard` already renders the "Did you mean" line only
when a suggestion is present — an empty suggestion needs no rendering
change.

## Inline tests

Update one existing test, keep the rest as regression anchors, and add
coverage for both sides of the guard:

1. Update 'Marks impossible Pinyin combinations': `bng` keeps its range
   and `labial-final-mismatch` rule, but its suggestion assertion changes
   from `'bang'` to `''`.
2. Keep unchanged (must still pass): `qvn` → `qun`, `qǖn` → `qūn`,
   `zzzzzzzzz`/`xxxx` → `''`, and every explicit-diagnostic suggestion
   test (`iou`, `iǒu`, `diōu`, `jǘn`, missing apostrophe).
3. New ambiguity test: `jo` yields the `palatal-final-mismatch` rule with
   suggestion `''` (`ji` and `ju` tie at distance 1).
4. New clear-winner test: `zhonk` yields `zhong` (distance 1; every other
   candidate is at 2 or beyond, margin 1.0).
5. New card test: with `bng` in the editor, the diagnostic card shows the
   rule explanation but no "Did you mean" line, in English and after
   `setLanguage('pt')`. The existing `qvn` round-trip test continues to
   cover the positive card path in both languages.

## Verification

1. `npm test` — the headless suite must pass, including the updated `bng`
   expectation.
2. `git diff --check`.
3. Manual smoke test via `python3 -m http.server 8896`:
   - `qvn` shows `qun` with the palatal-final explanation;
   - `bng` shows the labial-final explanation with no suggestion;
   - `zhonk` shows `zhong`;
   - `diou` still shows only its rule-embedded correction;
   - switch to Portuguese and confirm both card states.

## Out of scope (recorded decisions)

- **Flagging raw `v` spellings (`nve`, `lv`).** These normalize to the
  valid syllables `nüe`/`lü`, so they never enter the diagnostic pipeline
  at all — `v` is an accepted input convention here, as it is in IME
  practice. Surfacing "standard spelling uses `ü`" (the common error noted
  in the [BNU publishing guide](https://pub.bnu.edu.cn/jzyg1/127880.html))
  would require a new rule in `rules.json` and a new "nonstandard but
  understood" severity tier, since these inputs are not invalid. Separate
  feature, separate decision.
- **Pronunciation-confusion mappings** (`n`/`l`, `n`/`ng`, `z`/`zh`).
  Learner- and dialect-dependent; ambiguous without a word dictionary.
  Could become an opt-in feature later.
- **Showing labelled alternatives on a near tie.** The guard shows nothing
  instead, prioritizing trust and card concision. If revisited, carry an
  `alternatives` array in the diagnostic payload and render a clearly
  labelled "possible spellings" line — do not overload `suggestion` with
  comma-separated text.
