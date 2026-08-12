/**
 * A count and its noun, the noun taking an `s` unless the count is one. Every
 * noun the app counts is regular, so there is no irregular plural to carry.
 */
export default function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
