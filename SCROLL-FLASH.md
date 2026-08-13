# The scroll flash on Android Firefox

Flinging the results table on Android Firefox flashes a solid color over and
around the pinned header and the pinned player column, for a frame or two. Not
reproducible in desktop Firefox or Chrome, and not reproducible in a device
emulator, because it needs the real async-scrolling path.

Unresolved. This file records what is known so the next attempt does not repeat
the four that failed.

## Mechanism, confirmed

Firefox scrolls asynchronously on the compositor. A fast fling outruns the
rasterizer, and any region not yet rasterized is filled with a flat color.

That color is read from **the scroll container's own background**, not from
anything painted inside it. `.page__content` is the scroll container. Setting it
to `--rak-primary-800` turned the flash from white to dark, which is how the
mechanism was confirmed.

Sticky elements are excluded from the layer the scrolled content rasterizes
into, so each one leaves a hole. During a fling the hole is what gets the flat
fill. The table has roughly forty sticky elements: every `<th>` in the header,
and one `<td>` per row in the player column.

## Bisected

Two throwaway branches, both flick-tested on the reporter's phone:

- `debug-no-sticky` — every `position: sticky` in `Table.scss` set to `static`.
  **Flash gone.** Sticky is the cause.
- `debug-header-sticky-only` — header still pins, player column does not. Result
  not recorded; run this first if picking the work back up.

Delete both branches when this is settled.

## Ruled out

Each of these was shipped, flick-tested, and did not fix it:

1. Moving sticky off `<thead>` onto each `<th>`, on the theory that a sticky cell
   inside a sticky section falls off the compositor path.
2. `will-change: transform` on the player column, to force it onto its own layer.
   Reverted, since it costs GPU memory on every row for nothing.
3. Widening `.results-scores` to `max-content` so the frame's fill spans the
   whole table. Correct on its own merits and kept, but it paints a descendant
   of the scroll container, which is not where the flat fill comes from.
4. Dropping `z-index` from the player column's cells, so they would not each
   become a stacking context.

## Options considered

**A. Recolor the player column.** The flat fill on a phone is already the
header's own dark, so a header hole is invisible. A dark player column would make
its hole invisible too. One SCSS change, no architecture. Costs the blue and
peach in-contention and knocked-out fills in that column, though
`PlayerStatusIcon` already carries the same status.

**B. Frozen panes.** Lift the rank and player columns out of the horizontal
scroller so nothing in `<tbody>` is sticky. There is no CSS-only version of this:
`overflow-x: auto` forces `overflow-y` to `auto`, so once the body columns have
their own horizontal scroller the header's `top: 0` resolves against that box
instead of the page and stops pinning. One scroll container needs sticky on both
axes; two need a scroll listener syncing one axis, which lags on a fling. Trading
a flash for a lag may not be a win.

**C. CSS grid with ARIA grid roles.** The frozen column becomes one sticky
element instead of thirty. Largest change, gives up native table semantics, and
is still sticky, so it may still hole.

## If picking this back up

Run `debug-header-sticky-only` first. If the flash is gone there, only the player
column matters and option A is enough. If it is still there, the header's sticky
holes too, and no recoloring covers both.
