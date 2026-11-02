# textbook-to-note-skill

Claude Code skill that turns a math-heavy textbook chapter PDF into a study note
read like a newspaper: short sentence, equation, picture. Markdown is the source;
the deliverable is one self-contained offline HTML file per chapter, printable to PDF.

## Features

- Three passes per chapter: draft (accuracy), reshape (hierarchy, cuts, folds), visuals
- ManimGX animations, generated figures, and matplotlib plots, inlined into the HTML
- Callouts: `goal`, `summary`, `warning`, `insight`, folded `example`, and `qa` for revisions
- Server-rendered KaTeX, so a note opens with no network
- `\tag{N}` equations become anchors; `(20)` in prose auto-links with a hover preview
- Symbol glossary: hover a defined symbol for its definition, click to jump to the entry
- Korean by default with English technical terms, in `chNN-<slug>.ko.md`

## Passes

| Pass | Job | Runs as | Contract |
|---|---|---|---|
| 1 Draft | Accuracy and completeness | Fable subagent at `xhigh`, or Opus if unavailable | `references/pass-1-draft.md` |
| 2 Reshape | Hierarchy, intuition, cuts, folds | Main session | `references/pass-2-reshape.md` |
| 3 Visuals | Animations and figures | Main session | `references/pass-3-visuals.md` |

A chapter request runs all three without stopping and commits after each. `pass 2` or
`pass 3` reruns one pass on an existing note.

## Install

### A. Plugin

```
/plugin marketplace add Cotidie/textbook-to-note-skill
/plugin install textbook-notes@textbook-to-note-skill
```

Update later with `/plugin marketplace update textbook-to-note-skill`. Each update
lands in a new folder, so the first build after it reinstalls the renderer's npm packages.

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
| Node.js 18+ | HTML build, offline KaTeX | required |
| `poppler-utils` | chapter lookup, figure crops | slower lookup, no cropping |
| ManimGX, `ffmpeg` | animations | no animations |
| `uv` | runs the figure scripts with numpy, Pillow, matplotlib | no generated figures or plots |
| `openrouter-images` skill, `OPENROUTER_API_KEY` | image model figures | no image model figures |

`sudo apt install poppler-utils` or `brew install poppler`.
`gh skill install OpenRouterTeam/skills openrouter-images` installs the image skill. The
runner finds it in the project's or your `.claude/skills/`, or in the plugin cache. Set
`OPENROUTER_IMAGES_DIR` to its `scripts/` folder when it lives elsewhere.

Animations run as `PYTHONPATH=<skill-dir>/assets manimgx ...`, so they work from either
install route.

## Usage

Plain language triggers it, no command:

```
summarize ch4 of ~/books/deep-learning.pdf
4.2만 정리해줘
왜 여기서 eigenvalue가 작아지면 문제가 되는지 모르겠어   # revise
```

- **generate**: chapter or subchapter, through all three passes
- **revise**: answers in chat, patches the note, rebuilds
- **build**: from the book directory, `node <skill-dir>/scripts/render.mjs chNN-<slug>.ko.md` writes `build/chNN-<slug>.ko.html`

Rebuild a book's chapters together after cutting symbols, because a rebuild replaces
that chapter's entries in `build/sym-map.json`. Entries in `build/eq-map.json` stay, so
prose citing a cut equation keeps its hover preview.

## Layout

```
<notes>/<book-slug>/            # output
  index.md                      # chapter list with status
  chNN-<slug>.ko.md             # one file per chapter
  figures/chNN/                 # handoff.md (during passes), image_prompts.py,
                                # make_figures.py, anim-N-M.{py,mp4,png}
  build/                        # rendered html, eq-map.json, sym-map.json

skills/textbook-notes/          # the skill
  SKILL.md
  assets/style.css              # inlined into every note
  assets/template.md            # chapter skeleton
  assets/anim_kit.py            # palette, axes, beats, covariance helpers
  assets/anim-template.py       # starting point for a scene
  references/pass-*.md          # one contract per pass
  references/reading-rules.md   # writing rules for passes 2 and 3
  scripts/render.mjs            # markdown -> self-contained html
  scripts/make_images.py        # image model batch runner
```

## Development

```bash
cd skills/textbook-notes/scripts
npm install
node --test render.test.mjs
```

`node_modules/` is gitignored, `package-lock.json` is committed. Copy the skill
over again after editing it.
