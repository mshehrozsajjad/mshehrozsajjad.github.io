# Button

Buttons and text links, all in sentence case with the verb first. Use **primary** (`sz-btn sz-btn-primary`, a `signal` fill with `on-signal` text) at most once per view, for the one thing the view is for, usually "Follow along" or "Talk to my AI". Use the outline **secondary** (`sz-btn`) for everything else that is a button.

Use a text link (`sz-link`) inside running text and for "next" moves. End an in-site link with `→` and a link that leaves the site with `↗`.

The consumer provides an `<a>` or `<button>` with the class and its label. Don't put icons in buttons, don't use two primaries side by side, and don't write "Click here" or "Learn more".
