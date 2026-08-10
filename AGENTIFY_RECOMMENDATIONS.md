# Agentify recommendations

What is left. Everything below was recommended but not applied, with the reason.

## Build

### The bundle is one 1.32 MB chunk

Vite warns about it on every build.

**Suggested action:** ignore, or set `build.chunkSizeWarningLimit` to silence it.
There are three routes now, so lazy-loading them is possible, but they share the
scoring pipeline and `xlsx-js-style`, which is most of the weight. Splitting would
move the bytes around rather than remove them.
