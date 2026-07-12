/**
 * Typed analytics event catalog — the single registry of trackable events.
 *
 * A discriminated union means event names AND payloads are compile-checked
 * at every call site; adding an event here immediately types its payload.
 */
export type AnalyticsEvent =
  | { name: 'app_open' }
  | { name: 'manual_entry_started' }
  | { name: 'bottle_search'; payload: { query: string } }
  | {
      name: 'register_cell_updated';
      payload: { itemId: string; field: string; size: number; quantity: number };
    }
  | { name: 'register_amount_updated'; payload: { itemId: string; amountRs: number } }
  | { name: 'inventory_reset'; payload: { rowsCleared: number } }
  | {
      name: 'inventory_saved';
      payload: { registerId: string; rowCount: number; saleUnits: number; amountRs: number };
    }
  | { name: 'scan_image_selected'; payload: { source: 'camera' | 'gallery' } }
  | { name: 'ai_scan_started'; payload: { provider: 'mock' | 'gemini' } }
  | { name: 'ai_scan_completed'; payload: { rowCount: number } }
  | { name: 'scan_applied'; payload: { matched: number; unmatched: number } }
  | { name: 'excel_exported'; payload: { registerId: string; rowCount: number } }
  | { name: 'history_viewed' }
  | { name: 'register_deleted'; payload: { registerId: string } }
  | { name: 'theme_changed'; payload: { preference: string } }
  | { name: 'error_occurred'; payload: { code: string; message: string } };

export type AnalyticsEventName = AnalyticsEvent['name'];
