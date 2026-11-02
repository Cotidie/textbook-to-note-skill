# Reading rules

The reader takes in the note like a newspaper: one read, no re-reading, fast intuition. When a rule below gets in the way of that, drop the rule.

## Rhythm

Short sentence, equation, short sentence, picture.

- One idea per sentence, about 20 words at most. Paragraphs of one to three sentences.
- Say why a thing is needed in one sentence before presenting it. Never open with a definition.
- An equation's meaning goes in one or two plain sentences right under it, with no label. No `**읽기**`, `**직관**`, or `**전략**` bullets.
- Bullets only for three or more parallel items. A lone bullet is prose.
- Do not start the sentence with what the book says. No "책에 없는 내용" or other provenance remarks.

## Words

- Use the field's standard terms. Write the English in parentheses at the first use of a translated term.
- Give every symbol a plain name at first use ("guidance 변수 $y$", not "$y$").
- Say what each term of a central equation IS, as a quantity the reader can picture and count, then why the terms combine that way. "Number of jobs ahead of me × time per job" explains. "Utilization term × time term" does not.

## Math

- Keep the book's notation and equation numbers, except where one symbol has two meanings: then give it one meaning and say so in the final report.
- Newspaper test: cut a display equation the reader would skip. Candidates are a restated formula, a trivial boundary case, and an n-fold integral spelled out with dots.
- Prefer the 1-D case first when the n-D derivation is the same moves.
- Use readable numbers. Replace cluttered book examples with the smallest clean instance. No "check by hand" bullets.
- No `\frac` in inline math. Break wide equations with `aligned`.

## Structure

- H1 is `Ch.N - <book title>`. H2 uses the book's section titles verbatim, in English. H3 is free: use the book's wording when it fits.
- An H2 opens with `goal` (one question) and closes with `summary` (its answer, one or two lines). The chapter ends with `## Summary` and `::: summary Chapter takeaway`.
- A `::: symbols` block goes at the end of the H2, before `summary`, with recurring symbols only.
- One running example per book, used wherever it helps.

## Boxes

- `warning`: a trap the reader must not miss. Rare.
- `insight`: outside knowledge, naming its source ("this is PCA").
- `example`: anything skippable, folded. Its title is a noun phrase.
- Never box a definition or a theorem statement. Never box a restatement of the body.
