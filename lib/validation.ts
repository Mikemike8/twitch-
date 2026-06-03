const limits = {
  bio: 500,
  chatMessage: 500,
  searchTerm: 100,
  streamName: 120,
} as const;

export function requireBoundedText(value: string, field: keyof typeof limits, allowEmpty = false) {
  const normalized = value.trim();
  if (!normalized && !allowEmpty) throw new Error(`${field} is required`);
  if (normalized.length > limits[field]) throw new Error(`${field} is too long`);
  return normalized;
}

export function boundedSearchTerm(value: string) {
  return value.trim().slice(0, limits.searchTerm);
}

export function boundedPage(value: string | undefined) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 10_000 ? page : 1;
}

export function requireUuid(value: string, field = "id") {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`${field} is invalid`);
  }
  return value;
}

export const inputLimits = limits;
