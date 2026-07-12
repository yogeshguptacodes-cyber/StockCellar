import type {
  ExtractedRegisterRow,
  ExtractionImage,
  ExtractionResult,
  InventoryExtractionService,
} from './inventory-extraction-service';

import { createLogger } from '@/core/logger';
import { BOTTLE_SIZES } from '@/domain/models';
import { seedItems } from '@/infrastructure/repositories/mock/seed-data';

/** Simulates model latency so the UI's progress states are exercised. */
const SIMULATED_PROCESSING_MS = 1800;
const MIN_ROWS = 8;
const MAX_ROWS = 14;

function randomSizes(max: number): Record<string, number> {
  const sizes: Record<string, number> = {};
  for (const size of BOTTLE_SIZES) {
    if (Math.random() > 0.5) {
      sizes[String(size)] = 1 + Math.floor(Math.random() * max);
    }
  }
  return sizes;
}

export class MockInventoryExtractionService implements InventoryExtractionService {
  private readonly log = createLogger('scanner:mock-extraction');

  async extractFromImage(image: ExtractionImage): Promise<ExtractionResult> {
    this.log.debug('Mock extraction started', { uri: image.uri });
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_PROCESSING_MS));

    const count = MIN_ROWS + Math.floor(Math.random() * (MAX_ROWS - MIN_ROWS + 1));
    const shuffled = [...seedItems].sort(() => Math.random() - 0.5);
    const rows: ExtractedRegisterRow[] = shuffled.slice(0, count).map((item) => ({
      itemName: item.name,
      opening: randomSizes(20),
      received: randomSizes(12),
      balance: randomSizes(15),
      amountRs: Math.random() > 0.4 ? (1 + Math.floor(Math.random() * 40)) * 100 : 0,
      confidence: Math.round((0.7 + Math.random() * 0.29) * 100) / 100,
    }));

    this.log.debug('Mock extraction completed', { rows: rows.length });
    return { rows, processedAt: Date.now() };
  }
}
