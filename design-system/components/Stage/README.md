# Stage

The frame for all footage: reels, demos, scroll-scrubbed image sequences and the agent's video. It is always `stage` (near-black) in both themes, with `radius-frame` corners, or full bleed on phones.

- The HUD line on top reads like a monitor: experiment number and take on the left, `timecode` on the right, in `on-stage-muted` with the key part in `on-stage`.
- Captions are always on, in `caption` style, `on-stage`, centred near the bottom. Burn the reel's own captions in or render them as text, never both.
- The bar at the bottom is the playhead: `stage-signal`, moved by playback or by scroll when the sequence is scrubbed.

The consumer provides the media (a `<video>` with a poster, or a `<canvas>` drawing WebP frames), the caption text and the progress. Every sequence needs a poster frame for reduced motion and slow connections. Use `sz-stage-v` for 9:16 reels.
