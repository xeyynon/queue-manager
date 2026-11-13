# Tried and failed

So nobody repeats it.

<!-- template
## TF-N · <title> (<date>)
What: <approach>
Why it looked promising: <...>
What happened: <measured result>
Lesson: <rule to keep>
-->

## TF-1 · Reviewing screens through the Playwright MCP extension browser (2026-11-14)
What: drove Chrome through the MCP extension to click through screens.
What happened: the tab was hidden (`visibilityState=hidden`), so clicks timed out waiting for "stable" and the dashboard stayed on its skeleton.
Lesson: use `scripts/screenshots.mjs` (headless Playwright) for screen review; the extension only for one-off looks.
