/**
 * Whether the reader wants adult content requested from the source at all.
 *
 * A host that predates this method still answers: plugin-frame's remote is a
 * Proxy that generates a function for any name, so `application.getShowNsfw` is
 * never undefined and the call still returns a promise. It just rejects, once
 * the host looks the method up in its own api object and finds nothing.
 * Optional chaining and `??` both sail straight past that, which leaves
 * try/catch as the only guard that works.
 *
 * A rejection therefore means an older host with no such preference, where the
 * behavior was to request everything — so that is what a rejection falls back
 * to. Filtering instead would hide posts on a host that has no setting to turn
 * them back on.
 */
export const hostAllowsNsfw = async (): Promise<boolean> => {
  try {
    return await application.getShowNsfw();
  } catch {
    return true;
  }
};
