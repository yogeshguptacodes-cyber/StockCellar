import type { LiquorItem } from '@/domain/models';

/** Lowercase, alphanumeric-only — tolerant of punctuation and spacing. */
export function normalizeItemName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Match an extracted sheet name to a catalog item: exact normalized match
 * wins; otherwise the first mutual-substring match (handles "Blenders Pride"
 * vs "Blenders Pride Rare Premium" style variance).
 */
export function matchItemByName(
  name: string,
  catalog: readonly LiquorItem[],
): LiquorItem | undefined {
  const target = normalizeItemName(name);
  if (target.length === 0) {
    return undefined;
  }
  let partial: LiquorItem | undefined;
  for (const item of catalog) {
    const candidate = normalizeItemName(item.name);
    if (candidate === target) {
      return item;
    }
    if (!partial && (candidate.includes(target) || target.includes(candidate))) {
      partial = item;
    }
  }
  return partial;
}
