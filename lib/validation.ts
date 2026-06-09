const limits = {
  bio: 500,
  chatMessage: 500,
  creatorFilmDescription: 600,
  creatorFilmPosterUrl: 500,
  creatorFilmTitle: 120,
  searchTerm: 100,
  streamName: 120,
  username: 24,
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

const reservedUsernames = new Set(["api", "live", "search", "sign-in", "sign-up", "u"]);

export function requireUsername(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > limits.username) throw new Error("Username must be 3 to 24 characters");
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(normalized)) throw new Error("Username can only use letters, numbers, underscores, and hyphens");
  if (reservedUsernames.has(normalized)) throw new Error("Username is reserved");
  return normalized;
}

export const inputLimits = limits;
