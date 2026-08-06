const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// WebP は一部のプロバイダ（NVIDIA NIM など）が非対応のため、意図的に除外している。
// 対応を追加する場合は docs/llm-providers.md の「WebP に注意」を参照すること。
const supportedMimeTypes = new Set(["image/jpeg", "image/png"]);

export type ParsedImage = {
  mimeType: "image/jpeg" | "image/png";
  rawBase64: string;
};

function detectImageMimeType(buffer: Buffer): ParsedImage["mimeType"] | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
}

export function parseImage(buffer: Buffer, declaredMimeType: string): ParsedImage {
  if (buffer.length === 0) throw new Error("EMPTY_IMAGE");
  if (buffer.length > MAX_IMAGE_SIZE_BYTES) throw new Error("IMAGE_TOO_LARGE");
  if (!supportedMimeTypes.has(declaredMimeType)) throw new Error("UNSUPPORTED_IMAGE_TYPE");

  const mimeType = detectImageMimeType(buffer);
  if (!mimeType || mimeType !== declaredMimeType) throw new Error("INVALID_IMAGE_DATA");

  return { mimeType, rawBase64: buffer.toString("base64") };
}
