/**
 * Asks the browser to warm a resource without promising it is about to be shown,
 * which is what `rel=preload` would, and which is what warns in the console when
 * a preloaded resource goes unused for a few seconds.
 */
export default function prefetchLink(
  href: string,
  attributes: Record<string, string> = {},
) {
  const link = document.createElement("link");
  // Every attribute set directly rather than through its IDL property: `as` only
  // reflects as a content attribute for `rel=preload`/`modulepreload`, so the
  // property setter would silently drop it here.
  link.setAttribute("rel", "prefetch");
  link.setAttribute("href", href);
  for (const [name, value] of Object.entries(attributes)) {
    link.setAttribute(name, value);
  }
  document.head.appendChild(link);
}
