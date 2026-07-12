import type {
  ExtractedRegisterRow,
  ExtractedSizes,
  ExtractionContext,
  ExtractionImage,
  ExtractionResult,
  InventoryExtractionService,
} from './inventory-extraction-service';

import { NetworkError, TimeoutError, UnknownError, ValidationError } from '@/core/errors';
import { createLogger } from '@/core/logger';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 90_000;

const EXTRACTION_PROMPT = `You are reading a photograph of an Indian bar daily stock register sheet.

Sheet structure:
- Each ROW is one liquor brand (column "NAME OF LIQUOR").
- Column GROUPS from left to right: OPENING STOCK, STOCK RECEIVED, TOTAL STOCK, BALANCE STOCK, SALE, AMOUNT (Rs.).
- Every stock group has SIX size sub-columns in ml: 1000, 750, 180, 90, 60, 30.
- Cells are handwritten counts; blank cells mean zero.

Extract ONLY the handwritten data. Do NOT extract TOTAL STOCK or SALE (they are derived).

Return a JSON array. One object per row that has ANY handwritten value:
{
  "name": "liquor name exactly as printed/written",
  "opening":  { "1000": n, "750": n, "180": n, "90": n, "60": n, "30": n },
  "received": { ... },
  "balance":  { ... },
  "amount": n,
  "confidence": 0.0-1.0
}
Rules:
- Omit size keys whose cell is blank. Omit whole groups with no values. Omit "amount" if blank.
- All numbers are non-negative integers (amount may be a larger integer in rupees).
- "confidence" reflects how legible that row's handwriting was.
- Skip the TOTAL row at the bottom of the sheet.
- Return ONLY the JSON array, nothing else.`;

function buildPrompt(context: ExtractionContext | undefined): string {
  const names = context?.knownItemNames;
  if (!names || names.length === 0) {
    return EXTRACTION_PROMPT;
  }
  return `${EXTRACTION_PROMPT}

KNOWN CATALOG (this bar's item list). When a sheet row matches one of these,
return the name EXACTLY as spelled below — treat this list as the OCR
vocabulary for messy handwriting. Rows genuinely not in this list may still
be returned with the name as written on the sheet.
${names.map((name) => `- ${name}`).join('\n')}`;
}

interface GeminiResponse {
  candidates?: readonly {
    content?: { parts?: readonly { text?: string; thought?: boolean }[] };
  }[];
  /** Exact billing counts returned by the API — logged per scan for pricing. */
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
}

function parseSizes(value: unknown): ExtractedSizes | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const sizes: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const quantity = typeof raw === 'number' ? Math.max(0, Math.trunc(raw)) : Number.NaN;
    if (!Number.isNaN(quantity) && quantity > 0) {
      sizes[key] = quantity;
    }
  }
  return Object.keys(sizes).length > 0 ? sizes : undefined;
}

/** Tolerates accidental markdown fences around the JSON payload. */
function extractJsonText(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  return (fenced?.[1] ?? text).trim();
}

/**
 * Gemini-backed register extraction. Activated by setting
 * `EXPO_PUBLIC_GEMINI_API_KEY` — see `.env.example`.
 *
 * NOTE: an API key bundled into a client app is acceptable for personal/dev
 * use only. Once the Node.js backend exists, this call moves server-side and
 * this class is replaced by a repository call — same interface.
 */
export class GeminiExtractionService implements InventoryExtractionService {
  private readonly log = createLogger('scanner:gemini');

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async extractFromImage(image: ExtractionImage, context?: ExtractionContext): Promise<ExtractionResult> {
    if (!image.base64) {
      throw new ValidationError('Image data is missing. Please re-select the photo.');
    }

    this.log.info('Gemini extraction started', {
      model: this.model,
      vocabularySize: context?.knownItemNames?.length ?? 0,
    });

    const abort = new AbortController();
    const timeoutHandle = setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(
        `${GEMINI_ENDPOINT}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: buildPrompt(context) },
                  {
                    inline_data: {
                      mime_type: image.mimeType ?? 'image/jpeg',
                      data: image.base64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0,
              responseMimeType: 'application/json',
            },
          }),
          signal: abort.signal,
        },
      );
    } catch (cause) {
      if (abort.signal.aborted) {
        throw new TimeoutError('The scan took too long. Please try again.', { cause });
      }
      throw new NetworkError('Could not reach the AI service. Check your internet connection.', {
        cause,
      });
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.log.error('Gemini API error', undefined, { status: response.status, body: body.slice(0, 500) });
      // Map the common billing/auth failures to messages the user can act on.
      if (response.status === 429) {
        throw new NetworkError(
          body.includes('credits are depleted')
            ? 'Your Gemini credits are used up. Top up at ai.studio/projects, then scan again.'
            : 'Scan limit reached for now. Wait a minute and try again.',
          { context: { status: 429 } },
        );
      }
      if (response.status === 401 || response.status === 403) {
        throw new NetworkError(
          'The Gemini API key was rejected. Check EXPO_PUBLIC_GEMINI_API_KEY in .env and restart the app.',
          { context: { status: response.status } },
        );
      }
      if (response.status === 404) {
        throw new NetworkError(
          `Model "${this.model}" is not available for this key. Change EXPO_PUBLIC_GEMINI_MODEL in .env.`,
          { context: { status: 404 } },
        );
      }
      throw new NetworkError(`AI service error (HTTP ${response.status}). Please try again.`, {
        context: { status: response.status },
      });
    }

    const payload = (await response.json()) as GeminiResponse;

    if (payload.usageMetadata) {
      // Per-scan cost telemetry — the basis for customer pricing.
      this.log.info('Gemini token usage', {
        inputTokens: payload.usageMetadata.promptTokenCount ?? 0,
        outputTokens: payload.usageMetadata.candidatesTokenCount ?? 0,
        thinkingTokens: payload.usageMetadata.thoughtsTokenCount ?? 0,
        totalTokens: payload.usageMetadata.totalTokenCount ?? 0,
      });
    }

    // Thinking models may emit thought parts before the answer — join only
    // the real text parts.
    const text = (payload.candidates?.[0]?.content?.parts ?? [])
      .filter((part) => part.thought !== true && typeof part.text === 'string')
      .map((part) => part.text)
      .join('');
    if (!text) {
      throw new UnknownError('Extraction service returned an empty response');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJsonText(text));
    } catch (cause) {
      throw new UnknownError('Could not parse the extraction response', { cause });
    }
    if (!Array.isArray(parsed)) {
      throw new UnknownError('Extraction response was not a list of rows');
    }

    const rows: ExtractedRegisterRow[] = [];
    for (const raw of parsed) {
      if (typeof raw !== 'object' || raw === null) {
        continue;
      }
      const record = raw as Record<string, unknown>;
      const name = typeof record.name === 'string' ? record.name.trim() : '';
      if (name.length === 0) {
        continue;
      }
      const opening = parseSizes(record.opening);
      const received = parseSizes(record.received);
      const balance = parseSizes(record.balance);
      const amountRs =
        typeof record.amount === 'number' && record.amount > 0
          ? Math.trunc(record.amount)
          : undefined;
      if (!opening && !received && !balance && amountRs === undefined) {
        continue;
      }
      rows.push({
        itemName: name,
        ...(opening ? { opening } : {}),
        ...(received ? { received } : {}),
        ...(balance ? { balance } : {}),
        ...(amountRs !== undefined ? { amountRs } : {}),
        confidence:
          typeof record.confidence === 'number'
            ? Math.min(1, Math.max(0, record.confidence))
            : 0.9,
      });
    }

    this.log.info('Gemini extraction completed', { rows: rows.length });
    return { rows, processedAt: Date.now() };
  }
}
