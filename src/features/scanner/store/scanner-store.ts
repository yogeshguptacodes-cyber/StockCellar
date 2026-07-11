import { create } from 'zustand';

import { container } from '@/core/di/container';
import { normalizeError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import type { ExtractionResult } from '@/services/extraction/inventory-extraction-service';

const log = createLogger('scanner:store');

/** Scanner flow state machine. */
export type ScannerPhase = 'idle' | 'preview' | 'extracting' | 'review';

interface ScannerState {
  phase: ScannerPhase;
  imageUri: string | null;
  result: ExtractionResult | null;
  errorMessage: string | null;

  setImage: (uri: string, source: 'camera' | 'gallery') => void;
  extract: () => Promise<void>;
  reset: () => void;
  /** Called after entries are applied to the inventory draft. */
  markApplied: () => void;
}

export const useScannerStore = create<ScannerState>()((set, get) => ({
  phase: 'idle',
  imageUri: null,
  result: null,
  errorMessage: null,

  setImage: (uri, source) => {
    set({ phase: 'preview', imageUri: uri, result: null, errorMessage: null });
    container.analytics.track({ name: 'scan_image_selected', payload: { source } });
  },

  extract: async () => {
    const { imageUri } = get();
    if (!imageUri) {
      return;
    }
    set({ phase: 'extracting', errorMessage: null });
    container.analytics.track({ name: 'ai_scan_started' });
    try {
      const result = await container.extractionService.extractFromImage(imageUri);
      container.analytics.track({
        name: 'ai_scan_completed',
        payload: { skuCount: result.entries.length },
      });
      set({ phase: 'review', result });
    } catch (error) {
      const normalized = normalizeError(error);
      log.error('Extraction failed', normalized);
      container.analytics.track({
        name: 'error_occurred',
        payload: { code: normalized.code, message: normalized.message },
      });
      set({ phase: 'preview', errorMessage: 'Could not read the sheet. Please try again.' });
    }
  },

  reset: () => set({ phase: 'idle', imageUri: null, result: null, errorMessage: null }),

  markApplied: () => set({ phase: 'idle', imageUri: null, result: null, errorMessage: null }),
}));
