# Development guide

Pinyin Typing is a vanilla JavaScript single-page application built with Vite.
The production build is a single self-contained HTML file: it works on GitHub
Pages and when downloaded and opened directly with a browser.

Use Node.js 22, which is the version used in CI. Install dependencies with
`npm ci` when working from the lockfile; use `npm install` only when changing
dependencies.

## Repository layout

- `index.html` — the small Vite entry document and semantic page markup.
- `src/main.js` — the Vite module entry point; imports the stylesheet and `app.js`.
- `src/app.js` — application startup, DOM wiring, and editor behavior.
- `src/share-link.js` — pure logic for encoding and decoding the **Share
  link** URL hash; see `src/share-link.test.js`.
- `src/pinyin/engine.js` — pure Pinyin logic (tone-mark placement, syllable
  segmentation, diagnostics). No DOM access, so it is unit-testable without
  a browser; see `src/pinyin/engine.test.js` for per-syllable rule coverage
  and `src/pinyin/engine.fixtures.test.js` for hand-marked, realistic
  multi-syllable sentences.
- `src/styles/app.css` — editor styles.
- `src/data/rules.json` — the single source of truth for Pinyin knowledge.
- `src/rules/manifest.js` — rules manifest validation.
- `tests/` — Playwright browser tests.
- `vite.config.js` — production single-file build configuration.
- `favicon.svg` — source favicon, inlined into the production artifact.
- `sources/` — third-party reference documents that keep their original licenses.
- `dist/index.html` — committed generated artifact. Do not edit it by hand;
  regenerate it with `npm run build`.

## Run locally

```sh
npm ci
npm run dev
```

Vite prints the local URL. Use `npm run preview` to serve the production
build after `npm run build`.

## Quality checks

Before handing off a change, run the checks below. Build before the browser
suite when application code, styles, or the manifest changed: one Playwright
scenario opens the committed `dist/index.html` through `file://`, so it must
exercise the current artifact.

```sh
npm run format:check
npm run lint
npm run test:unit
npm run build
npm test
```

`npm run test:unit` runs the Node-native unit tests for the DOM-free pure
logic in `src/pinyin/engine.js` and `src/share-link.js` (`node --test`, no
new dependency); CI runs it too (see below). `npm test` runs the Playwright
browser tests with Google Chrome. It tests both the Vite development server
and the generated `file://` artifact; in CI, Chrome is installed by the
workflow. Add browser scenarios under `tests/`; application code must not
include test-only URL modes or globals.

Use `npm run test:fixtures` to run only the realistic multi-syllable engine
fixtures, and `npm run test:watch` for Playwright's interactive UI.

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

Keep the manifest and its tests aligned: add pure-engine coverage for parsing,
diagnostics, or tone behavior, and add a browser scenario when a change affects
editor interaction or rendering. Source documents in `sources/` retain their
own licenses; update `sources/README.md` when adding one.

## Build and deployment

`npm run build` writes exactly one file: `dist/index.html`. It contains the
application scripts, styles, manifest, and favicon, with no runtime fetches.
Commit the regenerated file whenever its contents change so the repository
always includes the downloadable standalone application. Do not add runtime
asset fetches: direct `file://` use must work with only that one document.

GitHub Actions checks formatting, linting, unit tests, browser tests, and
then builds on every push and pull request. It fails if the committed
`dist/index.html` differs from the build output. Successful pushes to `master`
deploy `dist/index.html` to GitHub Pages.
