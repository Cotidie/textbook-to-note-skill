# Pass 3: Visuals

Add the pictures from the handoff's list. A visual must make a specific claim easier to grasp. If its caption cannot state that claim, cut it.

## Choosing the tool

1. **An H2's core mechanism: animation, if it passes the test.** Test: would a static figure lose understanding? At most one per H2, or two when a section has two independent mechanisms. A section can have none. Scarcity is part of the impact, so everything else stays static.
2. **Exact geometry or a computed curve: matplotlib.** Equal lengths, right angles, ratios, plots from a formula. Image models do not keep these.
3. **Structure, relations, concept schematics, 3D scenes: image model.**
4. **Empirical results or real objects in a book or paper: crop or download.** Never redraw them.

## Animation (ManimGX)

Three beats: hold the start state, change one thing, hold the end state.

- Formula and picture move together. The changing term lights up in the accent color and a numeric readout tracks it.
- Use the book's notation. On-screen labels are in English. No sound.
- Each scene imports `assets/anim_kit.py`, which holds the palette, axes, beats, and covariance helpers. Start from `assets/anim-template.py`. Run every `manimgx` command with `PYTHONPATH=<skill-dir>/assets` so the import resolves wherever the skill is installed.
- Derive every moving object from one `ValueTracker` with `always_redraw`. 3-D positions are `[x, y, 0]`.

Pipeline, in `figures/chNN/`:

1. `PYTHONPATH=<skill-dir>/assets manimgx inspect anim-N-M.py <Scene> -t 0.5,5,end` (times in seconds), then Read the storyboard until the layout is clean. A text overlap reported at a caption swap is the fade, not a defect. 3-D scenes get no layout check, so look at every frame.
2. `PYTHONPATH=<skill-dir>/assets manimgx render anim-N-M.py <Scene> -r 1280x720 --fps 30 --crf 28 -o anim-N-M.mp4`. Keep each file under 2 MB.
3. Make the poster from the last frame. ManimGX drops duplicate frames, so index by frame count:
   ```
   N=$(ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of csv=p=0 anim-N-M.mp4)
   ffmpeg -y -loglevel error -i anim-N-M.mp4 -vf "select='eq(n,$((N-1)))'" -fps_mode vfr -frames:v 1 -update 1 anim-N-M.png
   ```
4. Delete the storyboard files.

```
<figure class="anim">
<video src="figures/chNN/anim-N-M.mp4" poster="figures/chNN/anim-N-M.png" autoplay muted loop playsinline controls></video>
<figcaption>Animation N.M: <what moves, and what in the formula moves with it></figcaption>
</figure>
```

The page plays a video from the top when it enters the screen and pauses it on leaving.

## Image model

Put prompts in `figures/chNN/image_prompts.py` as `FIGURES = {"fig-N-M-name": ("16:9", """...""")}`. The runner adds the shared style and removes the white background. It calls the `openrouter-images` skill, found through `OPENROUTER_IMAGES_DIR` or its usual install locations, and needs `OPENROUTER_API_KEY`.

```
uv run --no-project -q --with numpy --with pillow python <skill-dir>/scripts/make_images.py figures/chNN/image_prompts.py [name ...]
```

- Spell every label verbatim in quotes, with true subscripts. Say which side each label sits on.
- Describe geometry in relations ("its bottom side lies on the dashed line"). Use an oblique projection for 3D, so parallel lines stay parallel.
- The model is `openai/gpt-image-2.5-sunburst`. Compare with `discover.ts` when a newer one appears.

## Matplotlib

Add a function to `figures/chNN/make_figures.py` and run only that function, since a full run rewrites every SVG's metadata.

```
uv run --no-project -q --with matplotlib --with numpy python -c "import make_figures as figures; figures.mahalanobis()"
```

Use a transparent background, the palette from `anim_kit.py`, no top or right spines, `svg.fonttype: path`, and `mathtext.fontset: cm`.

## Placement

- Right after the claim it illustrates, and before any callout that discusses it. A chapter orientation diagram goes after the chapter `goal`.
- The caption states the claim, not the picture: "점프 크기가 P(X=x)다", not "cdf의 그래프이다". Number them by section: 그림 5.1a, Animation 5.2.
- Set a width when a figure would dominate the page.
- Two figures share a row (`<div class="fig-row">`) only when they compare the same axes.

## Check and finish

1. Read every generated image over the page color. Check labels against the prompt and geometry against the math. A wrong figure is worse than none.
2. Watch each video once in the built HTML.
3. Cut sentences the visuals now carry.
4. Delete `handoff.md`, update `index.md`, build with no KaTeX errors.
