import type { LiquorItem, StockRegister } from '@/domain/models';

/**
 * Register export contract.
 *
 * v1: `MockExcelExportService` builds the CSV (sheet-shaped) and logs it.
 * v2: ExcelJS + share sheet — same interface, no screen changes.
 */
export interface ExportResult {
  readonly fileName: string;
  readonly rowCount: number;
}

export interface InventoryExportService {
  exportRegister(
    register: StockRegister,
    itemById: ReadonlyMap<string, LiquorItem>,
  ): Promise<ExportResult>;
}
