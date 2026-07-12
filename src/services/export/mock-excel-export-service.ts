import type { ExportResult, InventoryExportService } from './export-service';

import { createLogger } from '@/core/logger';
import {
  BOTTLE_SIZES,
  rowSale,
  rowTotal,
  type LiquorItem,
  type SizeQuantities,
  type StockRegister,
} from '@/domain/models';

const SIMULATED_EXPORT_MS = 800;

/** Escape a CSV field per RFC 4180. */
function csvField(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sizeColumns(q: SizeQuantities): string[] {
  return BOTTLE_SIZES.map((size) => String(q[size]));
}

/**
 * CSV export mirroring the physical register: one row per item, the five
 * ledger groups × six sizes as columns, amount last.
 */
export class MockExcelExportService implements InventoryExportService {
  private readonly log = createLogger('export:mock-excel');

  async exportRegister(
    register: StockRegister,
    itemById: ReadonlyMap<string, LiquorItem>,
  ): Promise<ExportResult> {
    const groups = ['Opening', 'Received', 'Total', 'Balance', 'Sale'] as const;
    const header = [
      'Name',
      ...groups.flatMap((group) => BOTTLE_SIZES.map((size) => `${group} ${size}`)),
      'Amount (Rs)',
    ];

    const lines = register.rows.map((row) => {
      const name = itemById.get(row.itemId)?.name ?? row.itemId;
      return [
        csvField(name),
        ...sizeColumns(row.opening),
        ...sizeColumns(row.received),
        ...sizeColumns(rowTotal(row)),
        ...sizeColumns(row.balance),
        ...sizeColumns(rowSale(row)),
        csvField(row.amountRs),
      ].join(',');
    });
    const csv = [header.join(','), ...lines].join('\n');

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_EXPORT_MS));

    const fileName = `stockcellar-${register.date}-${register.id.slice(-4)}.csv`;
    this.log.info('Mock export generated', { fileName, rowCount: lines.length });
    this.log.debug(`CSV preview:\n${csv.slice(0, 600)}`);

    return { fileName, rowCount: lines.length };
  }
}
