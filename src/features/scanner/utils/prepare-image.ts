import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { ExtractionImage } from '@/services/extraction/inventory-extraction-service';

/**
 * Downscale + compress a picked photo before sending it to the AI.
 *
 * A raw phone photo is ~12 MP; the model tiles large images into many pieces,
 * which makes requests slow (and occasionally time out) and costs more tokens.
 * A register sheet is fully legible at ~1600px wide, so we cap the long edge
 * there and JPEG-compress — typically a >10× payload reduction with no loss
 * of readability for the printed/handwritten columns.
 */
const MAX_WIDTH = 1600;
const COMPRESS_QUALITY = 0.7;

export async function prepareImageForExtraction(
  uri: string,
  originalWidth?: number,
): Promise<ExtractionImage> {
  const context = ImageManipulator.manipulate(uri);
  if (originalWidth === undefined || originalWidth > MAX_WIDTH) {
    context.resize({ width: MAX_WIDTH });
  }
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    compress: COMPRESS_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });

  return {
    uri: result.uri,
    base64: result.base64 ?? '',
    mimeType: 'image/jpeg',
  };
}
