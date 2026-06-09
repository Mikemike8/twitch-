export const maxAnalyticsMetadataBytes = 2048;

export function serializeAnalyticsMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return null;

  const metadataJson = JSON.stringify(metadata);
  if (Buffer.byteLength(metadataJson, "utf8") > maxAnalyticsMetadataBytes) {
    throw new Error("Analytics metadata is too large");
  }

  return metadataJson;
}
