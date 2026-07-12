import { create } from 'zustand';

import { container } from '@/core/di/container';
import { normalizeError } from '@/core/errors';
import { createLogger } from '@/core/logger';
import { useRegisterStore } from '@/features/inventory/store/register-store';
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
      // Ensure the catalog is loaded — its names are the model's OCR vocabulary.
      if (useRegisterStore.getState().status !== 'ready') {
        await useRegisterStore.getState().initialize();
      }
      const knownItemNames = useRegisterStore.getState().catalog.map((item) => item.name);
      const result = await container.extractionService.extractFromImage(image, { knownItemNames });
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
      // Network/timeout/validation errors carry user-actionable messages
      // (credits depleted, bad key, unavailable model, …) — show them as-is.
      const actionable =
        normalized.code === 'NETWORK' ||
        normalized.code === 'TIMEOUT' ||
        normalized.code === 'VALIDATION';
      set({
        phase: 'preview',
        errorMessage: actionable
          ? normalized.message
          : 'Could not read the sheet. Please try again.',
      });
    }
  },

  reset: () => set({ phase: 'idle', image: null, result: null, errorMessage: null }),

  markApplied: () => set({ phase: 'idle', image: null, result: null, errorMessage: null }),
}));
