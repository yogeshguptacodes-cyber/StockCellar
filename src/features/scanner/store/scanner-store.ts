import { create } from 'zustand';

import { container } from '@/core/di/container';
import { normalizeError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import type {
  ExtractionImage,
  ExtractionResult,
} from '@/services/extraction/inventory-extraction-service';

const log = createLogger('scanner:store');

/** Scanner flow state machine. */
export type ScannerPhase = 'idle' | 'preview' | 'extracting' | 'review';

interface ScannerState {
  phase: ScannerPhase;
  image: ExtractionImage | null;
  result: ExtractionResult | null;
  errorMessage: string | null;

  setImage: (image: ExtractionImage, source: 'camera' | 'gallery') => void;
  extract: () => Promise<void>;
  reset: () => void;
  /** Called after rows are applied to the register draft. */
  markApplied: () => void;
}

export const useScannerStore = create<ScannerState>()((set, get) => ({
  phase: 'idle',
  image: null,
  result: null,
  errorMessage: null,

  setImage: (image, source) => {
    set({ phase: 'preview', image, result: null, errorMessage: null });
    container.analytics.track({ name: 'scan_image_selected', payload: { source } });
  },

  extract: async () => {
    const { image } = get();
    if (!image) {
      return;
    }
    set({ phase: 'extracting', errorMessage: null });
    container.analytics.track({
      name: 'ai_scan_started',
      payload: { provider: container.extractionProvider },
    });
    try {
      const result = await container.extractionService.extractFromImage(image);
      container.analytics.track({
        name: 'ai_scan_completed',
        payload: { rowCount: result.rows.length },
      });
      set({ phase: 'review', result });
    } catch (error) {
      const normalized = normalizeError(error);
      log.error('Extraction failed', normalized);
      container.analytics.track({
        name: 'error_occurred',
        payload: { code: normalized.code, message: normalized.message },
      });
      set({
        phase: 'preview',
        errorMessage:
          normalized.code === 'NETWORK'
            ? 'Could not reach the extraction service. Check your connection and try again.'
            : 'Could not read the sheet. Please try again.',
      });
    }
  },

  reset: () => set({ phase: 'idle', image: null, result: null, errorMessage: null }),

  markApplied: () => set({ phase: 'idle', image: null, result: null, errorMessage: null }),
}));
