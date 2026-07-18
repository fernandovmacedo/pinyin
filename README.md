# Pinyin Typing

A standalone browser editor for typing Hanyu Pinyin with tone marks. The input convention (syllable + tone number, `v` for `ü`) follows the [PinyinTones](https://www.pinyintones.com/) Windows IME.

No installation is needed—just visit [Pinyin Typing](https://fernandovmacedo.github.io/pinyin/) and start typing.

Type a Pinyin syllable followed by `1`, `2`, `3`, or `4` to apply a tone mark. Type `v` for `ü` and `V` for `Ü`; type `vv` for a literal `v`. Press Enter to accept the current syllable and Escape to cancel it.

The editor works with physical and mobile virtual keyboards. Type a syllable followed by its tone number to convert it.

Pinyin checking is enabled by default and marks invalid syllables with a red wavy underline. It recognizes adjacent syllables such as `nǐhǎo` and erhua spellings such as `wánr`; use **Check** to turn validation off while writing non-Pinyin text. Hover an underline for a bilingual explanation, examples, and sources; click or tap it to keep the explanation open.

A dotted underline marks a missing apostrophe between two syllables, such as `Xian` where `Xi'an` was intended. This only fires on text typed with its own tone marks, since that is what tells `Xi'an` (two syllables) apart from `xiàn` (one).

**Tone colors** is enabled by default and tints each syllable by its tone number. Use the toggle to turn it off.

Pasting text written with tone numbers (e.g. `Ni3 hao3! Wo3 jiao4 Li3 Ming2, hen3 gao1xing4 ren4shi ni3.`) converts it the same way as typing it.

## Pinyin rules

[`rules.json`](rules.json) is the single source of truth for valid syllables, teaching explanations, examples, and citations. Its rules are based on the official Hanyu Pinyin Scheme and ISO 7098, with University of Iowa compatibility lessons and UT Austin pronunciation instruction used for learner-facing guidance. The explanations are original summaries of those sources.

For example, `Ni3 hao3! Wo3 jiao4 Li3 Ming2, hen3 gao1xing4 ren4shi ni3.` becomes `Nǐ hǎo! Wǒ jiào Lǐ Míng, hěn gāoxìng rènshi nǐ.` ("Hello! My name is Li Ming, nice to meet you." — all four tones plus the neutral tone.)

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

The favicon uses Lucide's [Languages](https://lucide.dev/icons/languages) icon, licensed under the ISC License; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
