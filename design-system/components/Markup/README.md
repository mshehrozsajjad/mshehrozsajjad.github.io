# Markup

A designer's review mark over the page: a circle, an underline or an arrow in a 2px `signal` stroke with round caps, plus an optional note in `label` style (`sz-mk-note`). It points at the one thing on a screen that matters most, the way he'd mark up a design review.

- Use one mark per screen. It draws itself once (stroke-dashoffset, 600ms ease-out) when it enters the viewport, then stays still.
- The path is slightly loose but never wobbly or cartoonish. The note is always mono, never a handwriting face.
- Use `vector-effect: non-scaling-stroke` so the stroke stays 2px when the mark stretches to fit its word.

The consumer provides the wrapped text (`<span class="sz-mk">`), the SVG path and the note. Don't mark decorative text, don't stack marks, and don't use it on footage.
