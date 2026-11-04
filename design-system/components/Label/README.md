# Label

Mono metadata: experiment numbers, lanes, status, stacks, timecodes and the live dot. This is the experimenter's voice in the system, the part that reads like a lab log.

- `sz-label` is uppercase `label`, joined with ` · `. Wrap the identifying part (the experiment number) in `<b>` to set it in `ink`.
- `sz-tc` is a `timecode` with tabular numbers. Format durations as `HH:MM:SS:FF` and clocks as `MM:SS`.
- `sz-live` adds the `live` dot. Use it only when something is actually live, such as the agent being online.

Put one label line above or below the thing it describes, never both. Don't use labels for sentences.
