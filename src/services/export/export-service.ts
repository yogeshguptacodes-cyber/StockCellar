import type { Bottle, Category, InventorySession } from '@/domain/models';

/**
 * Inventory export contract.
 *
 * v1: `MockExcelExportService` builds the CSV and logs it.
 * v2: ExcelJS + share sheet — same interface, no screen changes.
 */
export interface ExportResult {
  readonly fileName: string;
  readonly rowCount: number;
}

export interface InventoryExportService {
  exportSession(
    session: InventorySession,
    bottleById: ReadonlyMap<string, Bottle>,
    categoryById: ReadonlyMap<string, Category>,
  ): Promise<ExportResult>;
}
