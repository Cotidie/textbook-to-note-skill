---
name: textbook-notes
description: 'Use when the user asks to summarize/distill a textbook chapter or subchapter (e.g. "ch4", "4.2") into a study note, asks follow-up questions to revise a note, appends chapters, or rebuilds note HTML. Turns dense, math-heavy textbook chapters (PDF) into study notes read like a newspaper, through three passes: accurate draft, reshape, visuals (ManimGX animations and generated figures). Markdown source, self-contained offline HTML output, printable to PDF. Korean triggers - 전공서적 정리, 교과서 정리, 챕터 요약, 정리 노트, N장 정리, 서브챕터 정리, 이해 안 되는 부분 질문.'
---

# textbook-notes

Turn a textbook chapter PDF into a study note the reader takes in like a newspaper: short sentence, equation, picture. Markdown is the source. Each chapter builds to one self-contained HTML file. Notes are in Korean unless the user asks otherwise, with technical terms in English.

## Passes

A chapter request runs all three passes without stopping, commits after each, and asks for review only at the end. "pass 2" or "pass 3" reruns one pass on an existing note. A subchapter request (`4.2`) runs the same passes on that unit.

| Pass | Job | Reads | Writes | Runs as | Contract |
|---|---|---|---|---|---|
| 1 Draft | Accuracy and completeness | PDF | note, `figures/chNN/handoff.md` | `Agent` with `model: "fable"`, `effort: "xhigh"` | `references/pass-1-draft.md` |
| 2 Reshape | Hierarchy, intuition, cuts, folds | Draft, handoff | Note, visuals list in handoff | Main session | `references/pass-2-reshape.md` |
| 3 Visuals | Animations and figures | Note, handoff | `figures/chNN/`, HTML, `index.md` | Main session | `references/pass-3-visuals.md` |

Passes 2 and 3 also follow `references/reading-rules.md`. Pass 1 does not read it.

The Pass 1 brief is the PDF path, the unit, the output paths, and "read and follow `<skill-dir>/references/pass-1-draft.md`; spawn no sub-agents". Report its token use to the user. If Fable is unavailable, use `opus` at `xhigh` and say so.

## Layout

```
<notes>/<book-slug>/
  index.md            # chapter list with status
  chNN-<slug>.ko.md
  figures/chNN/       # handoff.md (during passes), image_prompts.py, make_figures.py, anim-N-M.{py,mp4,png}
  build/              # rendered html, eq-map.json, sym-map.json
```

## Revise

The user asks about a part they do not understand, or requests a change.

1. Answer in chat first.
2. Patch the note: fix the wording, or add a `::: qa` block with the question and answer.
3. Rebuild.

## Build

Run from the book directory:

```
node <skill-dir>/scripts/render.mjs chNN-<slug>.ko.md
```

When `<skill-dir>/scripts/node_modules` is missing (first run, or after a plugin update), run `cd <skill-dir>/scripts && npm install` first. Equation and symbol maps are per book, so a forward reference to an unbuilt chapter needs a second build. A rebuild replaces that chapter's symbol map entries, so after cutting symbols, rebuild the other chapters too. Equation map entries stay, so prose citing a cut equation keeps its hover preview. The build prints a warning when a KaTeX error remains.

## Markdown syntax

Start from `assets/template.md`.

```
::: goal 목표
::: summary
::: warning <title>
::: insight <title>
::: example <title>     (folded by default)
::: symbols 기호         (- $latex$ : one-line definition)
```

Existing notes also use `gap` and `proof`, which still render. Use `qa` only in revise.

- **Equation references:** a display equation with `\tag{5.2-11}` becomes an anchor. Prose `(5.2-11)` links to it with a hover preview.
- **Symbols:** each `::: symbols` entry gives hover and click-to-jump on every occurrence, book-wide. A bare letter, with or without an index (`J`, `Y_k`), resolves only inside its own chapter. `Y_k` also attaches to `Y_1` and `Y_i` there, so skip a letter whose meaning changes within the chapter.
- **Figure width:** `<img style="width:60%" src="...">`.

Traps the renderer does not catch:

- Math does not render in `<figure>` captions or callout titles. Use Unicode (φ₀, σ, Ωᵀ).
- A math span ending in `=` (`$z = $`) swallows the prose after it.
- `\dot\kappa_t` breaks when `\kappa_t` is a symbols key. Write `\dot{\kappa}_t`.
- Multiple `\tag` in one `aligned` block is a KaTeX error.
