/* A small in-memory window. This is one container serving one site, so a
   Map is enough; it resets when the container restarts, which is fine. */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 8;

const hits = new Map<string, number[]>();

export function tooManyRequests(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  /* Keep the map from growing without bound on a long-running container. */
  if (hits.size > 5000) {
    for (const [id, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(id);
    }
  }

  return false;
}
