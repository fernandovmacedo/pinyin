import pinyinRulesManifest from './data/rules.json';
import { validateRulesManifest } from './rules/manifest.js';
import {
  createPinyinEngine,
  setTone,
  isPinyinCharacter,
  handleVCharacter,
} from './pinyin/engine.js';
import {
  buildShareUrl,
  resolveInitialText,
  readSharedText,
} from './share-link.js';

// Wrap localStorage access: some browser privacy settings (e.g. Chrome's
// "Block all cookies") make every localStorage call throw a SecurityError,
// which would otherwise abort this module before it attaches a single
// event listener. Preferences and the draft just don't persist there.
function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore: storage unavailable.
  }
}
function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore: storage unavailable.
  }
}
// Theme handling
function setTheme(theme) {
  if (theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
    storageRemove('theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
    storageSet('theme', theme);
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
setTheme(storageGet('theme') || 'auto');
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
    checkOnAria: 'A checagem de Pinyin está ativada',
    checkOffAria: 'A checagem de Pinyin está desativada',
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
      '<strong>Checar Pinyin</strong> sublinha sílabas inválidas; desative ao escrever texto que não seja Pinyin',
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
  const stored = storageGet('lang');
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
  storageSet('lang', lang);
  applyLanguageStrings();
}
langToggle.addEventListener('click', function () {
  setLanguage(uiLang === 'pt' ? 'en' : 'pt');
});
const MAX_COMPOSITION_LENGTH = 50;
const SHIFTED_COMPOSITION_LENGTH = 20;
// rules.json is the single source of truth for valid syllables, teaching
// explanations, and citations. It is deliberately kept outside this file so
// linguistic content can be reviewed without changing editor behavior.
// pinyinRules is the raw manifest (needed for rendering, e.g. its
// `sources` list); engine wraps it with the derived syllable indices and
// diagnostic logic from pinyin/engine.js. Both stay null until
// loadPinyinRules succeeds.
let pinyinRules = null;
let engine = null;
// State
let compStart = null; // Start index of composition, or null if not composing
let pinyinValidationEnabled = true;
// Show tone colors by default; retain an explicit opt-out for returning users.
let toneColoringEnabled = storageGet('toneColors') !== 'off';
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
    engine = createPinyinEngine(manifest);
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
function interpolate(template, diagnostic) {
  return template.replace(
    /\{\{(initial|final|syllable|suggestion)\}\}/g,
    (_, key) => diagnostic[key],
  );
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
  const diagnostic = engine.getDiagnostic(
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
    storageSet('draft', text);
  } else {
    storageRemove('draft');
  }
}
function renderValidation() {
  validationFrame = null;
  const text = editor.value;
  saveDraftIfChanged(text);
  const selectionStart =
    document.activeElement === editor ? editor.selectionStart : null;
  const selectionEnd =
    document.activeElement === editor ? editor.selectionEnd : null;
  // compositionRange excludes the syllable being typed right now from
  // validation; checking mirrors the toggle plus "rules are actually
  // loaded" (loadPinyinRules runs after this function's first call).
  const compositionRange =
    compStart === null
      ? null
      : { start: compStart, end: editor.selectionStart };
  const checking = pinyinValidationEnabled && engine !== null;
  const sandhiHints = checking ? engine.getToneSandhiHints(text) : [];
  const diagnosticRanges = [
    ...(checking
      ? engine.getInvalidPinyinRanges(text, compositionRange)
      : []
    ).map((range) => ({ ...range, severity: 'invalid' })),
    ...(checking ? engine.getMissingApostropheDiagnostics(text) : []).map(
      (range) => ({ ...range, severity: 'advisory' }),
    ),
    ...sandhiHints.map((range) => ({ ...range, severity: 'sandhi' })),
  ];
  const toneRanges =
    toneColoringEnabled && engine !== null ? engine.getToneRanges(text) : [];
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
  storageSet('toneColors', enabled ? 'on' : 'off');
  toneColorToggle.setAttribute('aria-pressed', String(enabled));
  const t = I18N[uiLang];
  toneColorToggle.textContent = t.toneColorsBtn;
  toneColorToggle.setAttribute(
    'aria-label',
    enabled ? t.toneColorsOnAria : t.toneColorsOffAria,
  );
  scheduleValidation();
}
// Re-tone the spoken syllable ending at the caret, if it belongs to a
// fully valid Pinyin run. Returns whether the digit was handled.
function retoneSyllableAtCaret(tone) {
  if (!engine) {
    return false;
  }
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
  const segments = engine.findSpokenSyllableSegments(run);
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
  if (compStart !== null && key.length === 1) {
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
  // Dragging text into the editor is not run through the tone-number
  // converter, but it does splice editor.value directly at the drop
  // point without our knowledge. Commit any open composition first so
  // its compStart offset (an index into the old value) cannot end up
  // pointing at the wrong characters afterward.
  if (e.inputType === 'insertFromDrop') {
    if (compStart !== null) {
      commitComposition();
    }
    return;
  }
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
// Copy text to the clipboard. navigator.clipboard is only defined in
// secure contexts (https:, file:, localhost), so a copy of this page
// served over plain http: (e.g. shared on a LAN) would otherwise throw
// synchronously instead of rejecting the promise the callers expect.
// Fall back to the older execCommand('copy') path in that case.
function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    const scratch = document.createElement('textarea');
    scratch.value = text;
    scratch.style.position = 'fixed';
    scratch.style.opacity = '0';
    document.body.appendChild(scratch);
    scratch.focus();
    scratch.select();
    try {
      const done = document.execCommand('copy');
      done ? resolve() : reject(new Error('execCommand copy failed'));
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(scratch);
    }
  });
}
// Copy button
copyBtn.addEventListener('click', function () {
  copyTextToClipboard(editor.value)
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
  copyTextToClipboard(url)
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
const storedDraft = storageGet('draft') || '';
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
  updateIndicator();
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
