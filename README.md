# shehroz.ai

Personal site of Shehroz Sajjad, applied AI and product engineer in Munich.

> Started in design. Kept following the idea.

This repo holds the working prototype of the homepage, the brand and design system it is built on, and the decisions behind both. From here on, every change to the site goes through it.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The current homepage prototype, served by GitHub Pages. One self-contained page: HTML, CSS and JS inline. |
| `design-system/` | Brand book (`README.md`), tokens (`tokens.json`, `tokens.css`), logos, fonts and component specs. |
| `docs/decisions.md` | How the direction got here, and what was tried and dropped. |
| `docs/homepage-study.png` | The four-chapter homepage study the prototype follows. |
| `2018.html`, `ASCII/`, `spotify/`, `infinity/`, `new/`, `old/` | The previous site and experiments, kept at their old addresses. |

## Run it

No build step. Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

GitHub Pages publishes the default branch at https://mshehrozsajjad.github.io.

Fonts load from Google Fonts. Everything else is in the file.

## How the homepage works

1. **The shared story.** A single ultramarine trail draws itself as you scroll: the hero, chapter 01 (CodeJunkie, Porsche and cureVision, Beyond Presence) and the dark "now" chapter, which opens out to full width while product and marketing work enter together.
2. **The crossroads.** Chapter 03 pins in place. Scrolling focuses each path in turn (building, making, telling) with a preview of where it starts. Pausing on a path fills a ring and takes it; clicking or the "Take this path" button does the same.
3. **A focused path.** Only the chosen field's stories unfold below, then a second fork (for building: SaaS, automation, open source) leads to finished work.
4. **Return.** A breadcrumb (The story / Crossroads / field / sub-path) restores the crossroads and the scroll position you left it at.

On phones the trail sways down the left margin and swings across the page between chapters. With reduced motion, nothing pins and nothing is chosen automatically.

## Status

Prototype. Grey boxes mark where real media goes, and the "Ask my AI self" panel answers from a fixed set of confirmed facts rather than a live model.

Still needed:

- Media: portrait or avatar clip, archive photos, Beyond Presence product and marketing footage, build photos, reel files
- Links: RoomRush, Slaptastic, LiveKit plugin, n8n node, social handles
- Confirmation of the field headlines and the second-level choices for Making and Telling
- Newsletter provider, domain, Impressum and Datenschutz

The full brief is kept privately, outside this public repo.
