# Note writing rules

## Language

Target: a first-year engineering undergraduate follows every paragraph on
the first read. Plain sentences, standard terminology, exact math. Simple
structure is not baby talk: never dumb down the terms, only the syntax.

- Body in plain English by default; Korean only when the user asks.
- Use the field's standard terms. Gloss each once in plain words at
  first use, then use the term alone. Never invent synonyms for a term
  of art; call defined quantities by their defined names (probability,
  not chance).
- Prefer common words for everything that is not a term of art: use, not
  utilize; enough, not sufficient; about, not approximately.
- One idea per sentence. No nested clauses: split them.
- Sentences under ~20 words. Paragraphs under 3 sentences.
- Active voice ("the buffer empties", not "the buffer is emptied").
- Cut filler: "basically", "in order to", "note that", "it is important".
- Never use an em-dash.
- Every symbol gets a plain-words name at first use ("r_u(i), the
  probability the upstream pseudo-machine is repaired in one step").
- Teach by example. After an abstract statement, give one tiny concrete
  case with numbers when possible.
- Read-aloud test: if you would stumble or re-read a sentence, break it up.
- Do not paraphrase the book's long paragraphs. Say the point in one or
  two short sentences and let the math carry the rest.
- Enumerations become lists: three or more parallel items, cases, or
  observations, and any paragraph that is really an enumeration
  ("first... also... finally"). A two-item sentence stays prose; never
  fragment connected reasoning into bullets.
- Bullets are fragments, not essays: one line each when possible, no
  trailing sub-clauses. Use numbered lists only when order matters.

## Storytelling

The note reads as one continuous story, not a stack of definitions.

- Unresolved-problem relay: every H2 opens by naming the problem the
  previous section (or chapter) left unsolved, and the chapter body ends
  by exposing the next unsolved problem before the takeaway. The chapter
  `goal` names the problem the previous chapter left open.
- Motivation before object: never open with a definition. First show the
  blocked need in 1-3 sentences ("we want X; Y blocks it"), then present
  the new object as the tool that unblocks it. If you cannot say why a
  definition is needed at this point of the story, it is in the wrong
  place.
- Hinge paragraphs: 1-3 plain sentences at section and concept
  boundaries connecting what just happened to what comes next. Hinges
  are prose, never bullets.
- Theorems are characters, not exhibits. Before (or right after) the
  statement, say in 1-3 sentences what role it plays in the chapter's
  story: which standing problem it settles, and where it gets used next
  ("this is the device that makes the claim checkable; the proof of
  Theorem 9 is its first application"). Never let a theorem statement
  stand bare. A theorem whose role you cannot state does not belong in
  the note.
- One running example per book, chosen at book start (e.g. "generate a
  dog photo") and touched at least once per chapter, so every abstract
  object lands on the same concrete task.
- Density limit: narrative lives in intros and hinges only. Derivations,
  properties, and enumerations stay bullets and display math. Total
  length may grow ~20-30% over a bare distillation, no more.

## Structure

- H1 chapter title, H2 sections, H3 subsections, H4 for mini-headers
  (plain bold, no decoration).
- Heading titles are the book's titles, verbatim: same numbering, same
  words, same capitalization. Never paraphrase, shorten, retitle, or
  translate them, even in translated notes (body in the target language,
  headings in the book's language). This covers H4 run-in headers the
  book has. Only headers you invent get your own title, still in the
  book's language. H1 format: `Ch.N - <exact book chapter title>`.
- Open each H2 section with a `::: goal` callout when the section solves a
  stated problem.
- Sections not yet distilled contain exactly the stub line shown in
  `assets/template.md`.

## Math

- Reproduce every load-bearing equation in display math, keeping the
  book's equation numbers in trailing tags like `\tag{4.4}`.
- Intuition outranks derivation. An equation is the formalization of an
  intuition that existed first; the body states that intuition, and
  multi-step algebra goes to `proof` boxes. Body answers "why should
  this be true" and "what does it do"; the box answers "how to show it".
- A derivation is a route, not a wall of algebra. Open every `gap` and
  `proof` box with a one-line strategy: where the derivation is headed
  and by what moves ("bound the tail, then let N grow"). Label each
  nontrivial step with what it accomplishes. The route and why it works
  are what survive after the algebra is forgotten.
- Right after each equation, add one short sentence saying what it means
  in plain words. Skip it only when the surrounding prose already does.
- Read load-bearing equations term by term: name the ROLE of each term
  or factor, i.e. what it pushes toward, penalizes, rescales, weights,
  or balances ("the drift pulls to 0, the noise pushes out", "the
  regularization term penalizes large parameters"). A term whose role
  you cannot name means the equation is not yet understood: dig, or
  mark it as an open question for revise mode.
- When the book jumps between two equations, restore the intermediate
  algebra inside a `::: gap` callout.
- Prefer aligned derivations (`\begin{aligned}`) over prose descriptions
  of algebra. Let the math talk; keep the prose around it short.
- Break wide equations into two or more `\begin{aligned}` lines instead of
  letting them scroll horizontally. Rough limit: if a display equation
  would not fit in about 80 characters of LaTeX terms, split it at an
  operator (=, +) with `\\` and align.
- Never start the paragraph after a display equation with a parenthesized
  number: `(6.6)에서 ...`. The renderer swallows it as that equation's
  number, which silently shifts every following equation anchor. Write
  `식 (6.6)에서 ...` (or "eq. (6.6)") instead.
- Math does not render inside `<figure>` blocks or in callout TITLES (the
  text after `::: gap`): both are emitted as raw text. Captions and callout
  titles use Unicode symbols (φ₀, σ, √v, Ωᵀ), never `$...$`. Math inside a
  callout BODY renders normally.

## Symbol glossary

Every chapter whose notation recurs gets `::: symbols` blocks. Each entry
becomes the hover definition and the click target for every inline
occurrence of that symbol, so:

- Place each block at the symbols' true first definition: usually right
  after the passage that introduces them. A section that introduces new
  symbols gets its own block there; never one big glossary at the top for
  symbols the reader has not met yet.
- Entry format: `- $latex$ : role in plain words`. One line, math allowed
  in the definition, no trailing period.
- Keys use the book's notation verbatim with its canonical index letter
  (`p_u(i)`, not `p_u(j)`). Occurrences with shifted or numeric indices
  (`p_u(i-1)`, `p_2`) match automatically; role subscripts (`u`, `d`,
  `s`, `b`) are literal, so `e_u` and `e_d` are separate entries.
- The box supplements, never replaces, the body rule that every symbol
  gets a plain-words name at first use. Do not turn body definitions into
  box-only definitions.
- Korean notes title the block `::: symbols 기호`; the default title is
  "Notation".

## Callouts

A callout box is an instruction to the reader, not decoration. Box a
block only when one of these holds; otherwise write prose:

- The reader will come back to it later (reference) → lavender.
- The reader may skip it on a first read (enrichment) → teal or ochre.
- The reader must not miss it (trap) → coral.

Never write provenance disclaimers, in boxes, body, or figure captions:
no "not in the book", "책에 없는 내용", "the book leaves this open",
"책이 다루지 않는 질문". The callout type and color already carry that
signal; the phrases are bookkeeping noise. Naming a concrete outside
source ("this is Tweedie's formula") is content and stays.

Compress boxes hard. A box states its point and stops; cut background
theory, named frameworks, and practical-treatment digressions the point
survives without. Deletion test: remove a sentence, and if the box still
answers its title, the sentence was padding. Depth arrives on request
through revise mode, never preemptively. (A `gap` or `proof` box carrying a
derivation is long because the derivation is; its prose still obeys this.)

Two things never get a box:

- Definitions and theorem STATEMENTS. They belong in the body prose; they
  are the note's core content, not an aside. Never re-define in a box what
  the body already defines. (Their multi-step PROOFS do get a box: `proof`.)
- Plain restatements of book content in easier words. Making the book
  easy IS the body's job.

Box types, by color:

- Lavender, deeper into the book than the body goes:
  - `gap`: anything the book skips over that the reader needs: restored
    derivations and proofs, bridging algebra between two equations,
    logical jumps and missed connections between statements, and
    sanity checks the book asserts without showing (counting arguments,
    dimension checks). Also use `gap` for a
    cross-chapter recap: when
    the body cites an equation from another chapter, restate it in a
    lavender box titled "Recap from Ch.N" so the page stands alone
    (hover previews do not survive print).
  - `proof` (dashed border): a multi-step proof or derivation the book
    DOES give. Boxing it marks "the conclusion matters; the chain is
    skimmable", so the reader can decide to skip or dive. The theorem
    statement and its meaning stay in the body; only the proof chain
    goes in the box. One-line proofs stay in the body. Rule of thumb:
    `gap` = what the book skips, `proof` = what the book gives but the
    reader may skip.
- Teal, beyond the book:
  - `insight`: content that needs knowledge from outside the chapter:
    applications, links to other chapters or fields, practice notes.
    Name the outside source ("this is Gauss-Seidel relaxation").
- Ochre, creative:
  - `qa`: a novel question with a full answer. Only questions whose
    answer is not already plain in the body; delete routine
    comprehension checks or fold them into prose. Counting/verification
    questions are `gap`, not `qa`.
  - Open questions you cannot resolve: a `qa` ending with the line
    "Open question, ask to revise." so revise mode finds them.
- Coral, signal:
  - `warning`: traps, common misreadings, conditions that silently
    matter. The only must-read box. Keep it rare: a few per chapter.

Quiet structural bookends (no box, do not count toward box rules):

- `goal`: the problem the chapter/section answers, right under the
  heading. Renders as a quiet opener (small uppercase label + bottom
  hairline).
- `summary`: 1-2 lines stating what the reader must remember. It closes
  what `goal` opened: goal asks the section's question up front, summary
  states the answer at the end. Never let one restate the other.
  Renders as a quiet footer (top hairline + small uppercase label).
  - Add it only to H2 sections with substantial technical content
    (derivations, equation sets, results).
  - Skip it for short orientation sections (exercise lists, notation,
    reference pointers) and whenever it would only repeat the goal.
  - One chapter-level block at the very end, titled "Chapter takeaway".
  - Never on H3 subsections. Never precede it with a `---` rule; its own
    top border is the separator.

Budget and spacing:

- `insight` + `qa` combined: at most 3 per H2 section. They are content
  you add; `gap` count follows what the book skips.
- A substantial H2 with no boxes is a smell: look again for a skipped
  derivation, an outside link, or a question worth asking. Fill the gap
  only when the box criteria above hold; never box filler.
- Never three boxes in a row. Two in a row only when their colors
  differ. Prefer prose between boxes.

## Figures

### When a figure is missing

A figure is warranted exactly when the body makes a claim the reader
would otherwise have to simulate in their head. After drafting a
section, sweep the text for these triggers; each hit is a figure
candidate:

- Shape claim: any shape adjective about a function, curve, or data
  ("U-shaped", "plateaus", "straight line on log-log") → plot the
  object.
- Evolution over a variable: "converges to", "approaches as n grows",
  quality over iterations → plot the family at several stages with the
  limit or target overlaid.
- Comparison or trade-off: "one shrinks as the other grows"
  (bias-variance, throughput-latency) → plot both on the same axes.
- Geometry claim: regions, boundaries, projections, embedding-space
  intuition → draw the space with the operation's direction marked.
- Structure and dataflow: components with something flowing between
  them (architectures, pipelines, memory layouts) → block diagram;
  label what flows.
- Execution trace: prose narrating state changing step by step (DP
  table filling, sort partitioning) → snapshots of the state at 2-3
  steps.
- Relation web: three or more concepts tied by transformations or
  implications across sections → one orientation diagram per chapter
  at most.
- Empirical artifact: what a trained model or real system actually
  produces (attention maps, generated samples, profiler output) →
  never redraw; crop or download (see source table below).
- Physical object or apparatus: photo or schematic.

Kill criteria, mirror of the callout rules: no figure for what a
formula already shows at a glance, none purely decorative, and if the
caption cannot cite the specific claim it illustrates, cut the figure.
Rough budget: 1-2 per H2, plus the chapter orientation diagram.

Tables use the same logic: three or more objects sharing two or more
attributes discussed in prose (distributions × mean/variance/mgf,
models × benchmark scores, algorithms × time/space complexity) →
comparison table instead of running text.

### Where it goes

- Directly AFTER the first claim it illustrates: after the display
  equation, theorem, or sentence that makes the shape/limit/comparison
  claim, before the next concept starts. Never ahead of the claim.
- Exception: a chapter orientation diagram goes right after the
  chapter goal, before the first H2.
- Never inside a bullet list; place it after the list closes.
- If a callout discusses the figure's content, the figure goes before
  that callout, so the callout can refer to it.
- Caption restates the claim, not the picture: "점프 크기가 P(X=x)다",
  not "cdf의 그래프이다".

### Figure sources

Pick the source per figure by figure TYPE, not by a fixed priority
order. Rule: whoever produces the most faithful image wins.

| Figure type | Source | Notes |
|---|---|---|
| Exists in the book or a paper the book cites; any empirical artifact (attention maps, generated samples, benchmark plots) | Crop from that PDF into `figures/chNN/fig-N-M.png` (command below) | Empirical artifacts are ALWAYS crops or downloads, never redraws: their value is being the real output |
| Curve or plot computable from a formula, toy data, or a small runnable example (pdf shapes, convergence plots, a toy attention heatmap) | matplotlib, saved as SVG | Note palette: transparent background, ink and brand-accent lines, no top/right spines |
| Nodes-and-arrows structure (block diagrams, architectures, pipelines, memory layouts, implication maps); execution-trace snapshots | Hand-authored SVG | Ink strokes, cream fills, one accent. Mermaid only when flowchart semantics fit |
| Photographs, real-world objects, 3D renderings, canonical images a redraw would degrade (a Galton board photo, a famous historical chart) | Web download into `figures/chNN/` | First-class source, not a fallback. Note the source domain in the caption. Notes are personal study; licensing is not a gate |
| Illustrative art with no factual content | codex-image skill | |

Crop command:
`pdftoppm -png -r 200 -f <pdfpage> -l <pdfpage> book.pdf /tmp/page`,
then crop with Python PIL.

Books with no figures at all (common for lecture notes): generate your
own where a picture carries real explanatory weight, still capped by
restraint (a few per chapter, each tied to a specific claim in the
body).

Verify every produced or downloaded image by Reading it.

### Captions and layout

- Every figure gets a caption: `<figure>` markdown image + italic caption
  line, numbered like the book (Figure 4.1) so revise requests can refer
  to them.
- Pair figures two per row with `<div class="fig-row">` around two
  `<figure>` blocks, ONLY when both hold:
  - They form a comparison series: same plot type and axes, varied
    parameter (N = 4 vs N = 8), or before/after.
  - Each stays legible at half width: portrait or square aspect, no dense
    small labels. Wide landscape plots with label clutter stay full width.
- Never pair figures discussed in separate, distant paragraphs.
  Maximum two per row.

## Faithfulness

- The note is a study companion, not a paraphrase dump: compress
  repetitive prose, keep every definition, every load-bearing equation,
  and every condition.
- Keep the book's notation exactly. Do not invent new symbols.
- Cite the source page range in the header table.
