Shehroz Sajjad builds AI that has a presence: a face you can video-call, a voice that makes real phone calls, a body on a desk. He designs it, engineers it, wires it, films it and scores it himself. The brand presents him as three things, in this order: **an experimenter, a problem solver, a polymath.** It never presents him as a character, a mascot or a single product.

## The idea: the edit

Everything in this system comes from one place Shehroz actually works: the editing timeline. Film, music, animation and scroll-driven sites all run on the same parts: lanes, clips, a playhead and timecode. A timeline also proves the polymath claim at a glance. Most builders fill one lane. His projects run across five.

- **Lanes are disciplines.** Always these five, in this order: `Design`, `Code`, `Hardware`, `Film`, `Sound`. A project is a clip on every lane he worked in. Use the **Multitrack** component to show it.
- **The playhead is the mark.** The logo's mark is a playhead. On the site it is a 2px `signal` line that marks what is current: the active project, the scroll position, the moment in a video.
- **Every build is an experiment.** Number projects in the order they shipped, `EXP-001` upward, and keep the number forever. Durations and clock readouts use timecode (`00:00:42:12`). These come from his practice, so set them in `label` and `timecode`, never in the display face.
- **Every project is a solved problem.** Present each one in the same three beats: *Problem*, *Built*, *Result*. If there is no real result yet, leave that beat empty. Never invent one.

## Voice

Write like an engineer showing a friend something he built last night: first person, plain words, a little contrarian, honest about what broke.

- Sentence case everywhere, including buttons and headings. No title case, no all caps except `label` text.
- Show, then say. Lead with the real moment, then explain it.
- Personal reasons first: German phone calls, Munich flat hunting, editing reels by hand.
- Light humour is allowed. Hype is not.
- Never use: leveraging, cutting-edge, passionate, revolutionary, seamless, game-changer. No emoji. No exclamation marks.
- Never invent metrics, testimonials or outcomes.

Real lines to model on:

> I give AI a presence.
> I built an agent that makes my German phone calls. It waits on hold, says it's an AI, and books the table.
> A robot on my desk with my face on it, which is a longer story.
> Walking was the hardest part.
> One email when I ship something. That's it.

## Color

Neutral paper and ink carry almost everything. One accent, `signal` (ultramarine), means *now, here, this one*. A second dark ground, `stage`, holds all footage.

- Page ground is `paper`. Cards sit on `paper-raised` with a `line` border.
- Text is `ink`, metadata is `ink-muted`. Both read on `paper` and `paper-raised` in both themes.
- Use `signal` for only one thing per area: the playhead, the active clip, the primary button, a link, a markup stroke, the focus ring. If two things on screen are `signal`, one of them is wrong.
- Footage, reels and scroll-scrubbed sequences sit on `stage` in both themes, with `on-stage` captions. On stage, use `stage-signal` for the playhead and progress, never `signal`.
- `live` is only ever a dot, next to the word LIVE.
- Never use yellow as an accent, never gradients, never a colour per discipline. Lanes are told apart by their label and position, not hue.

## Type

- **Instrument Sans** is the voice. Use `display-xl` for the homepage thesis only, `display` for project names and section openers, and `title` for cards. Headlines are 600 weight with tight tracking. Never use a lighter weight for display.
- **Instrument Serif italic** (`accent`) is the one human word in a display line, shared with the reels. Use it at most once per screen: "I give AI a *presence*."
- **JetBrains Mono** (`label`, `timecode`) is for what a machine would print: experiment numbers, lanes, dates, stacks, timecodes, frame counts. Uppercase `label` with its letter spacing. Use tabular numbers for anything that ticks.
- Captions over footage use `caption`: Instrument Sans 600, sentence case, `on-stage` on a `stage` scrim. This matches the reels' captions-on rule.
- No handwriting faces, no condensed poster faces, no Inter.

## Layout

- A 12-column grid, 1200px max, with a gutter of at least `space-4` and a section rhythm of `space-24` (`space-16` on phones).
- Left-aligned, always. Display lines hang on the left edge. Metadata runs in a single mono line above or below the thing it describes.
- Footage runs large: a project's reel or sequence gets at least half the width on desktop and full bleed on phones.
- Corners: `radius-frame` for media and cards, `radius-clip` for clips, chips and inputs, `radius-pill` for buttons. Nothing else is rounded.
- Separate with `line` hairlines and space, not shadows. `lift` appears only on a media frame under the cursor.

## Markup

Shehroz is a designer who annotates. Use the **Markup** component to circle, underline or point at the single thing on a screen that matters most, the way you'd mark up a review.

- Draw it as a 2px `signal` stroke with round caps. Its label is set in `label`, never in handwriting.
- Use one mark per screen. It draws in once when it enters the viewport, then stays still.

## Motion and footage

The expressive motion is footage, not UI tricks. Pre-rendered sequences carry the wow. The interface stays calm around them.

- **Scroll as playhead.** Sections can scrub a sequence frame by frame as the visitor scrolls, like dragging a playhead. Use image sequences (WebP frames on a canvas) or all-intra video, sitting on `stage`.
- **State clips.** Hover or tap can move a sequence to a named frame (a light turning to a menu item, a camera gliding to a build). Each clip starts on the exact frame the previous one ended on, so cuts are invisible.
- **Seamless loops.** Idle loops start and end on the same frame.
- **UI motion** is 160ms ease-out for state changes and 320ms for entrances. The playhead moves linearly with scroll. No bounce, no spin, no parallax for its own sake.
- **Reduced motion and slow connections** get the poster frame of every sequence and no scrubbing. Every sequence has a poster.

## Imagery

- Real builds only: footage from the reels, photos of TARS and Yolk on the desk, screen recordings, sketches, CAD, wiring, failures. Desk-level, hands in frame, natural light or screen light.
- Generated footage may be used for motion sequences of objects and scenes. It must never show a build that doesn't exist.
- **Pixel sprites** (`assets/sprites/shehroz-*.webp`) are the one illustrated version of Shehroz. They are his own artwork; use only these eight poses and never redraw, recolour or generate new ones. Each sprite acts out its section: drawing the trail with a pen in the hero, holding a board in the story, thinking at the crossroads, a laptop for building, soldering for making, a camera for telling, pointing at the end of a path, waving by the footer. One sprite per section at most, standing on a real line or baseline, never floating as decoration.
- **No code-drawn portrait or face of Shehroz.** For a realistic face, use a real photo or real footage of his Beyond Presence avatar.
- No product (Yolk included) defines the brand. Never use a device, dial or e-ink motif as the identity.

## Logo

- `shehroz-wordmark.svg` is the playhead mark in `signal` followed by "Shehroz Sajjad" in Instrument Sans 600. Use it in the site header and on share images.
- On `stage` or dark theme, use `shehroz-wordmark-ondark.svg`.
- `shehroz-mark.svg` (the playhead alone) is for favicons, avatars and the playhead itself at small sizes.
- Clear space around the wordmark is the mark's width on every side. Never recolour the name, add effects, or set the name in another face.

## Iconography

There is no icon set. Use words first, then mono glyphs where a symbol is truly clearer: `→` for links and next, `↗` for leaving the site, `●` (in `live`) for live. If a pictogram is ever needed, draw it as a 1.5px outline on a 24px grid in `ink`, square-capped, matching the mark's geometry.

## States and accessibility

- Focus: a 2px solid `focus` ring with a 2px offset, on every interactive element, in both themes.
- Hover on text links: underline thickens. Hover on rows: `signal-soft` ground. Hover on media: `lift` and the playhead appears.
- Every text pair named in a token's usage note holds 4.5:1 or better in both themes.
- Any playful layer (the timeline, scrubbed sequences) always has a plain list one click away.
