/**
 * AI inventory-sheet extraction contract.
 *
 * v1: `MockInventoryExtractionService` returns plausible fake results.
 * v2: a Gemini-backed implementation — same interface, registered in the
 * composition root; the Scanner UI never changes.
 */
export interface ExtractedEntry {
  readonly bottleId: string;
  readonly quantity: number;
  /** Model confidence in [0, 1]; the UI can flag low-confidence rows. */
  readonly confidence: number;
}

export interface ExtractionResult {
  readonly entries: readonly ExtractedEntry[];
  /** Epoch ms. */
  readonly processedAt: number;
}

export interface InventoryExtractionService {
  extractFromImage(imageUri: string): Promise<ExtractionResult>;
}
