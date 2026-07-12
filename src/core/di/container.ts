import { appConfig } from '@/core/config';
import type { InventoryRepository } from '@/domain/repositories';
import { MockInventoryRepository } from '@/infrastructure/repositories/mock/mock-inventory-repository';
import { AsyncStorageService, type KeyValueStorage } from '@/infrastructure/storage';
import {
  AnalyticsService,
  ConsoleAnalyticsProvider,
} from '@/services/analytics';
import { GeminiExtractionService } from '@/services/extraction/gemini-extraction-service';
import type { InventoryExtractionService } from '@/services/extraction/inventory-extraction-service';
import { MockInventoryExtractionService } from '@/services/extraction/mock-inventory-extraction-service';
import type { InventoryExportService } from '@/services/export/export-service';
import { MockExcelExportService } from '@/services/export/mock-excel-export-service';

/**
 * Composition root — the ONLY place implementations are chosen.
 *
 * Going live with the Node.js backend, Gemini extraction, ExcelJS export, or
 * Firebase analytics means editing this file (or branching on
 * `appConfig.environment`) and nothing else. Tests build their own container
 * with fakes.
 */
export interface AppContainer {
  readonly storage: KeyValueStorage;
  readonly inventoryRepository: InventoryRepository;
  readonly extractionService: InventoryExtractionService;
  /** Which extraction backend is active — for analytics/UI hints only. */
  readonly extractionProvider: 'mock' | 'gemini';
  readonly exportService: InventoryExportService;
  readonly analytics: AnalyticsService;
}

function buildContainer(): AppContainer {
  const storage = new AsyncStorageService();

  // Real AI extraction switches on automatically when a key is configured.
  const extractionService: InventoryExtractionService = appConfig.geminiApiKey
    ? new GeminiExtractionService(appConfig.geminiApiKey, appConfig.geminiModel)
    : new MockInventoryExtractionService();

  return {
    storage,
    inventoryRepository: new MockInventoryRepository(storage),
    extractionService,
    extractionProvider: appConfig.geminiApiKey ? 'gemini' : 'mock',
    exportService: new MockExcelExportService(),
    analytics: new AnalyticsService([new ConsoleAnalyticsProvider()], appConfig.analyticsEnabled),
  };
}

export const container: AppContainer = buildContainer();
