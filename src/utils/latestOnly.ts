/**
 * Runs an async job and hands it `isCurrent`, which goes false once the returned
 * cleanup fires. A job that outlives its effect can then drop what it came back
 * with instead of writing it over whatever replaced it.
 *
 * A plain function rather than a hook, so the dependency array stays on the real
 * `useEffect` and `react-hooks/exhaustive-deps` keeps reading it:
 *
 *     useEffect(() => latestOnly(async (isCurrent) => {
 *       const found = await fetchThing(id);
 *       if (isCurrent()) setThing(found);
 *     }), [id]);
 */
export default function latestOnly(
  run: (isCurrent: () => boolean) => void,
): () => void {
  let current = true;
  run(() => current);
  return () => {
    current = false;
  };
}
