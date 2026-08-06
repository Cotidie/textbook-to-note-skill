# textbook-to-note-skill

A Claude Code skill that turns a math-heavy textbook chapter PDF into a
Notion-style study note: TOC, callouts, server-rendered KaTeX math,
gap-filled derivations, figures, and Q&A blocks.

Markdown is the source of truth. The deliverable is one **self-contained
offline HTML file per chapter**, printable to PDF.

```
notebook/notes/<book-slug>/
  index.md            # book cover: chapter list + per-unit status
  chNN-<slug>.md      # one file per chapter (chNN-<slug>.ko.md for Korean)
  figures/chNN/       # svg (redrawn) + png (cropped from the source PDF)
  build/              # rendered html
```

## Install

Pick one route. The plugin route is the least maintenance; the symlink
route is right if you want to edit the skill and keep the edits in git.

### A. Plugin (recommended)

Inside Claude Code:

```
/plugin marketplace add Cotidie/textbook-to-note-skill
/plugin install textbook-notes@textbook-to-note-skill
```

Or from a shell:

```bash
claude plugin marketplace add Cotidie/textbook-to-note-skill
claude plugin install textbook-notes@textbook-to-note-skill
```

Restart Claude Code. The renderer's npm dependencies are not vendored;
the skill installs them itself the first time it builds a note. To do it
up front instead:

```bash
cd ~/.claude/plugins/cache/textbook-to-note-skill/textbook-notes/*/skills/textbook-notes/scripts
npm install
```

Updating later: `/plugin marketplace update textbook-to-note-skill`. The
cache directory is keyed by version, so a version bump lands in a fresh
directory and the dependencies install again on first use.

### B. Symlinked clone

```bash
git clone git@github.com:Cotidie/textbook-to-note-skill.git
cd textbook-to-note-skill
./install.sh
```

`install.sh` symlinks `skills/textbook-notes` into `~/.claude/skills/` and
runs `npm install`. Flags:

| Flag | Effect |
|---|---|
| *(none)* | symlink into `~/.claude/skills/textbook-notes` |
| `--copy` | copy instead of symlink (no clone to keep around) |
| `--deps` | only run `npm install`, do not touch `~/.claude/skills` |

An existing `~/.claude/skills/textbook-notes` is moved aside to
`~/.claude/skill-backups/textbook-notes.<timestamp>` rather than
overwritten. Set `CLAUDE_SKILLS_DIR` to install somewhere other than
`~/.claude/skills`.

### C. Manual

```bash
cp -a skills/textbook-notes ~/.claude/skills/
cd ~/.claude/skills/textbook-notes/scripts && npm install
```

Restart Claude Code after any route so the skill is picked up.

## Requirements

| Need | Why | If missing |
|---|---|---|
| Claude Code | host | required |
| Node.js 18+ and npm | server-rendered KaTeX, offline HTML | skill falls back to CDN-loaded KaTeX; notes then need a network connection to show math |
| `poppler-utils` (`pdftotext`, `pdftoppm`) | locate chapters in the PDF, crop figures | chapter lookup gets slower (page images), figure cropping unavailable |
| Python + Pillow | crop figures out of rendered pages | optional, figures only |

Install poppler: `sudo apt install poppler-utils` (Debian/Ubuntu),
`brew install poppler` (macOS).

## Usage

Ask in plain language; the skill triggers on the request, not a command.

```
summarize ch4 of ~/books/deep-learning.pdf
4.2만 정리해줘
왜 여기서 eigenvalue가 작아지면 문제가 되는지 모르겠어   # revise mode
```

Modes: **generate** (a chapter or subchapter, English or Korean),
**revise** (answer a question, then patch the note and rebuild), and
**build** (re-render HTML).

Build a chapter manually:

```bash
node <skill-dir>/scripts/render.mjs path/to/ch04-slug.md
# -> path/to/build/ch04-slug.html
```

Rebuild every chapter of a book together after a stylesheet change, so
cross-chapter equation references resolve via `build/eq-map.json`.

## Repo layout

```
.claude-plugin/
  marketplace.json     # marketplace manifest (plugin route)
  plugin.json          # plugin manifest, root is the plugin root
skills/textbook-notes/
  SKILL.md             # the skill itself
  assets/style.css     # inlined into every rendered note
  assets/template.md   # chapter skeleton
  references/note-style.md   # callout vocabulary, writing rules, figure pipeline
  scripts/render.mjs   # markdown -> self-contained html
  scripts/render.test.mjs
install.sh
```

`node_modules/` is gitignored; `package-lock.json` is committed, so
`npm install` reproduces the same renderer everywhere.

## Development

```bash
cd skills/textbook-notes/scripts
npm install
node --test render.test.mjs
```

With the symlink install, edits in this repo take effect immediately in
Claude Code.
