# textbook-to-note-skill

Claude Code skill that turns a math-heavy textbook chapter PDF into a Notion-style
study note. Markdown is the source; the deliverable is one self-contained offline
HTML file per chapter, printable to PDF.

## Features

- Callouts: `goal`, `gap`, `proof`, `insight`, `qa`, `warning`, `summary`
- Server-rendered KaTeX, so a note opens with no network
- `\tag{N}` equations become anchors; `(20)` in prose auto-links with a hover preview
- Symbol glossary: hover a defined symbol for its definition, click to jump to the entry
- Korean notes as parallel `chNN-<slug>.ko.md` files, cross-linked with the English one

## Install

### A. Plugin

```
/plugin marketplace add Cotidie/textbook-to-note-skill
/plugin install textbook-notes@textbook-to-note-skill
```

Update later with `/plugin marketplace update textbook-to-note-skill`.

### B. Copy

```bash
cp -a skills/textbook-notes ~/.claude/skills/
cd ~/.claude/skills/textbook-notes/scripts && npm install
```

Restart Claude Code after either route.

## Requirements

| Need | Why | If missing |
|---|---|---|
| Claude Code | host | required |
| Node.js 18+ | offline KaTeX | falls back to CDN KaTeX, notes then need network |
| `poppler-utils` | chapter lookup, figure crops | slower lookup, no cropping |
| Python + Pillow | figure crops | figures only |

`sudo apt install poppler-utils` or `brew install poppler`.

## Usage

Plain language triggers it, no command:

```
summarize ch4 of ~/books/deep-learning.pdf
4.2만 정리해줘
왜 여기서 eigenvalue가 작아지면 문제가 되는지 모르겠어   # revise
```

- **generate**: chapter or subchapter, English or Korean
- **revise**: answers in chat, patches the note, rebuilds
- **build**: `node skills/textbook-notes/scripts/render.mjs ch04-slug.md` writes `build/ch04-slug.html`

Rebuild a book's chapters together after a style change so cross-chapter equation
and symbol maps (`build/eq-map.json`, `build/sym-map.json`) resolve.

## Layout

```
notebook/notes/<book-slug>/     # output
  index.md                      # chapter list + per-unit status
  chNN-<slug>.md                # one file per chapter
  figures/chNN/                 # svg redraws + png crops
  build/                        # rendered html

skills/textbook-notes/          # the skill
  SKILL.md
  assets/style.css              # inlined into every note
  assets/template.md            # chapter skeleton
  references/note-style.md      # writing rules, callouts, figure pipeline
  scripts/render.mjs            # markdown -> self-contained html
```

## Development

```bash
cd skills/textbook-notes/scripts
npm install
node --test render.test.mjs
```

`node_modules/` is gitignored, `package-lock.json` is committed. Copy the skill
over again after editing it.
