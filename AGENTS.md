# Repository guide

Pinyin Typing is a vanilla JavaScript/Vite SPA. Start with these files:

- `README.md` — product behavior and user-facing Pinyin conventions.
- `package.json` — development, formatting, lint, test, and build commands.
- `index.html`, `src/main.js`, `src/app.js`, `src/styles/app.css` — page markup,
  entry point, editor behavior, and presentation.
- `src/pinyin/engine.js`, `src/pinyin/*.test.js` — DOM-free Pinyin parsing,
  conversion, diagnostics, and coverage.
- `src/data/rules.json`, `src/rules/manifest.js` — Pinyin knowledge and its
  schema validation. Change accepted spellings and teaching content in the
  manifest, not in application code.
- `src/share-link.js`, `src/share-link.test.js` — share-hash codec.
- `tests/editor.spec.js`, `playwright.config.js` — browser behavior for both
  the development server and the standalone build.
- `vite.config.js`, `favicon.svg`, `dist/index.html` — single-file production
  build. `dist/index.html` is committed output; regenerate it with
  `npm run build` and never edit it directly.
- `sources/README.md`, `sources/` — third-party references and their licenses.
- `.github/workflows/ci-pages.yml` — Node version, required CI checks, artifact
  verification, and deployment.

The production artifact must remain one self-contained HTML file that works
over `file://`; do not introduce runtime asset fetches. Build before running
Playwright after changing application code, styles, or rules, because the suite
also exercises the committed `dist/index.html`.
