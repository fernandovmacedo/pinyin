# Development guide

Pinyin Typing is a vanilla JavaScript single-page application built with Vite.
The production build is a single self-contained HTML file: it works on GitHub
Pages and when downloaded and opened directly with a browser.

## Repository layout

- `index.html` — the small Vite entry document and semantic page markup.
- `src/main.js` — the Vite module entry point; imports the stylesheet and `app.js`.
- `src/app.js` — application startup, DOM wiring, and editor behavior.
- `src/pinyin/engine.js` — pure Pinyin logic (tone-mark placement, syllable
  segmentation, diagnostics). No DOM access, so it is unit-testable without
  a browser; see `src/pinyin/engine.test.js` for per-syllable rule coverage
  and `src/pinyin/engine.fixtures.test.js` for hand-marked, realistic
  multi-syllable sentences.
- `src/share-link.js` — pure logic for encoding/decoding the "Share link"
  URL hash; see `src/share-link.test.js`.
- `src/styles/app.css` — editor styles.
- `src/data/rules.json` — the single source of truth for Pinyin knowledge.
- `src/rules/manifest.js` — rules manifest validation.
- `tests/` — Playwright browser tests.
- `vite.config.js` — production single-file build configuration.
- `favicon.svg` — source favicon, inlined into the production artifact.
- `sources/` — third-party reference documents that keep their original licenses.

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local URL. Use `npm run preview` to serve the production
build after `npm run build`.

## Quality checks

```sh
npm run format:check
npm run lint
npm run test:unit
npm test
npm run build
```

`npm run test:unit` runs the Node-native unit tests for the DOM-free pure
logic in `src/pinyin/engine.js` and `src/share-link.js` (`node --test`, no
new dependency); CI runs it too (see below). `npm test` runs the
Playwright browser tests with Google Chrome; in CI, Chrome is installed by
the workflow. Add browser scenarios under `tests/`; application code must
not include test-only URL modes or globals.

## The rules manifest contract

`src/data/rules.json` is bundled into the application at build time. To change
what the checker accepts or how it explains a mistake, edit that manifest—not
the JavaScript.

Top-level shape: `version`, `documentation`, `sources`, `syllables` (the
plain, toneless spellings of every valid syllable), optional
`marginalSyllables` (accepted spellings that receive a non-blocking regional
or nonstandard hint), and `rules` (the teaching rules shown in explanation
cards). Every marginal syllable must also appear in `syllables`.

`validateRulesManifest` runs at startup. Every source needs `id`, `url`,
and `title.en` / `title.zh`. Every rule needs `id`, `title.en` /
`title.zh`, `explanation.en` / `explanation.zh`, a non-empty `sources`
array referencing known source ids, an `initials` array (empty if the
rule is not initial-specific), and a non-empty `examples` array.
Portuguese (`pt`) titles and explanations are optional and fall back to
English.

## Build and deployment

`npm run build` writes exactly one file: `dist/index.html`. It contains the
application scripts, styles, manifest, and favicon, with no runtime fetches.
Commit that generated file so the repository always includes the downloadable
standalone application.

GitHub Actions checks formatting, linting, unit tests, browser tests, and
the build for every push and pull request. Successful pushes to `master`
deploy `dist/index.html` to GitHub Pages.
