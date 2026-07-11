import type { ExportResult, InventoryExportService } from './export-service';

import { createLogger } from '@/core/logger';
import {
  formatBottleSize,
  type Bottle,
  type Category,
  type InventorySession,
} from '@/domain/models';

const SIMULATED_EXPORT_MS = 800;

/** Escape a CSV field per RFC 4180. */
function csvField(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export class MockExcelExportService implements InventoryExportService {
  private readonly log = createLogger('export:mock-excel');

  async exportSession(
    session: InventorySession,
    bottleById: ReadonlyMap<string, Bottle>,
    categoryById: ReadonlyMap<string, Category>,
  ): Promise<ExportResult> {
    const header = ['Brand', 'Name', 'Category', 'Size', 'Quantity'];
    const rows = session.entries.map((entry) => {
      const bottle = bottleById.get(entry.bottleId);
      const category = bottle ? categoryById.get(bottle.categoryId) : undefined;
      return [
        csvField(bottle?.brand ?? 'Unknown'),
        csvField(bottle?.name ?? entry.bottleId),
        csvField(category?.name ?? '—'),
        csvField(bottle ? formatBottleSize(bottle.sizeMl) : '—'),
        csvField(entry.quantity),
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');

    await new Promise((resolve) => setTimeout(resolve, SIMULATED_EXPORT_MS));

    const fileName = `stockcellar-${new Date(session.completedAt ?? session.startedAt)
      .toISOString()
      .slice(0, 10)}-${session.id.slice(-4)}.csv`;
    this.log.info('Mock export generated', { fileName, rowCount: rows.length });
    this.log.debug(`CSV preview:\n${csv}`);

    return { fileName, rowCount: rows.length };
  }
}
