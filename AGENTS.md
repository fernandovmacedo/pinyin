# Development guide

This is a single-page app with no build step. All application code — styles, editor logic, and the browser tests — lives inline in `index.html`. There are no runtime dependencies and nothing to install.

## Repository layout

- `index.html` — the entire editor: CSS, JavaScript, and the in-page test suite.
- `rules.json` — the single source of truth for Pinyin knowledge (see below).
- `test-runner.mjs` — a small Node script that serves the directory and runs the in-page tests in headless Chrome.
- `favicon.svg` — the site icon, referenced by `index.html` and deployed with it.
- `sources/` — third-party reference documents that keep their original licenses; not deployed.

## Run locally

The editor fetches `rules.json` at runtime, so it must be served over HTTP — opening `index.html` via `file://` fails the fetch and the checker never loads:

```sh
python3 -m http.server 8896
```

Then open [http://localhost:8896/](http://localhost:8896/).

## Tests

```sh
npm test
```

Requires a `google-chrome` binary on `PATH`. The tests themselves live inside `index.html`: loading the page with a `?test` query runs the in-page suite, which writes its result to a `data-test-result="passed:failed"` attribute on the DOM. `test-runner.mjs` starts a throwaway HTTP server, launches headless Chrome against `/?test`, dumps the DOM, and checks that attribute. To add or change tests, edit the test section of `index.html` — there is no separate test directory.

## The `rules.json` contract

`rules.json` is the single source of truth for valid syllables, teaching rules, examples, and citations. To change what the checker accepts or how it explains a mistake, edit `rules.json` — not the JavaScript.

Top-level shape: `version`, `documentation`, `sources`, `syllables` (the plain, toneless spellings of every valid syllable), and `rules` (the teaching rules shown in explanation cards).

`index.html` validates the manifest on load (`validateRulesManifest`) and refuses to start checking if it is malformed. Required fields:

- Every source needs `id`, `url`, and `title.en` / `title.zh`.
- Every rule needs `id`, `title.en` / `title.zh`, `explanation.en` / `explanation.zh`, and a non-empty `sources` array whose entries reference known source ids.
- Portuguese (`pt`) titles and explanations are optional and fall back to English, but keep all three languages in sync when editing.

Explanation templates may interpolate `{{syllable}}`, `{{initial}}`, `{{final}}`, and `{{suggestion}}`. If a rule's English explanation contains `{{suggestion}}`, the card suppresses the separate "Did you mean" line to avoid repeating the suggestion.

## Continuous integration and deployment

`.github/workflows/ci-pages.yml` runs the browser tests for every push and pull request. Pushes to `master` that pass the tests also deploy `index.html`, `rules.json`, and `favicon.svg` to GitHub Pages. If a new runtime asset is added, it must also be added to the workflow's "Prepare site files" copy step. Before the first deployment, set the repository's **Pages** source to **GitHub Actions** in its GitHub settings.
