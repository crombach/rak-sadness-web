/** A fixed name, a name to keep only when its condition holds, or nothing at all. */
type ClassPart = string | false | null | undefined | Record<string, boolean>;

/**
 * Joins class names into one attribute, dropping every conditional whose condition is
 * false and every part that is not there.
 *
 * The fixed names go in alongside the conditional ones rather than being written
 * around the call, so no caller has to know whether the result starts with a space or
 * what an empty one leaves behind.
 */
export default function getClasses(...parts: Array<ClassPart>): string {
  return parts
    .flatMap((part) => {
      if (part == null || part === false || part === "") return [];
      if (typeof part === "string") return [part];
      return Object.entries(part)
        .filter(([, isActive]) => isActive)
        .map(([className]) => className);
    })
    .join(" ");
}
