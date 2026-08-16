/** Items whose text contains the query, case-insensitively, trimmed. */
export default function matching<T>(
  items: Array<T>,
  query: string,
  textOf: (item: T) => string,
): Array<T> {
  const needle = query.trim().toLowerCase();
  return items.filter((item) => textOf(item).toLowerCase().includes(needle));
}
