/**
 * Collision-resistant client-side id. Future backend entities will use
 * server-issued ids; these remain valid as offline-created ids for sync.
 */
export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}
