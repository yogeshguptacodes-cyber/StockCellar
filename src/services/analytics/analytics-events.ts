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
  | { name: 'bottle_quantity_updated'; payload: { bottleId: string; quantity: number } }
  | { name: 'inventory_reset'; payload: { skusCleared: number } }
  | { name: 'inventory_saved'; payload: { sessionId: string; totalSkus: number; totalUnits: number } }
  | { name: 'scan_image_selected'; payload: { source: 'camera' | 'gallery' } }
  | { name: 'ai_scan_started' }
  | { name: 'ai_scan_completed'; payload: { skuCount: number } }
  | { name: 'scan_applied'; payload: { skuCount: number } }
  | { name: 'excel_exported'; payload: { sessionId: string; rowCount: number } }
  | { name: 'history_viewed' }
  | { name: 'session_deleted'; payload: { sessionId: string } }
  | { name: 'theme_changed'; payload: { preference: string } }
  | { name: 'error_occurred'; payload: { code: string; message: string } };

export type AnalyticsEventName = AnalyticsEvent['name'];
