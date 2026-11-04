# LaneChip

The five disciplines, as chips: Design, Code, Hardware, Film, Sound, always in that order and always all five. They show which lanes a project used, with `sz-chip-on` (a `signal-soft` ground, `signal` text) for the lanes he worked in and the plain chip for the rest. Showing the unused lanes is what makes the range readable.

The consumer provides one `<span class="sz-chip">` per lane, with an empty `<i>` for the clip glyph. They double as filter buttons on the archive: use a `<button>` then and keep the same classes. Never colour a lane by its own hue.
