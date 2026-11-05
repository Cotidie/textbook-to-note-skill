# Pass 2: Reshape

Turn the draft into something read like a newspaper. Work from the draft and the handoff. Open the PDF only to settle a specific doubt, so the book's page order does not steer the note.

## Steps

1. **Core claim:** for each H2, name the one result the section serves. Write `goal` as its question and `summary` as its answer.
2. **Order by hierarchy:** core result, its meaning, its picture, then proof and side results. Move a result ahead of its proof. Move a secondary topic below the main one, even when the book has them the other way round.
3. **Cut:**
   - Motivation that repeats the `goal`.
   - The same claim said twice across goal, body, caption, and summary.
   - Wrong-path explanations ("why the naive way fails"), unless it is a real trap. Then it is a `warning`.
   - Generic matrices spelled out with dots, when a concrete example shows the same thing.
   - Restated formulas, trivial boundary cases, verification-only proofs.
   - Meta-commentary about the book.
4. **Fold into `::: example`:** preconditions, secondary theorems, background from other fields, long proofs, application examples. One worked example per mechanism stays inline, when the body relies on its numbers.
5. **Rewrite** every remaining passage to `reading-rules.md`.
6. **Settle the handoff:** resolve each notation conflict and doubt, in the note or by checking the book.
7. **List visuals in the handoff:** every claim the reader would otherwise have to simulate in their head, with the claim stated in one line. Mark each section's core mechanism and give it two to four stages that show why it holds. Take them from the draft's derivation, one watchable change each ("slide a flipped copy across: the overlap area is the new density"). A stage list that only restates the result is unfinished.

## What must survive

Every definition and condition stays, in the body or in a fold. Every load-bearing equation stays. Folding is not deleting.

## Done

- Display equation count has clearly dropped from the draft.
- No label bullets, no lone bullets.
- The build has no KaTeX errors.
- Reading any H2 aloud, you never stumble or go back.
