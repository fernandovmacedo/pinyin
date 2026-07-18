# Pinyin Typing

[Open Pinyin Typing](https://fernandovmacedo.github.io/pinyin/) — a standalone
browser editor for writing Hanyu Pinyin with tone marks. Type a syllable and
its tone number; use `v` for `ü`.

No installation is needed to use the editor. You can visit the hosted version,
save that page, or open the committed `dist/index.html` directly in a browser.
The application and its Pinyin rules are embedded in that one file.

## Typing Pinyin

| Input                                        | Result                                     |
| -------------------------------------------- | ------------------------------------------ |
| A syllable followed by `1`, `2`, `3`, or `4` | Adds the corresponding tone mark           |
| `5` with the caret on a syllable             | Removes its tone mark for the neutral tone |
| `v` / `V`                                    | `ü` / `Ü`                                  |
| `vv`                                         | A literal `v`                              |
| Enter                                        | Accepts the current syllable               |
| Escape                                       | Cancels the current syllable               |

You can also place the caret on an existing syllable and press `1`–`4` to
change its tone. Pasting text written with tone numbers converts it too, so
`Ni3 hao3!` becomes `Nǐ hǎo!`. The editor works with physical and mobile
virtual keyboards.

## Pinyin feedback

Pinyin checking is on by default. Use **Check** to turn it off while writing
non-Pinyin text.

- A red wavy underline marks an invalid syllable. The checker recognizes
  adjacent syllables such as `nǐhǎo` and erhua spellings such as `wánr`.
- A dotted underline suggests a missing or unnecessary apostrophe, such as
  `haiou` or `Zhōng'guó`. Tone marks distinguish ambiguous cases such as
  `xian` (one syllable) and `xi'an` (two).
- A teal underline is a non-blocking tone-sandhi pronunciation hint.
- A purple underline is a non-blocking accepted regional or nonstandard
  syllable.

Hover an underline to see an explanation, examples, and sources; click or tap
it to keep the explanation open. A single close spelling can also receive a
**Did you mean** suggestion—for example, `qvn` suggests `qun`. Rule-aware
suggestions cover misplaced tone marks, zero-onset spellings (`ie` → `ye`), and
`ü` after `j`, `q`, or `x`.

## Preferences, saving, and sharing

- **Colors** tints each syllable by its tone; it is enabled by default.
- Choose the system, light, or dark theme from the header. The interface is
  available in English and Portuguese and follows your browser language until
  you change it with the **EN**/**PT** button.
- Your text and preferences are saved in the browser and restored on your next
  visit. The editor still works when browser storage is unavailable, but cannot
  retain the draft or preferences.
- **Share link** copies a URL that stores your current text as compact base64
  in its hash fragment. The fragment is not sent to a server; opening the link
  loads its text without replacing the recipient's saved draft.

## Example

Type:

```text
Ni3 hao3! Wo3 jiao4 Li3 Ming2, hen3 gao1xing4 ren4shi ni3.
```

It becomes:

```text
Nǐ hǎo! Wǒ jiào Lǐ Míng, hěn gāoxìng rènshi nǐ.
```

“Hello! My name is Li Ming, nice to meet you.” The example includes all four
tones and the neutral tone.

## Pinyin rules

[`src/data/rules.json`](src/data/rules.json) is the single source of truth for
valid syllables, teaching explanations, examples, and citations. Its rules are
based on the official Hanyu Pinyin Scheme and ISO 7098, with University of Iowa
and UT Austin material used for learner-facing guidance. The explanations are
original summaries in English, Chinese, and Portuguese.

## Development

See [`AGENTS.md`](AGENTS.md) for the local workflow, test suites, repository
layout, and contribution requirements. `npm run build` creates the standalone
`dist/index.html`; commit the regenerated artifact with source changes so the
repository remains downloadable. GitHub Actions checks each push and pull
request, then deploys successful `master` builds to GitHub Pages.

## License

The code in this repository is released under the [MIT License](LICENSE).
Documents in [`sources/`](sources/) are third-party materials that keep their
original licenses; see [`sources/README.md`](sources/README.md) for details.
