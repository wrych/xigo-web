# xigo — Brand sheet

One page for anyone who draws, builds or writes for xigo. The rules it sets are
R-WEB-7 and R-WEB-8 in [`specs/requirements.md`](../specs/requirements.md).

## The idea

A dot is a person; a line between dots is a connection. The network drawings
on the site say it at large; the mark says it in four letters and one node.

## The wordmark

`xigo` and a gold node, drawn in SVG, never typed. The drawing lives in
[`src/brand.ts`](../src/brand.ts), shared by the header, the footer and the
icon, and is made by [`scripts/derive-mark.py`](../scripts/derive-mark.py)
from Space Grotesk 400 (SIL Open Font License 1.1; credited in
[`THIRD_PARTY.md`](../THIRD_PARTY.md)). All numbers below are font
units, on a 1000-unit em with an x-height of 486.

- **Letters** — the font's own i, g and o, unchanged.
- **The x** — the font's x, with its rising stroke drawn as one straight bar
  and the falling stroke cut 52 units clear on either side where they cross:
  one line passes over another, a connection. This cut is what makes the mark
  ours.
- **Spacing** — set by eye, ink to ink, the i measured at its stem: x–i 62,
  i–g 80, g–o 78, o–node 70.
  About half the font's text spacing; the diagonals of the x and the round o
  get less than the straight stems.
- **The node** — a true circle, one third of the x-height across (162), sitting
  on the baseline with the o's overshoot (14 below it). Larger than the i's
  dot, so it reads as a node, not a full stop.
- **Colour** — letters in `currentColor` (text colour, white on hover), the
  node in `--accent`, on the dark ground.

**Clear space**: one x-height on every side. **Minimum size**: 16 px tall
(footer); 20 px in the header. Below that, use the icon.

## The icon

The wordmark's x and node, the same paths, centred on a `--ground` square with
14/64 rounded corners: `public/favicon.svg`, and from it `favicon.ico` (16, 32,
48 px) and `apple-touch-icon.png` (180 px, square). Re-render both when the
SVG changes.

## The node

The accent dot has one form: a filled circle in `--accent`, `--node-size`
(6 px) across, defined once in `src/styles/global.css` as `.node` (and the
bullet of a `.node-bullets` list). It marks:

- list bullets on project and profile pages,
- an eyebrow label (Home's hero),
- the featured marker: before "Featured" (Home, Work) or the journal's lead,
- the current page in the navigation, under its link,
- the dot of the wordmark (drawn larger, in the mark's own proportions).

No `●` glyph, no full stop in gold, no coloured words.

## Palette

| Token           | Value                    | Role                          |
| --------------- | ------------------------ | ----------------------------- |
| `--ground`      | `#0e0e0f`                | the page                      |
| `--surface`     | `#161618`                | cards                         |
| `--text`        | `#edebe6`                | text, the wordmark's letters  |
| `--muted`       | `#9a9893`                | secondary text                |
| `--line`        | `rgb(237 235 230 / 10%)` | hairlines                     |
| `--line-strong` | `rgb(237 235 230 / 18%)` | outlines                      |
| `--accent`      | `#e6c79c`                | signal: the node, focus rings |

**Gold marks signal; it never fills a button.** It is the node, the focus
ring, the current state, a link's underline, a quote's rule and the network
drawings. The one primary action on a page is filled in `--text`.

One button still breaks this rule: the project page's "See the source code"
is filled gold. It changes with the rework of the page's buttons (one primary
style, filled in `--text`), which is not part of the brand mark.

## Type

Space Grotesk 300 for headings, Inter 300 and 500 for text, both served by
the site. The wordmark is not set in either: it is the drawing above.
