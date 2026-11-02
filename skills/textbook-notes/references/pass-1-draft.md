# Pass 1: Draft

Understand the chapter and write down everything that matters, accurately. Length and style do not matter here. Pass 2 cuts and rewrites.

## Steps

1. Locate the unit's pages. Try the book's table of contents: `pdftotext -f 1 -l 15 -layout book.pdf - | grep -nE "^ *4(\.[0-9])* "`. Book and PDF page numbers usually differ by an offset. A scan with no text layer must be read as page images. If the unit cannot be found, report the table-of-contents lines you did find.
2. Read every page of the unit with the Read tool, at most 20 pages per call. Equations extracted as text are often garbled, so check them against the page image.
3. Write `chNN-<slug>.ko.md` from `assets/template.md`, in Korean with technical terms in English.
4. Write `figures/chNN/handoff.md`.
5. Build from the book directory: `node <skill-dir>/scripts/render.mjs chNN-<slug>.ko.md`. Fix any KaTeX error.

## The draft contains

- Every definition, theorem statement, and condition.
- Every load-bearing equation in display math, with the book's number in `\tag{N}`.
- Steps the book skips, restored.
- Under each central equation, what each term is as a quantity, and why the terms combine that way.
- Each worked example, in a `::: example` block.
- The book's section titles as H2, and its notation verbatim.

## The handoff contains

- **Notation conflicts:** a symbol the book uses with two meanings, and where.
- **Doubts:** apparent book errors, and anything you could not verify.
- **Core claims:** per section, the one result the rest of the section serves.

## Not your job

No figures, no animations, no pruning, no polishing, no commits. Report back the note's path, its line count, and the number of display equations.
