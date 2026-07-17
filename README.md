# Pinyin Typing

A standalone browser editor for typing Hanyu Pinyin with tone marks. The input convention (syllable + tone number, `v` for `ü`) follows the [PinyinTones](https://www.pinyintones.com/) Windows IME.

Type a Pinyin syllable followed by `1`, `2`, `3`, or `4` to apply a tone mark. Type `v` for `ü` and `V` for `Ü`; type `vv` for a literal `v`. Press Enter to accept the current syllable and Escape to cancel it.

The editor listens to physical keyboard events, so it needs a desktop browser; most mobile virtual keyboards will not trigger tone conversion.

Pinyin checking is enabled by default and marks invalid syllables with a red wavy underline. It recognizes adjacent syllables such as `nǐhǎo`; use **Check Pinyin** to turn validation off while writing non-Pinyin text. Hover an underline for a bilingual explanation, examples, and sources; click or tap it to keep the explanation open.

## Pinyin rules

[`rules.json`](rules.json) is the single source of truth for valid syllables, teaching explanations, examples, and citations. Its rules are based on the official Hanyu Pinyin Scheme and ISO 7098, with University of Iowa compatibility lessons and UT Austin pronunciation instruction used for learner-facing guidance. The explanations are original summaries of those sources.

For example, `Ni3 hao3! Wo3 jiao4 Li3.` becomes `Nǐ hǎo! Wǒ jiào Lǐ.`

## Run locally

The editor loads `rules.json` at runtime, so serve the directory over localhost rather than opening `index.html` directly:

```sh
python3 -m http.server 8896
```

Then open [http://localhost:8896/](http://localhost:8896/).

Run the browser tests headlessly (requires a `google-chrome` binary on `PATH`):

```sh
npm test
```

## Continuous integration and deployment

GitHub Actions runs the browser tests for every push and pull request. Pushes to
`master` that pass the tests also deploy this directory's `index.html` and
`rules.json` to GitHub Pages. Before the first deployment, set the repository's
**Pages** source to **GitHub Actions** in its GitHub settings.

## License

The code in this repository is released under the [MIT License](LICENSE). The documents in [`sources/`](sources/) are third-party materials that keep their original licenses — see [`sources/README.md`](sources/README.md) for the per-file details.
