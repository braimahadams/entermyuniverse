/**
 * Parsing the `@handle` URL segment.
 *
 * The `@` is part of the segment's *value*, not the folder name — Next
 * treats a literal `@folder` as a parallel route, so it can never match a
 * request. The dynamic `[handle]` segment catches `/@someone` and this
 * validates the shape.
 *
 * Rejecting anything without the `@` also stops the route swallowing every
 * unknown top-level path on the site, which would turn genuine 404s into
 * "creator not found".
 */
export function parseHandle(raw: string): string | null {
  const decoded = decodeURIComponent(raw);
  if (!decoded.startsWith("@")) return null;

  const handle = decoded.slice(1).toLowerCase();
  return /^[a-z0-9_]{3,24}$/.test(handle) ? handle : null;
}
