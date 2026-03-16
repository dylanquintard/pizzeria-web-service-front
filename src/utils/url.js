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

export function getGalleryThumbnailUrl(value) {
  const normalized = normalizeInput(value).replace(/\\/g, "/");
  if (!normalized) return "";

  if (normalized.includes("/gallery/thumbs/gallery-")) {
    return normalized;
  }

  if (normalized.includes("/uploads/gallery/gallery-")) {
    return normalized.replace(
      "/uploads/gallery/gallery-",
      "/uploads/gallery/thumbs/gallery-"
    );
  }

  if (normalized.includes("/gallery/gallery-")) {
    return normalized.replace("/gallery/gallery-", "/gallery/thumbs/gallery-");
  }

  return normalized;
}
