import { DefaultDSL } from "@/lib/dsl/schema";

type ImageMimeType = "image/jpeg" | "image/png";
type Provider = "openai-compatible" | "anthropic";

export type GenerateDSLParams = {
  imageBase64: string;
  imageMimeType: ImageMimeType;
  rules: unknown;
  userPrompt: string;
  language: "ja" | "en";
};

export class LLMError extends Error {
  constructor(
    public readonly code: "AI_PROVIDER_NOT_CONFIGURED" | "AI_PROVIDER_INVALID" | "AI_MODEL_NOT_CONFIGURED" | "AI_AUTHENTICATION_FAILED" | "AI_RATE_LIMITED" | "AI_MODEL_NOT_FOUND" | "AI_REQUEST_FAILED" | "AI_SERVICE_UNAVAILABLE" | "AI_INVALID_RESPONSE" | "AI_REQUEST_TIMEOUT",
    public readonly status?: number,
    public readonly detail?: string,
  ) {
    super(code);
  }
}

type ApiRecord = Record<string, unknown>;

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 180_000;
const MAX_DETAIL_LENGTH = 300;

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildSystemPrompt(language: GenerateDSLParams["language"]): string {
  const outputLanguage = language === "ja" ? "Japanese" : "English";
  return `You convert a UI reference image into a Roblox UI design blueprint.

Return ONLY one JSON object. No Markdown code fences. No explanation before or after.

The object MUST have exactly these 9 top-level keys, and nothing else:
Screen, Layout, Spacing, Color, Typography, Visual, Components, Interactions, RobloxRules

CRITICAL: Do NOT return a Roblox Instance tree. Objects containing "className",
"properties", or "children" are wrong and will be rejected. You are producing a
design specification, not Roblox instances.

Copy the structure of the template you are given exactly. Keep every key and every
nesting level. Change only the VALUES so they describe the reference image.

Use ${outputLanguage} for human-readable labels where relevant.`;
}

function buildUserPrompt(params: GenerateDSLParams): string {
  return `Analyze the attached UI reference image, then return this exact JSON structure
with the values adjusted to describe that image.

TEMPLATE (copy this shape exactly, change only the values):
${JSON.stringify(DefaultDSL, null, 2)}

Roblox UI rules to respect when choosing values:
${JSON.stringify(params.rules, null, 2)}

Additional user requirements:
${params.userPrompt || "None"}

Remember: return the template's structure with your values. Do not invent a different shape.`;
}

function redactSecrets(text: string): string {
  return text
    .replace(/\b(?:sk|xai|gsk|nvapi|sk-or|sk-ant)-[A-Za-z0-9_-]{8,}/gi, "***")
    .replace(/\bBearer\s+[A-Za-z0-9._-]{8,}/gi, "Bearer ***")
    .replace(/\bAIza[A-Za-z0-9_-]{10,}/g, "***");
}

function extractErrorDetail(body: string): string | undefined {
  const trimmed = body.trim();
  if (!trimmed) return undefined;

  let message = trimmed;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (isRecord(parsed)) {
      const errorField = parsed.error;
      if (isRecord(errorField) && typeof errorField.message === "string") message = errorField.message;
      else if (typeof errorField === "string") message = errorField;
      else if (typeof parsed.message === "string") message = parsed.message;
    }
  } catch {
    // Preserve a non-JSON response body after redacting possible secrets.
  }

  const redacted = redactSecrets(message).replace(/\s+/g, " ").trim();
  if (!redacted) return undefined;
  return redacted.length > MAX_DETAIL_LENGTH ? `${redacted.slice(0, MAX_DETAIL_LENGTH)}…` : redacted;
}

async function toRequestError(response: Response): Promise<LLMError> {
  const detail = extractErrorDetail(await response.text().catch(() => ""));
  if (response.status === 401 || response.status === 403) return new LLMError("AI_AUTHENTICATION_FAILED", response.status, detail);
  if (response.status === 404) return new LLMError("AI_MODEL_NOT_FOUND", response.status, detail);
  if (response.status === 429) return new LLMError("AI_RATE_LIMITED", response.status, detail);
  if (response.status >= 500) return new LLMError("AI_SERVICE_UNAVAILABLE", response.status, detail);
  return new LLMError("AI_REQUEST_FAILED", response.status, detail);
}

function requestTimeoutMs(): number {
  const configured = Number(process.env.LLM_TIMEOUT_MS);
  return Number.isInteger(configured) && configured >= 1_000 && configured <= MAX_TIMEOUT_MS ? configured : DEFAULT_TIMEOUT_MS;
}

function normalizeBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.toString().replace(/\/$/, "");
  } catch {
    throw new LLMError("AI_PROVIDER_INVALID");
  }
}

async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(requestTimeoutMs()) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") throw new LLMError("AI_REQUEST_TIMEOUT");
    throw new LLMError("AI_SERVICE_UNAVAILABLE");
  }
}

function getModel(): string {
  const model = process.env.LLM_MODEL?.trim();
  if (!model) throw new LLMError("AI_MODEL_NOT_CONFIGURED");
  return model;
}

function getOpenAICompatibleKey(): string {
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) throw new LLMError("AI_PROVIDER_NOT_CONFIGURED");
  return apiKey;
}

function extractChatCompletionText(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.choices) || !isRecord(value.choices[0])) {
    throw new LLMError("AI_INVALID_RESPONSE");
  }
  const message = value.choices[0].message;
  if (!isRecord(message) || typeof message.content !== "string" || !message.content.trim()) {
    throw new LLMError("AI_INVALID_RESPONSE");
  }
  return message.content;
}

async function callOpenAICompatible(params: GenerateDSLParams): Promise<string> {
  const apiKey = getOpenAICompatibleKey();
  const model = getModel();
  const baseUrl = normalizeBaseUrl(process.env.LLM_BASE_URL ?? DEFAULT_OPENAI_BASE_URL);
  const response = await request(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 8_000,
      messages: [
        { role: "system", content: buildSystemPrompt(params.language) },
        {
          role: "user",
          content: [
            { type: "text", text: buildUserPrompt(params) },
            { type: "image_url", image_url: { url: `data:${params.imageMimeType};base64,${params.imageBase64}` } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) throw await toRequestError(response);
  return extractChatCompletionText(await response.json());
}

async function callClaude(params: GenerateDSLParams): Promise<string> {
  const apiKey = process.env.LLM_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new LLMError("AI_PROVIDER_NOT_CONFIGURED");
  const response = await request("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: 8_000,
      system: buildSystemPrompt(params.language),
      messages: [{
        role: "user",
        content: [
          { type: "text", text: buildUserPrompt(params) },
          { type: "image", source: { type: "base64", media_type: params.imageMimeType, data: params.imageBase64 } },
        ],
      }],
    }),
  });

  if (!response.ok) throw await toRequestError(response);
  const json: unknown = await response.json();
  if (!isRecord(json) || !Array.isArray(json.content) || !isRecord(json.content[0]) || typeof json.content[0].text !== "string") {
    throw new LLMError("AI_INVALID_RESPONSE");
  }
  return json.content[0].text;
}

export async function callLLM(params: GenerateDSLParams): Promise<string> {
  const provider = (process.env.LLM_PROVIDER ?? "openai-compatible") as Provider;
  if (provider === "openai-compatible") return callOpenAICompatible(params);
  if (provider === "anthropic") return callClaude(params);
  throw new LLMError("AI_PROVIDER_INVALID");
}
