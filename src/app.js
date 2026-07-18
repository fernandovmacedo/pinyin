import pinyinRulesManifest from './data/rules.json';
import { validateRulesManifest } from './rules/manifest.js';

// Theme handling
function setTheme(theme) {
  if (theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }
  // Update theme buttons
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.themeChoice === theme),
    );
  });
}
// Load saved theme or default to auto
setTheme(localStorage.getItem('theme') || 'auto');
document.querySelectorAll('[data-theme-choice]').forEach((button) => {
  button.addEventListener('click', function () {
    setTheme(this.dataset.themeChoice);
  });
});
// UI chrome strings (English / Brazilian Portuguese). The Chinese text
// throughout the editor (rules.json's "zh" fields, tone examples) is not
// part of this table and never changes with the interface language.
const I18N = {
  en: {
    themeGroupLabel: 'Theme',
    themeAuto: 'Use system theme',
    themeLight: 'Use light theme',
    themeDark: 'Use dark theme',
    githubLabel: 'View the Pinyin Typing source on GitHub',
    githubTitle: 'View on GitHub',
    langSwitchLabel: 'Switch to Portuguese',
    editorPlaceholder: 'Start typing Pinyin here...',
    rulesLoading: 'Loading Pinyin rules…',
    rulesError: 'Unable to load embedded Pinyin rules. Reload the editor.',
    copyBtn: 'Copy',
    copyDone: 'Copied!',
    shareBtn: 'Share',
    shareDone: 'Link copied!',
    clearBtn: 'Clear',
    checkBtn: 'Check',
    checkOnAria: 'Pinyin checking is on',
    checkOffAria: 'Pinyin checking is off',
    toneColorsBtn: 'Colors',
    toneColorsOnAria: 'Tone colors are on',
    toneColorsOffAria: 'Tone colors are off',
    howToUse: 'How to use',
    li: [
      'Type a syllable followed by <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd>, or <kbd>4</kbd> to add the tone mark',
      'Place the caret on an existing syllable and press <kbd>1</kbd>–<kbd>4</kbd> to change its tone; <kbd>5</kbd> removes the mark (neutral tone)',
      'Type <kbd>v</kbd> to enter <strong>ü</strong> and <kbd>V</kbd> for <strong>Ü</strong> (type <kbd>vv</kbd> for a literal <kbd>v</kbd>)',
      'Press <kbd>Enter</kbd> to accept the current syllable',
      'Press <kbd>Escape</kbd> to cancel the current syllable',
      'Backspace works normally',
      '<strong>Check Pinyin</strong> underlines invalid syllables; turn it off when writing non-Pinyin text',
      "A dotted underline marks a missing apostrophe between syllables, such as <strong>hai'ou</strong>",
      'A teal underline marks a tone-sandhi hint — the syllable is pronounced with a different tone than written, such as <strong>nǐ hǎo</strong> (said <strong>ní hǎo</strong>)',
      '<strong>Tone colors</strong> tints each syllable by its tone',
      'Your text is saved in this browser automatically; use <strong>Share link</strong> to copy a URL that carries your current text to someone else',
    ],
    exampleHtml:
      '<strong>Example:</strong> Type <code>Ni3 hao3! Wo3 jiao4 Li3 Ming2, hen3 gao1xing4 ren4shi ni3.</code> to get <strong>Nǐ hǎo! Wǒ jiào Lǐ Míng, hěn gāoxìng rènshi nǐ.</strong> ("Hello! My name is Li Ming, nice to meet you." — all four tones plus the neutral tone.)',
    diagnosticCardLabel: 'Pinyin rule explanation',
    compositionPrefix: 'Composition: ',
    contrastLabel: 'Contrast',
    sourcesLabel: 'Sources',
    didYouMeanLabel: 'Did you mean',
  },
  pt: {
    themeGroupLabel: 'Tema',
    themeAuto: 'Usar tema do sistema',
    themeLight: 'Usar tema claro',
    themeDark: 'Usar tema escuro',
    githubLabel: 'Ver o código-fonte do Pinyin Typing no GitHub',
    githubTitle: 'Ver no GitHub',
    langSwitchLabel: 'Mudar para inglês',
    editorPlaceholder: 'Comece a digitar Pinyin aqui...',
    rulesLoading: 'Carregando regras de Pinyin…',
    rulesError:
      'Não foi possível carregar as regras de Pinyin incorporadas. Recarregue o editor.',
    copyBtn: 'Copiar',
    copyDone: 'Copiado!',
    shareBtn: 'Compartilhar',
    shareDone: 'Link copiado!',
    clearBtn: 'Limpar',
    checkBtn: 'Checar',
    checkOnAria: 'A verificação de Pinyin está ativada',
    checkOffAria: 'A verificação de Pinyin está desativada',
    toneColorsBtn: 'Cores',
    toneColorsOnAria: 'As cores de tom estão ativadas',
    toneColorsOffAria: 'As cores de tom estão desativadas',
    howToUse: 'Como usar',
    li: [
      'Digite uma sílaba seguida de <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd> ou <kbd>4</kbd> para adicionar a marca de tom',
      'Posicione o cursor em uma sílaba existente e pressione <kbd>1</kbd>–<kbd>4</kbd> para mudar seu tom; <kbd>5</kbd> remove a marca (tom neutro)',
      'Digite <kbd>v</kbd> para inserir <strong>ü</strong> e <kbd>V</kbd> para <strong>Ü</strong> (digite <kbd>vv</kbd> para obter um <kbd>v</kbd> literal)',
      'Pressione <kbd>Enter</kbd> para confirmar a sílaba atual',
      'Pressione <kbd>Escape</kbd> para cancelar a sílaba atual',
      'A tecla Backspace funciona normalmente',
      '<strong>Verificar Pinyin</strong> sublinha sílabas inválidas; desative ao escrever texto que não seja Pinyin',
      "Um sublinhado pontilhado indica um apóstrofo ausente entre sílabas, como em <strong>hai'ou</strong>",
      'Um sublinhado azul-petróleo indica uma dica de mudança de tom (sandhi) — a sílaba é pronunciada com um tom diferente do escrito, como em <strong>nǐ hǎo</strong> (pronuncia-se <strong>ní hǎo</strong>)',
      '<strong>Cores de tom</strong> colore cada sílaba de acordo com seu tom',
      'Seu texto é salvo neste navegador automaticamente; use <strong>Compartilhar link</strong> para copiar uma URL que leva seu texto atual para outra pessoa',
    ],
    exampleHtml:
      '<strong>Exemplo:</strong> Digite <code>Ni3 hao3! Wo3 jiao4 Li3 Ming2, hen3 gao1xing4 ren4shi ni3.</code> para obter <strong>Nǐ hǎo! Wǒ jiào Lǐ Míng, hěn gāoxìng rènshi nǐ.</strong> ("Olá! Meu nome é Li Ming, prazer em conhecê-lo." — os quatro tons mais o tom neutro.)',
    diagnosticCardLabel: 'Explicação da regra de Pinyin',
    compositionPrefix: 'Composição: ',
    contrastLabel: 'Contraste',
    sourcesLabel: 'Fontes',
    didYouMeanLabel: 'Você quis dizer',
  },
};
const langToggle = document.getElementById('lang-toggle');
const themeSelectorEl = document.querySelector('.theme-selector');
const githubLinkEl = document.querySelector('.github-link');
const copyBtn = document.getElementById('copy-btn');
const shareBtn = document.getElementById('share-btn');
const clearBtn = document.getElementById('clear-btn');
const instructionsHeading = document.querySelector('.instructions h2');
const instructionsItems = document.querySelectorAll('.instructions li');
const instructionsExample = document.querySelector('.instructions p');
let uiLang = 'en';
function detectInitialLang() {
  const stored = localStorage.getItem('lang');
  if (stored === 'en' || stored === 'pt') {
    return stored;
  }
  const browserLang = (navigator.language || '').toLowerCase();
  return browserLang.startsWith('pt') ? 'pt' : 'en';
}
function applyLanguageStrings() {
  const t = I18N[uiLang];
  document.documentElement.lang = uiLang === 'pt' ? 'pt-BR' : 'en';
  themeSelectorEl.setAttribute('aria-label', t.themeGroupLabel);
  document
    .querySelector('[data-theme-choice="auto"]')
    .setAttribute('aria-label', t.themeAuto);
  document
    .querySelector('[data-theme-choice="auto"]')
    .setAttribute('title', t.themeAuto);
  document
    .querySelector('[data-theme-choice="light"]')
    .setAttribute('aria-label', t.themeLight);
  document
    .querySelector('[data-theme-choice="light"]')
    .setAttribute('title', t.themeLight);
  document
    .querySelector('[data-theme-choice="dark"]')
    .setAttribute('aria-label', t.themeDark);
  document
    .querySelector('[data-theme-choice="dark"]')
    .setAttribute('title', t.themeDark);
  githubLinkEl.setAttribute('aria-label', t.githubLabel);
  githubLinkEl.setAttribute('title', t.githubTitle);
  langToggle.textContent = uiLang === 'pt' ? 'PT' : 'EN';
  langToggle.setAttribute('aria-label', t.langSwitchLabel);
  langToggle.setAttribute('title', t.langSwitchLabel);
  editor.placeholder = t.editorPlaceholder;
  copyBtn.textContent = t.copyBtn;
  shareBtn.setAttribute('aria-label', t.shareBtn);
  shareBtn.setAttribute('title', t.shareBtn);
  clearBtn.textContent = t.clearBtn;
  instructionsHeading.textContent = t.howToUse;
  instructionsItems.forEach((item, i) => {
    item.innerHTML = t.li[i];
  });
  instructionsExample.innerHTML = t.exampleHtml;
  diagnosticCard.setAttribute('aria-label', t.diagnosticCardLabel);
  setRulesStatus(rulesStatusState);
  setPinyinValidation(pinyinValidationEnabled);
  setToneColoring(toneColoringEnabled);
  updateIndicator();
  hideDiagnostic();
}
function setLanguage(lang) {
  uiLang = lang;
  localStorage.setItem('lang', lang);
  applyLanguageStrings();
}
langToggle.addEventListener('click', function () {
  setLanguage(uiLang === 'pt' ? 'en' : 'pt');
});
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
const MAX_COMPOSITION_LENGTH = 50;
const SHIFTED_COMPOSITION_LENGTH = 20;
// rules.json is the single source of truth for valid syllables, teaching
// explanations, and citations. It is deliberately kept outside this file so
// linguistic content can be reviewed without changing editor behavior.
let pinyinRules = null;
let PINYIN_SYLLABLES = new Set();
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
// State
let compStart = null; // Start index of composition, or null if not composing
let pinyinValidationEnabled = true;
// Show tone colors by default; retain an explicit opt-out for returning users.
let toneColoringEnabled = localStorage.getItem('toneColors') !== 'off';
// Tracks the last text written to (or read from) the 'draft' localStorage
// key, so renderValidation only writes when the text actually changed.
let lastSavedDraft = '';
let validationFrame = null;
let pinnedDiagnostic = null;
let tooltipHideTimer = null;
const editor = document.getElementById('editor');
const indicator = document.getElementById('composition-indicator');
const highlights = document.getElementById('validation-highlights');
const validationToggle = document.getElementById('validation-toggle');
const toneColorToggle = document.getElementById('tone-color-toggle');
const diagnosticCard = document.getElementById('diagnostic-card');
const rulesStatus = document.getElementById('rules-status');
// Replace [start, end) of the editor through execCommand so the browser
// records the change in the textarea's native undo history; setRangeText
// bypasses undo and is kept only as a fallback.
function replaceRange(start, end, text) {
  editor.focus();
  editor.setSelectionRange(start, end);
  if (start === end && !text) {
    return;
  }
  const done = text
    ? document.execCommand('insertText', false, text)
    : document.execCommand('delete');
  if (!done) {
    editor.setRangeText(text, start, end, text ? 'end' : 'select');
  }
}
// Convert Unicode code point to character
function chr(codePoint) {
  if (typeof codePoint === 'number') {
    return String.fromCodePoint(codePoint);
  }
  return codePoint; // Already a string
}
// Lookup character in vowel array
function lookupChar(ch) {
  for (let i = 0; i < NUM_VOWELS; i++) {
    if (chr(VOWELS[i]) === ch) {
      return i;
    }
  }
  return -1;
}
// Check if character is a Pinyin character (letter or toned vowel)
function isPinyinCharacter(ch) {
  const code = ch.codePointAt(0);
  return (
    (code >= 0x61 && code <= 0x7a) || // a-z
    (code >= 0x41 && code <= 0x5a) || // A-Z
    lookupChar(ch) > -1
  );
}
function normalizePinyin(text) {
  return Array.from(text.toLowerCase(), (ch) => {
    if (TONED_VOWEL_BASES.has(ch)) {
      return TONED_VOWEL_BASES.get(ch);
    }
    return ch === 'v' ? 'ü' : ch;
  }).join('');
}
let rulesStatusState = 'loading'; // 'loading' | 'ready' | 'error'
function setRulesStatus(state) {
  rulesStatusState = state;
  const t = I18N[uiLang];
  if (state === 'loading') {
    rulesStatus.textContent = t.rulesLoading;
    rulesStatus.classList.remove('error');
  } else if (state === 'error') {
    rulesStatus.textContent = t.rulesError;
    rulesStatus.classList.add('error');
  } else {
    rulesStatus.textContent = '';
    rulesStatus.classList.remove('error');
  }
}
function loadPinyinRules(manifest) {
  try {
    validateRulesManifest(manifest);
    pinyinRules = manifest;
    PINYIN_SYLLABLES = new Set(manifest.syllables);
    // Erhua: standard Mandarin Pinyin appends r to almost any syllable
    // to spell the retroflex diminutive (wánr, huàr). This is a
    // generative spelling rule, not a fixed list, so it is derived
    // here instead of being enumerated in rules.json.
    for (const syllable of manifest.syllables) {
      if (syllable !== 'er') {
        PINYIN_SYLLABLES.add(syllable + 'r');
      }
    }
    setRulesStatus('ready');
    scheduleValidation();
    return manifest;
  } catch (error) {
    setPinyinValidation(false);
    validationToggle.disabled = true;
    setRulesStatus('error');
    console.error('Unable to load embedded Pinyin rules:', error);
    throw error;
  }
}
function getInitialAndFinal(syllable) {
  const initials = pinyinRules.rules
    .flatMap((rule) => rule.initials || [])
    .sort((first, second) => second.length - first.length);
  const initial =
    initials.find((candidate) => syllable.startsWith(candidate)) || '';
  return { initial, final: syllable.substring(initial.length) };
}
function getRule(ruleId) {
  return pinyinRules.rules.find((rule) => rule.id === ruleId);
}
function getDiagnostic(syllable, ruleId = null, suggestion = '') {
  const normalized = normalizePinyin(syllable);
  const { initial, final } = getInitialAndFinal(normalized);
  const rule =
    (ruleId && getRule(ruleId)) ||
    pinyinRules.rules.find(
      (candidate) => candidate.initials.includes(initial) && initial && final,
    ) ||
    getRule('initial-final-table-mismatch');
  return { rule, syllable, initial, final: final || '∅', suggestion };
}
function interpolate(template, diagnostic) {
  return template.replace(
    /\{\{(initial|final|syllable|suggestion)\}\}/g,
    (_, key) => diagnostic[key],
  );
}
function findSyllableSegments(run) {
  const normalized = normalizePinyin(run);
  const best = Array(normalized.length + 1).fill(null);
  best[0] = [];
  for (let index = 0; index < normalized.length; index++) {
    if (!best[index]) {
      continue;
    }
    for (const syllable of PINYIN_SYLLABLES) {
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
    for (const syllable of PINYIN_SYLLABLES) {
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
// Walk text, calling callback(runStart, runEnd) for each maximal run of
// Pinyin characters (letters and toned vowels). Shared by every pass
// that scans the editor for syllable-level diagnostics.
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
        diagnostic: getDiagnostic(spelling, 'tone-mark-placement', suggestion),
      });
    }
  }
  const normalized = normalizePinyin(run);
  // Carry the run's tone mark over to a respelled suggestion so, for
  // example, iǒu suggests yǒu rather than a toneless you.
  const runTone =
    Array.from(run, (ch) => lookupChar(ch) % 5).find((value) => value > 0) || 0;
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
  if (zeroOnsetSuggestion && PINYIN_SYLLABLES.has(zeroOnsetSuggestion)) {
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
      PINYIN_SYLLABLES.has(initial + shortFinal)
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
    if (PINYIN_SYLLABLES.has(suggestionBase)) {
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
function suggestNearestSyllable(spelling) {
  const normalized = normalizePinyin(spelling);
  if (!normalized || normalized.length > 8) {
    return '';
  }
  const maxDistance = normalized.length <= 3 ? 1 : 2;
  const candidates = pinyinRules.syllables
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
    for (const syllable of PINYIN_SYLLABLES) {
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
function getInvalidPinyinRanges(text) {
  if (!pinyinValidationEnabled || !pinyinRules) {
    return [];
  }
  const invalid = new Set();
  const diagnosticsByStart = new Map();
  const compositionEnd = compStart === null ? null : editor.selectionStart;
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
      if (compStart === null || index < compStart || index >= compositionEnd) {
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
  if (!pinyinValidationEnabled || !pinyinRules) {
    return [];
  }
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
      const suggestion =
        run.substring(prev.start, curr.start) +
        '’' +
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
  if (!pinyinRules) {
    return [];
  }
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
// A separator between two Pinyin runs that keeps them adjacent for
// tone sandhi purposes: spaces, tabs, hyphens, and apostrophes.
// Anything else (sentence punctuation, newlines, digits, CJK) is a
// phrase break, so sandhi does not reach across it.
function isSandhiSeparator(separator) {
  return /^[ \t\-'’‘]+$/.test(separator);
}
// Tone sandhi hints: syllables whose pronounced tone differs from
// the written one. Covers third-tone pairs (nǐ hǎo → ní hǎo) and the
// tone changes of bù and yī. Only fires within and across fully
// valid Pinyin runs, using written tones as context so chains of
// three or more third tones resolve pairwise, right to left.
function getToneSandhiHints(text) {
  if (!pinyinValidationEnabled || !pinyinRules) {
    return [];
  }
  // Pass 1: a document-wide ordered list of syllables, spanning
  // run boundaries, each carrying whether it is adjacent to the
  // syllable before it.
  const syllables = [];
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
      syllables.push({
        start: runStart + segment.start,
        end: runStart + segment.end,
        syllable: segment.syllable,
        tone,
        adjacentToPrev,
      });
    });
    prevRunEnd = runEnd;
  });
  // Pass 2: apply the sandhi rules against written tones. Reading
  // the next syllable's written tone (rather than its already
  // sandhi-adjusted tone) makes the third-tone rule resolve
  // chains pairwise, right to left, in a single non-cascading
  // pass: wǒ hěn hǎo (3-3-3) becomes wó hén hǎo (2-2-3).
  const hints = [];
  for (let i = 0; i < syllables.length - 1; i++) {
    const curr = syllables[i];
    const next = syllables[i + 1];
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
function escapeHtml(text) {
  return text.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[ch],
  );
}
function hideDiagnostic() {
  pinnedDiagnostic = null;
  diagnosticCard.hidden = true;
  diagnosticCard.replaceChildren();
}
function scheduleDiagnosticHide() {
  clearTimeout(tooltipHideTimer);
  tooltipHideTimer = setTimeout(() => {
    if (!pinnedDiagnostic) {
      hideDiagnostic();
    }
  }, 120);
}
function renderDiagnosticCard(diagnostic) {
  const { rule } = diagnostic;
  const t = I18N[uiLang];
  const localizedTitle = rule.title[uiLang] || rule.title.en;
  const localizedExplanation = rule.explanation[uiLang] || rule.explanation.en;
  const sourceById = new Map(
    pinyinRules.sources.map((source) => [source.id, source]),
  );
  const sources = rule.sources.map((sourceId) => sourceById.get(sourceId));
  const suggestionLine =
    diagnostic.suggestion && !rule.explanation.en.includes('{{suggestion}}')
      ? `<p class="diagnostic-suggestion">${t.didYouMeanLabel} / 是不是想写: <strong>${escapeHtml(diagnostic.suggestion)}</strong>?</p>`
      : '';
  diagnosticCard.innerHTML = `
            <h2>${escapeHtml(localizedTitle)}</h2>
            <div class="diagnostic-zh"><strong>${escapeHtml(rule.title.zh)}</strong></div>
            <p>${escapeHtml(interpolate(localizedExplanation, diagnostic))}</p>
            <p class="diagnostic-zh">${escapeHtml(interpolate(rule.explanation.zh, diagnostic))}</p>
            ${suggestionLine}
            <p class="diagnostic-examples">${t.contrastLabel} / 对照: ${rule.examples.map(escapeHtml).join(', ')}</p>
            <div class="diagnostic-sources">${t.sourcesLabel} / 来源: ${sources
              .map(
                (source) =>
                  `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title[uiLang] || source.title.en)}</a>`,
              )
              .join(' · ')}</div>
        `;
}
function positionDiagnosticCard(target) {
  const rect = target.getBoundingClientRect();
  diagnosticCard.hidden = false;
  const cardRect = diagnosticCard.getBoundingClientRect();
  const left = Math.max(
    16,
    Math.min(rect.left, window.innerWidth - cardRect.width - 16),
  );
  const top =
    rect.bottom + cardRect.height + 12 <= window.innerHeight
      ? rect.bottom + 8
      : Math.max(16, rect.top - cardRect.height - 8);
  diagnosticCard.style.left = `${left}px`;
  diagnosticCard.style.top = `${top}px`;
}
function showDiagnostic(target, pinned = false) {
  clearTimeout(tooltipHideTimer);
  const start = Number(target.dataset.start);
  const end = Number(target.dataset.end);
  const diagnostic = getDiagnostic(
    editor.value.substring(start, end),
    target.dataset.ruleId || null,
    target.dataset.suggestion || '',
  );
  renderDiagnosticCard(diagnostic);
  if (pinned) {
    pinnedDiagnostic = target;
  }
  positionDiagnosticCard(target);
}
// Persist the current text as the user's draft.
function saveDraftIfChanged(text) {
  if (text === lastSavedDraft) {
    return;
  }
  lastSavedDraft = text;
  if (text) {
    localStorage.setItem('draft', text);
  } else {
    localStorage.removeItem('draft');
  }
}
// Encode UTF-8 text as URL-safe base64 (RFC 4648 §5, unpadded), so a
// shared link's hash needs no percent-encoding: pinyin's tone marks
// cost 6 characters apiece as %C7%90 etc. in plain UTF-8, but the
// same bytes cost under 2 characters apiece in base64.
function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
// The inverse of toBase64Url. Throws on malformed input; callers
// catch that to fall back to the saved draft.
function fromBase64Url(encoded) {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
// Read the shared text out of a location.hash-shaped string (leading
// '#' optional). Returns null when empty or malformed so callers can
// fall back to the saved draft.
function readSharedText(hash) {
  const encoded = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!encoded) {
    return null;
  }
  try {
    return fromBase64Url(encoded);
  } catch {
    return null;
  }
}
// Decide what should be in the editor on load: a shared link's text
// wins over the saved draft, but does not itself become the draft
// until the visitor edits it (so the draft stays safe).
function resolveInitialText(hash, storedDraft) {
  const shared = readSharedText(hash);
  if (shared !== null) {
    return { text: shared, fromShare: true };
  }
  return { text: storedDraft || '', fromShare: false };
}
// Build a shareable URL carrying the current text, base64url-encoded
// in the hash fragment. Not human-readable, but far shorter than the
// same text percent-encoded, and never sent to a server (fragments
// aren't included in HTTP requests).
function buildShareUrl(text, href) {
  const url = new URL(href);
  url.search = '';
  url.hash = text ? toBase64Url(text) : '';
  return url.href;
}
function renderValidation() {
  validationFrame = null;
  const text = editor.value;
  saveDraftIfChanged(text);
  const selectionStart =
    document.activeElement === editor ? editor.selectionStart : null;
  const selectionEnd =
    document.activeElement === editor ? editor.selectionEnd : null;
  const sandhiHints = getToneSandhiHints(text);
  const diagnosticRanges = [
    ...getInvalidPinyinRanges(text).map((range) => ({
      ...range,
      severity: 'invalid',
    })),
    ...getMissingApostropheDiagnostics(text).map((range) => ({
      ...range,
      severity: 'advisory',
    })),
    ...sandhiHints.map((range) => ({ ...range, severity: 'sandhi' })),
  ];
  const toneRanges = toneColoringEnabled ? getToneRanges(text) : [];
  // Tone sandhi always adjusts the underline/hover hint, but only
  // recolors the syllable when tone coloring is on; match by
  // start offset so a segmentation mismatch just skips the swap.
  const spokenToneByStart = new Map(
    sandhiHints.map((hint) => [hint.start, hint.spokenTone]),
  );
  for (const range of toneRanges) {
    if (spokenToneByStart.has(range.start)) {
      range.tone = spokenToneByStart.get(range.start);
    }
  }
  // Diagnostic ranges and tone ranges are drawn from independent
  // passes and can overlap (a syllable can be both an apostrophe hint
  // and tone-colored), so cut the text at every range boundary and
  // decide each resulting chunk's classes independently.
  const boundaries = new Set([0, text.length]);
  for (const range of diagnosticRanges) {
    boundaries.add(range.start);
    boundaries.add(range.end);
  }
  for (const range of toneRanges) {
    boundaries.add(range.start);
    boundaries.add(range.end);
  }
  if (selectionStart !== null && selectionStart !== selectionEnd) {
    boundaries.add(selectionStart);
    boundaries.add(selectionEnd);
  }
  const points = Array.from(boundaries).sort((a, b) => a - b);
  const severityClasses = {
    invalid: 'invalid-pinyin',
    advisory: 'advisory-pinyin',
    sandhi: 'sandhi-pinyin',
  };
  let html = '';
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (start === end) {
      continue;
    }
    const chunk = escapeHtml(text.substring(start, end));
    const diagnosticRange = diagnosticRanges.find(
      (range) => range.start <= start && range.end >= end,
    );
    const toneRange = toneRanges.find(
      (range) => range.start <= start && range.end >= end,
    );
    const isSelected =
      selectionStart !== null && selectionStart <= start && selectionEnd >= end;
    if (!diagnosticRange && !toneRange && !isSelected) {
      html += chunk;
      continue;
    }
    const classes = [];
    let attrs = '';
    if (diagnosticRange) {
      classes.push(
        'pinyin-diagnostic',
        severityClasses[diagnosticRange.severity],
      );
      attrs = ` data-start="${diagnosticRange.start}" data-end="${diagnosticRange.end}" data-rule-id="${escapeHtml(diagnosticRange.diagnostic.rule.id)}" data-suggestion="${escapeHtml(diagnosticRange.diagnostic.suggestion)}"`;
    }
    if (toneRange) {
      classes.push(`tone-${toneRange.tone}`);
    }
    if (isSelected) {
      classes.push('pinyin-selection');
    }
    html += `<span class="${classes.join(' ')}"${attrs}>${chunk}</span>`;
  }
  highlights.innerHTML = html;
  syncValidationScroll();
}
function scheduleValidation() {
  if (validationFrame === null) {
    validationFrame = requestAnimationFrame(renderValidation);
  }
}
function syncValidationScroll() {
  highlights.style.transform = `translate(${-editor.scrollLeft}px, ${-editor.scrollTop}px)`;
}
function setPinyinValidation(enabled) {
  pinyinValidationEnabled = enabled;
  validationToggle.setAttribute('aria-pressed', String(enabled));
  const t = I18N[uiLang];
  validationToggle.textContent = t.checkBtn;
  validationToggle.setAttribute(
    'aria-label',
    enabled ? t.checkOnAria : t.checkOffAria,
  );
  scheduleValidation();
}
function setToneColoring(enabled) {
  toneColoringEnabled = enabled;
  localStorage.setItem('toneColors', enabled ? 'on' : 'off');
  toneColorToggle.setAttribute('aria-pressed', String(enabled));
  const t = I18N[uiLang];
  toneColorToggle.textContent = t.toneColorsBtn;
  toneColorToggle.setAttribute(
    'aria-label',
    enabled ? t.toneColorsOnAria : t.toneColorsOffAria,
  );
  scheduleValidation();
}
// Find the last contiguous run of vowels in the string
// Returns {first: index, last: index} or null if no vowels found
function findLastVowels(str) {
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
function removeTone(str, first, last) {
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
function setTone(str, tone) {
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
// Re-tone the spoken syllable ending at the caret, if it belongs to a
// fully valid Pinyin run. Returns whether the digit was handled.
function retoneSyllableAtCaret(tone) {
  const { value: text, selectionStart: pos, selectionEnd } = editor;
  if (pos !== selectionEnd || pos === 0 || !isPinyinCharacter(text[pos - 1])) {
    return false;
  }
  let runStart = pos - 1;
  while (runStart > 0 && isPinyinCharacter(text[runStart - 1])) {
    runStart--;
  }
  let runEnd = pos;
  while (runEnd < text.length && isPinyinCharacter(text[runEnd])) {
    runEnd++;
  }
  const run = text.substring(runStart, runEnd);
  const segments = findSpokenSyllableSegments(run);
  if (segments.length === 0) {
    return false;
  }
  const caretOffset = pos - runStart;
  const segment = segments.find(
    ({ start, end }) => start < caretOffset && caretOffset <= end,
  );
  if (!segment) {
    return false;
  }
  const original = run.substring(segment.start, segment.end);
  const toned = setTone(original, tone);
  if (toned !== original) {
    replaceRange(runStart + segment.start, runStart + segment.end, toned);
  }
  return true;
}
// Handle the 'v' character (inserts ü, double-v for literal v). The case
// of the typed key decides ü vs Ü, so title-case words like Nǚshì keep a
// lowercase vowel after an uppercase initial.
function handleVCharacter(text, useUpper = false) {
  const lastChar = text.length > 0 ? text[text.length - 1] : '';
  if (lastChar === chr(0x00fc) || lastChar === chr(0x00dc)) {
    // Double-v: replace with a literal v matching the typed case
    return text.substring(0, text.length - 1) + (useUpper ? 'V' : 'v');
  }
  return text + chr(useUpper ? 0x00dc : 0x00fc);
}
// Get current composition text
function getCompositionText() {
  if (compStart === null) {
    return '';
  }
  return editor.value.substring(compStart, editor.selectionStart);
}
// Update the composition indicator
function updateIndicator() {
  if (compStart === null) {
    indicator.textContent = '';
    scheduleValidation();
    return;
  }
  const text = getCompositionText();
  indicator.textContent = I18N[uiLang].compositionPrefix + text;
  scheduleValidation();
}
// Commit the current composition
function commitComposition() {
  compStart = null;
  updateIndicator();
}
// Cancel the current composition (delete text)
function cancelComposition() {
  if (compStart === null) {
    return;
  }
  replaceRange(compStart, editor.selectionEnd, '');
  compStart = null;
  updateIndicator();
}
// Shift composition if it's too long
function shiftCompositionIfFull() {
  if (compStart === null) {
    return;
  }
  const text = getCompositionText();
  if (text.length < MAX_COMPOSITION_LENGTH) {
    return;
  }
  // Shift to keep last SHIFTED_COMPOSITION_LENGTH characters
  const shiftAmount = text.length - SHIFTED_COMPOSITION_LENGTH;
  compStart += shiftAmount;
  // Update indicator since composition changed
  updateIndicator();
}
// Handle keydown event
function handleKeyDown(e) {
  // Only handle keys without modifiers (except Shift)
  if (e.ctrlKey || e.altKey || e.metaKey) {
    if (compStart !== null) {
      // Commit composition on modifier key
      commitComposition();
    }
    return; // Let default handling proceed
  }
  const key = e.key;
  // Handle Enter
  if (key === 'Enter') {
    if (compStart !== null) {
      e.preventDefault();
      commitComposition();
    }
    // Otherwise let Enter through (inserts newline)
    return;
  }
  // Handle Escape
  if (key === 'Escape') {
    if (compStart !== null) {
      e.preventDefault();
      cancelComposition();
    }
    return;
  }
  // Handle Backspace
  if (key === 'Backspace') {
    if (compStart !== null) {
      const selStart = editor.selectionStart;
      const selEnd = editor.selectionEnd;
      // If there's a selection, delete it
      if (selStart !== selEnd) {
        e.preventDefault();
        replaceRange(selStart, selEnd, '');
        // If selection starts before compStart, composition is gone
        if (selStart < compStart) {
          compStart = null;
        }
        updateIndicator();
        return;
      }
      // Single character deletion
      if (selStart > compStart) {
        e.preventDefault();
        // Delete the character before caret
        replaceRange(selStart - 1, selStart, '');
        // Check if composition is now empty
        const compText = editor.value.substring(compStart, selStart - 1);
        if (compText.length === 0) {
          compStart = null;
        }
        updateIndicator();
        return;
      } else if (selStart === compStart) {
        // At start of composition, end composition
        e.preventDefault();
        commitComposition();
        return;
      }
    }
    // Otherwise let Backspace through
    return;
  }
  // Handle navigation keys that move caret (commit first)
  const navKeys = [
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'PageUp',
    'PageDown',
  ];
  if (navKeys.includes(key)) {
    if (compStart !== null) {
      commitComposition();
    }
    return;
  }
  // Handle letters A-Z
  if (
    key.length === 1 &&
    key !== 'v' &&
    key !== 'V' &&
    ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z'))
  ) {
    const selStart = editor.selectionStart;
    const selEnd = editor.selectionEnd;
    // Delete selection if any, then insert character
    replaceRange(selStart, selEnd, key);
    // Start composition if not already composing
    if (compStart === null) {
      compStart = selStart;
    } else {
      shiftCompositionIfFull();
    }
    updateIndicator();
    e.preventDefault();
    return;
  }
  // Handle tone digits 1-5
  if (compStart !== null && key >= '1' && key <= '5') {
    e.preventDefault();
    const selEnd = editor.selectionEnd;
    // Get composition text
    let text = getCompositionText();
    // Apply tone
    const tone = parseInt(key, 10);
    text = setTone(text, tone);
    // Replace composition with toned version and position cursor at end
    replaceRange(compStart, selEnd, text);
    // Commit after tone
    commitComposition();
    return;
  }
  // Re-tone an existing syllable when no composition is active.
  if (
    compStart === null &&
    key >= '1' &&
    key <= '5' &&
    retoneSyllableAtCaret(Number(key))
  ) {
    e.preventDefault();
    return;
  }
  // Handle other digits (0, 6-9) - swallow while composing
  if (compStart !== null && key >= '0' && key <= '9') {
    e.preventDefault();
    // Do nothing, just swallow the digit
    return;
  }
  // Handle v character
  if (key === 'v' || key === 'V') {
    const selStart = editor.selectionStart;
    const selEnd = editor.selectionEnd;
    if (compStart === null) {
      compStart = selStart;
    }
    // Delete selection if any
    if (selStart !== selEnd) {
      replaceRange(selStart, selEnd, '');
    }
    // Get current composition text
    let text = getCompositionText();
    // Handle v character
    const result = handleVCharacter(text, key === 'V');
    // Replace composition with result and position cursor at end
    replaceRange(compStart, compStart + text.length, result);
    // If result ends with a literal v (double-v case), commit
    if (/[vV]$/.test(result)) {
      commitComposition();
    } else {
      updateIndicator();
    }
    e.preventDefault();
    return;
  }
  // Handle other printable characters while composing
  if (compStart !== null && key.length === 1 && !key.startsWith('F')) {
    // Commit first, then let character through
    commitComposition();
  }
}
// Insert text using the same composition rules as physical keyboard input.
// Mobile virtual keyboards send characters through beforeinput rather than
// keydown, so keeping this logic shared makes tone conversion consistent.
function insertTextWithComposition(
  text,
  { commitBefore = true, commitAfter = true } = {},
) {
  if (commitBefore) {
    commitComposition();
  }
  const selStart = editor.selectionStart;
  const selEnd = editor.selectionEnd;
  replaceRange(selStart, selEnd, '');
  for (const key of text.replace(/\r\n?/g, '\n')) {
    if (
      key.length === 1 &&
      key !== 'v' &&
      key !== 'V' &&
      ((key >= 'a' && key <= 'z') || (key >= 'A' && key <= 'Z'))
    ) {
      const start = editor.selectionStart;
      replaceRange(start, editor.selectionEnd, key);
      if (compStart === null) {
        compStart = start;
      } else {
        shiftCompositionIfFull();
      }
      updateIndicator();
    } else if (compStart !== null && key >= '1' && key <= '5') {
      const textToTone = setTone(getCompositionText(), Number(key));
      replaceRange(compStart, editor.selectionEnd, textToTone);
      commitComposition();
    } else if (
      compStart === null &&
      key >= '1' &&
      key <= '5' &&
      retoneSyllableAtCaret(Number(key))
    ) {
      // The digit re-toned an existing syllable.
    } else if (compStart !== null && key >= '0' && key <= '9') {
      // Match typed input: ignore unsupported digits during composition.
    } else if (key === 'v' || key === 'V') {
      const start = editor.selectionStart;
      if (compStart === null) {
        compStart = start;
      }
      const composition = getCompositionText();
      const replacement = handleVCharacter(composition, key === 'V');
      replaceRange(compStart, compStart + composition.length, replacement);
      if (/[vV]$/.test(replacement)) {
        commitComposition();
      } else {
        updateIndicator();
      }
    } else {
      commitComposition();
      const start = editor.selectionStart;
      replaceRange(start, editor.selectionEnd, key);
    }
  }
  if (commitAfter) {
    commitComposition();
  }
}
// Pasted text is a complete insertion, so it should not remain active.
function insertPastedText(text) {
  insertTextWithComposition(text);
}
function handlePaste(e) {
  const text = e.clipboardData && e.clipboardData.getData('text/plain');
  if (text === undefined || text === null) {
    return;
  }
  e.preventDefault();
  insertPastedText(text);
}
// Virtual keyboards on iOS and Android usually do not emit useful
// keydown events. Intercept their plain-text insertions before the
// browser applies them and run them through the same converter.
function handleBeforeInput(e) {
  if (e.inputType !== 'insertText' || !e.data || e.isComposing) {
    return;
  }
  e.preventDefault();
  insertTextWithComposition(e.data, {
    commitBefore: false,
    commitAfter: false,
  });
}
// Handle selection changes (clicks, caret moves)
function handleSelectionChange() {
  scheduleValidation();
  if (compStart !== null) {
    const selStart = editor.selectionStart;
    const selEnd = editor.selectionEnd;
    // If caret is outside composition, commit
    if (
      selStart < compStart ||
      selEnd < compStart ||
      selStart > editor.value.length ||
      selEnd > editor.value.length
    ) {
      commitComposition();
    }
  }
}
// Handle mouse events (commit composition)
function handleMouseInteraction() {
  if (compStart !== null) {
    commitComposition();
  }
}
// Briefly replace a button's label (e.g. "Copied!") before restoring it.
// A pending flash's own original snapshot is reused on repeat clicks
// (with its restore timer reset) so a click during the flash window
// cannot capture the flashed state as the "original" to restore to.
const pendingButtonFlashes = new WeakMap();
function flashButtonLabel(btn, message) {
  const pending = pendingButtonFlashes.get(btn);
  if (pending) {
    clearTimeout(pending.timeoutId);
  }
  const original = pending
    ? pending.original
    : btn.classList.contains('icon-button')
      ? {
          content: btn.innerHTML,
          label: btn.getAttribute('aria-label'),
          title: btn.getAttribute('title'),
        }
      : { text: btn.textContent };
  if (btn.classList.contains('icon-button')) {
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>';
    btn.setAttribute('aria-label', message);
    btn.setAttribute('title', message);
  } else {
    btn.textContent = message;
  }
  const timeoutId = setTimeout(function () {
    pendingButtonFlashes.delete(btn);
    if (btn.classList.contains('icon-button')) {
      btn.innerHTML = original.content;
      btn.setAttribute('aria-label', original.label);
      btn.setAttribute('title', original.title);
    } else {
      btn.textContent = original.text;
    }
  }, 1500);
  pendingButtonFlashes.set(btn, { original, timeoutId });
}
// Copy button
copyBtn.addEventListener('click', function () {
  navigator.clipboard
    .writeText(editor.value)
    .then(function () {
      flashButtonLabel(copyBtn, I18N[uiLang].copyDone);
    })
    .catch(function (err) {
      console.error('Copy failed:', err);
    });
});
// Share button: copies a URL with the current text base64url-encoded
// in the hash fragment (not stored as the draft — see resolveInitialText).
shareBtn.addEventListener('click', function () {
  const url = buildShareUrl(editor.value, window.location.href);
  navigator.clipboard
    .writeText(url)
    .then(function () {
      flashButtonLabel(shareBtn, I18N[uiLang].shareDone);
    })
    .catch(function (err) {
      console.error('Share failed:', err);
    });
});
// Clear button
clearBtn.addEventListener('click', function () {
  editor.value = '';
  compStart = null;
  hideDiagnostic();
  updateIndicator();
  scheduleValidation();
});
validationToggle.addEventListener('click', function () {
  setPinyinValidation(!pinyinValidationEnabled);
});
toneColorToggle.addEventListener('click', function () {
  setToneColoring(!toneColoringEnabled);
});
setToneColoring(toneColoringEnabled);
// Detect the interface language (stored preference, else browser locale,
// defaulting to English) and apply it to the chrome strings above.
setLanguage(detectInitialLang());
// Restore a shared link's text (and strip it from the address bar so
// reloading or bookmarking doesn't keep re-sharing it) or, failing
// that, the draft saved from a previous visit.
const storedDraft = localStorage.getItem('draft') || '';
const initial = resolveInitialText(window.location.hash, storedDraft);
if (initial.text) {
  editor.value = initial.text;
}
// Seed lastSavedDraft with whatever is now on screen (not the old
// storedDraft) so the imminent initial renderValidation() call is a
// no-op: a shared link's text must not overwrite the saved draft
// until the visitor actually edits it.
lastSavedDraft = initial.text;
if (initial.fromShare) {
  const cleanUrl = new URL(window.location.href);
  cleanUrl.hash = '';
  history.replaceState(
    null,
    '',
    cleanUrl.pathname + cleanUrl.search + cleanUrl.hash,
  );
}
// A navigation that changes only the hash of an already-open
// document is treated as in-page by browsers and never re-runs
// this script (e.g. two shared links opened back-to-back in the
// same tab). Handle that case separately; unlike the startup
// load above, an absent or malformed hash here is a no-op, not
// a fallback to the stored draft, since it must not clobber
// whatever the visitor is already looking at.
window.addEventListener('hashchange', function () {
  const shared = readSharedText(window.location.hash);
  if (shared === null) {
    return;
  }
  compStart = null;
  editor.value = shared;
  lastSavedDraft = shared;
  hideDiagnostic();
  const cleanUrl = new URL(window.location.href);
  cleanUrl.hash = '';
  history.replaceState(
    null,
    '',
    cleanUrl.pathname + cleanUrl.search + cleanUrl.hash,
  );
  scheduleValidation();
});
// Event listeners
editor.addEventListener('keydown', handleKeyDown);
editor.addEventListener('beforeinput', handleBeforeInput);
editor.addEventListener('input', scheduleValidation);
editor.addEventListener('paste', handlePaste);
editor.addEventListener('scroll', syncValidationScroll);
editor.addEventListener('blur', scheduleValidation);
editor.addEventListener('mousedown', handleMouseInteraction);
document.addEventListener('selectionchange', handleSelectionChange);
highlights.addEventListener('pointerover', function (event) {
  const target = event.target.closest('.pinyin-diagnostic');
  if (target && !pinnedDiagnostic) {
    showDiagnostic(target);
  }
});
highlights.addEventListener('pointerout', function (event) {
  if (event.target.closest('.pinyin-diagnostic') && !pinnedDiagnostic) {
    scheduleDiagnosticHide();
  }
});
highlights.addEventListener('pointerdown', function (event) {
  const target = event.target.closest('.pinyin-diagnostic');
  if (target) {
    event.preventDefault();
    editor.focus();
    editor.setSelectionRange(
      Number(target.dataset.end),
      Number(target.dataset.end),
    );
  }
});
highlights.addEventListener('click', function (event) {
  const target = event.target.closest('.pinyin-diagnostic');
  if (!target) {
    return;
  }
  if (pinnedDiagnostic === target) {
    hideDiagnostic();
  } else {
    showDiagnostic(target, true);
  }
});
diagnosticCard.addEventListener('pointerenter', () =>
  clearTimeout(tooltipHideTimer),
);
diagnosticCard.addEventListener('pointerleave', () => {
  if (!pinnedDiagnostic) {
    scheduleDiagnosticHide();
  }
});
document.addEventListener('pointerdown', function (event) {
  if (
    pinnedDiagnostic &&
    !diagnosticCard.contains(event.target) &&
    !event.target.closest('.pinyin-diagnostic')
  ) {
    hideDiagnostic();
  }
});
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && pinnedDiagnostic) {
    hideDiagnostic();
  }
});
renderValidation();
loadPinyinRules(pinyinRulesManifest);
