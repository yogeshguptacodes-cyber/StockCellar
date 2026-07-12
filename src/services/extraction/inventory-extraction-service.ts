/**
 * AI register-sheet extraction contract.
 *
 * Reads a photographed bar stock register (rows = liquor names; column
 * groups = opening / received / balance / amount, each with the six bottle
 * sizes) into structured data. Total and sale are derived, never extracted.
 *
 * v1 default: `MockInventoryExtractionService`.
 * With `EXPO_PUBLIC_GEMINI_API_KEY` set: `GeminiExtractionService`.
 * The Scanner UI is identical for both.
 */
export interface ExtractionImage {
  readonly uri: string;
  /** Base64 payload (no data: prefix). Required by the Gemini implementation. */
  readonly base64?: string;
  readonly mimeType?: string;
}

/** Per-size quantities keyed by size label ("1000", "750", "180", "90", "60", "30"). */
export type ExtractedSizes = Readonly<Record<string, number>>;

export interface ExtractedRegisterRow {
  /** Liquor name as written on the sheet. */
  readonly itemName: string;
  readonly opening?: ExtractedSizes;
  readonly received?: ExtractedSizes;
  readonly balance?: ExtractedSizes;
  /** Sale value in rupees, when legible. */
  readonly amountRs?: number;
  /** Confidence in [0, 1]; the UI flags low-confidence rows. */
  readonly confidence: number;
}

export interface ExtractionResult {
  readonly rows: readonly ExtractedRegisterRow[];
  /** Epoch ms. */
  readonly processedAt: number;
}

export interface InventoryExtractionService {
  extractFromImage(image: ExtractionImage): Promise<ExtractionResult>;
}
