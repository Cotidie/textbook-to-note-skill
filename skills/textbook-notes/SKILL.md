---
name: textbook-notes
description: 'Use when the user asks to summarize/distill a textbook chapter or subchapter (e.g. "ch4", "4.2") into a study note, asks follow-up questions to revise a note, appends chapters, or rebuilds note HTML. Distills dense, math-heavy textbook chapters (PDF) into Notion-style study notes with callouts, KaTeX math, gap-filled derivations, and Q&A blocks. Markdown source, self-contained offline HTML output, printable to PDF. Korean triggers - 전공서적 정리, 교과서 정리, 챕터 요약, 정리 노트, N장 정리, 서브챕터 정리, 이해 안 되는 부분 질문.'
---

# textbook-notes

Turn a textbook chapter (or subchapter) PDF into a study note styled after
a Notion export: TOC, heading hierarchy, callouts, server-rendered KaTeX
math, figures, and Q&A. Markdown is the source of truth; the deliverable
is one self-contained HTML file per chapter.

Read `references/note-style.md` BEFORE writing any note content. It defines
the callout vocabulary, writing rules, and figure pipeline. Notes target a
first-year engineering undergraduate: short sentences, standard
terminology, math kept exact.

## Layout (per book)

```
<project>/notebook/notes/<book-slug>/
  index.md          # book cover: chapter list + per-unit status (done/stub)
  chNN-<slug>.md    # one file per chapter
  figures/chNN/     # svg (redrawn) + png (cropped from source PDF)
  build/            # rendered html
```

## Modes

### generate <book.pdf> <unit> [language]

`<unit>` is a chapter or subchapter: `ch4`, `4.2`, `4.2.1`. Appending a
new chapter to an existing book is this same flow.
`[language]` defaults to English; write the note body in Korean if asked
(keep technical terms in English either way). A non-English note is a
parallel file `chNN-<slug>.<lang>.md` (e.g. `.ko.md`) next to the English
one, never a replacement; link both versions in index.md and cross-link
them in each note's header table. Callout titles follow the note language
(`::: goal 목표`); heading rules live in note-style.md.

1. Locate the unit's page range (see "Locating a unit" below).
2. Read those PDF pages with the Read tool (max 20 pages per call).
3. Write or extend `chNN-<slug>.md` following `assets/template.md` and
   `references/note-style.md`. When generating a subchapter only, keep all
   other sections as stub headings with the stub line from template.md.
4. Create figures (see note-style.md figure pipeline).
5. Update index.md status table.
6. Build (see build mode) and tell the user the output path.

### revise

The user asks about a part they do not understand, or requests a change.

1. Answer the question in chat first.
2. Patch the relevant section of the chapter .md: expand the derivation,
   add a `::: qa` block with the question and answer, or fix the wording.
3. Rebuild that chapter's HTML.

### build

```
node <skill-dir>/scripts/render.mjs <chapter.md>
```

`<skill-dir>` is this skill's directory (the folder containing this
SKILL.md); under a plugin install it is `${CLAUDE_PLUGIN_ROOT}/skills/textbook-notes`.

Writes `<dir>/build/<chapter>.html`. Rebuild every .md in the book
directory when the stylesheet or many files changed.

First run only: `cd <skill-dir>/scripts && npm install`.
If npm install fails, tell the user math will need a network connection,
and emit HTML that loads KaTeX from a CDN (auto-render extension) instead,
keeping the same body markup.

## Locating a unit in a large PDF

1. Try the book's TOC:
   `pdftotext -f 1 -l 15 -layout book.pdf - | grep -nE "^ *4(\.[0-9])* "`
2. If no TOC hit, scan page headers for the section number:
   `for p in $(seq 1 10 <pages>); do echo "== $p"; pdftotext -f $p -l $p -layout book.pdf - | head -4; done`
   then bisect manually.
3. Book page numbers usually differ from PDF page numbers. Find the offset
   from any page that prints its book page number, then convert.
4. If the unit cannot be found, show the user the TOC lines you did find
   and ask which unit they meant.
5. Scanned books with no text layer: fall back to Reading page images and
   warn that locating units is slower.

## Callout syntax (implemented by scripts/render.mjs)

Types: `goal`, `gap`, `proof`, `insight`, `qa`, `warning`, `summary`.
Color semantics and box criteria live in `references/note-style.md`;
`goal`/`summary` render as quiet bookends, the other five as boxes.

Equation cross-references: display equations carrying `\tag{N}` become
anchors; textual references like `(20)` in prose auto-link to them, with a
hover preview of the equation. Works across chapters of the same book via
`build/eq-map.json` (per language). Rebuild all chapters together; a
forward reference to a not-yet-rendered chapter needs a second build pass.

```
::: warning The trap of small eigenvalues
Body markdown, math allowed.
:::
```

Optional custom title after the type name; omit it for the default label.
