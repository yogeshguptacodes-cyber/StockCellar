import type {
  ExtractedEntry,
  ExtractionResult,
  InventoryExtractionService,
} from './inventory-extraction-service';

import { createLogger } from '@/core/logger';
import { seedBottles } from '@/infrastructure/repositories/mock/seed-data';

/** Simulates model latency so the UI's progress states are exercised. */
const SIMULATED_PROCESSING_MS = 1800;
const MIN_RESULTS = 6;
const MAX_RESULTS = 10;
const MAX_QUANTITY = 24;

export class MockInventoryExtractionService implements InventoryExtractionService {
  private readonly log = createLogger('scanner:mock-extraction');

  async extractFromImage(imageUri: string): Promise<ExtractionResult> {
    this.log.debug('Mock extraction started', { imageUri });
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_PROCESSING_MS));

    const count = MIN_RESULTS + Math.floor(Math.random() * (MAX_RESULTS - MIN_RESULTS + 1));
    const shuffled = [...seedBottles].sort(() => Math.random() - 0.5);
    const entries: ExtractedEntry[] = shuffled.slice(0, count).map((bottle) => ({
      bottleId: bottle.id,
      quantity: 1 + Math.floor(Math.random() * MAX_QUANTITY),
      confidence: Math.round((0.7 + Math.random() * 0.29) * 100) / 100,
    }));

    this.log.debug('Mock extraction completed', { entries: entries.length });
    return { entries, processedAt: Date.now() };
  }
}
