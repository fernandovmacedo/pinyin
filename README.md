# Pinyin Typing

No installation is needed—just visit [Pinyin Typing](https://fernandovmacedo.github.io/pinyin/) and start typing.
You can also save the page directly from that URL or open the committed
`dist/index.html` file in a browser; the application and its Pinyin rules are
embedded in that single file.

A standalone browser editor for typing Hanyu Pinyin with tone marks: type a syllable followed by its tone number, with `v` standing in for `ü`.

Type a Pinyin syllable followed by `1`, `2`, `3`, or `4` to apply a tone mark. To change an existing syllable's tone, place the caret on it and press `1`–`4`; press `5` to remove its tone mark for the neutral tone. Type `v` for `ü` and `V` for `Ü`; type `vv` for a literal `v`. Press Enter to accept the current syllable and Escape to cancel it. The editor works with physical and mobile virtual keyboards.

Pinyin checking is enabled by default and marks invalid syllables with a red wavy underline. It recognizes adjacent syllables such as `nǐhǎo` and erhua spellings such as `wánr`; use **Check** to turn validation off while writing non-Pinyin text. A teal underline, like the tone-sandhi hint, marks accepted regional or nonstandard syllables without treating them as errors. Hover an underline for an explanation with examples and sources, shown in the interface language alongside Chinese; click or tap it to keep the explanation open.

When a misspelling is close to exactly one valid syllable, the explanation adds a "Did you mean" suggestion — `qvn` suggests `qun`, and rule-aware corrections cover cases like tone marks on the wrong vowel, zero-onset spellings (`ie` → `ye`), and `ü` written after `j`, `q`, or `x`. If several syllables are equally close, no guess is made.

A dotted underline marks a missing apostrophe between two syllables, such as `haiou` where `hai'ou` was intended. It fires whenever a run of letters only parses as valid Pinyin by splitting it into multiple syllables with no separator. Where the same letters could be one syllable or several depending on tone — `xian` (one syllable) versus `xi'an` (two) — each syllable's own tone marks are what tells them apart.

Tone colors are enabled by default and tint each syllable by its tone number. Use the **Colors** toggle to turn them off.

The interface is available in English and Portuguese: it follows your browser language and can be switched at any time with the **EN**/**PT** button, which also switches the language of the checker's explanations.

Pasting text written with tone numbers (e.g. `Ni3 hao3! Wo3 jiao4 Li3 Ming2, hen3 gao1xing4 ren4shi ni3.`) converts it the same way as typing it.

Your text is saved automatically in this browser and restored on your next visit. **Share link** copies a URL with your current text packed into the hash fragment as compact base64 (not human-readable, but shorter than spelling out tone marks in a query string, and never sent to a server since fragments aren't part of an HTTP request) — open it to load that text into a fresh editor without disturbing your own saved draft.

## Pinyin rules

[`src/data/rules.json`](src/data/rules.json) holds the valid syllables, teaching explanations, examples, and citations. Its rules are based on the official Hanyu Pinyin Scheme and ISO 7098, with University of Iowa compatibility lessons and UT Austin pronunciation instruction used for learner-facing guidance. The explanations are original summaries of those sources, written in English, Chinese, and Portuguese.

For example, `Ni3 hao3! Wo3 jiao4 Li3 Ming2, hen3 gao1xing4 ren4shi ni3.` becomes `Nǐ hǎo! Wǒ jiào Lǐ Míng, hěn gāoxìng rènshi nǐ.` ("Hello! My name is Li Ming, nice to meet you." — all four tones plus the neutral tone.)

## Development

See [`AGENTS.md`](AGENTS.md) for how to run the editor locally, run the tests, and how the repository is laid out. `npm run build` creates a single self-contained `dist/index.html` that can be opened directly in a browser. GitHub Actions checks every push and pull request and deploys successful `master` builds to GitHub Pages.

## License

The code in this repository is released under the [MIT License](LICENSE). The documents in [`sources/`](sources/) are third-party materials that keep their original licenses — see [`sources/README.md`](sources/README.md) for the per-file details.
