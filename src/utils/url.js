function normalizeInput(value) {
  return String(value || "").trim();
}

function parseUrl(value) {
  try {
    return new URL(value);
  } catch (_err) {
    return null;
  }
}

export function isAbsoluteHttpUrl(value) {
  const normalized = normalizeInput(value);
  if (!normalized) return false;
  const parsed = parseUrl(normalized);
  if (!parsed) return false;
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

export function sanitizeAbsoluteHttpUrl(value) {
  const normalized = normalizeInput(value);
  if (!normalized) return "";
  return isAbsoluteHttpUrl(normalized) ? normalized : "";
}

export function sanitizeMediaUrl(value) {
  const normalized = normalizeInput(value);
  if (!normalized) return "";
  if (normalized.startsWith("/") && !normalized.startsWith("//")) {
    return normalized;
  }
  return sanitizeAbsoluteHttpUrl(normalized);
}

export function sanitizeInternalOrAbsoluteHttpUrl(value) {
  const normalized = normalizeInput(value);
  if (!normalized) return "";
  if (normalized.startsWith("/") && !normalized.startsWith("//")) {
    return normalized;
  }
  return sanitizeAbsoluteHttpUrl(normalized);
}
