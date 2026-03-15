function normalizeLocationPart(value) {
  return typeof value === "string" ? value.trim() : "";
}

function matchesCityName(name, city) {
  return Boolean(name && city) && name.localeCompare(city, "fr", { sensitivity: "base" }) === 0;
}

export function getLocationDisplayName(location, fallback = "") {
  const name = normalizeLocationPart(location?.name);
  const street = normalizeLocationPart(location?.addressLine1);
  const city = normalizeLocationPart(location?.city);
  const addressLine2 = normalizeLocationPart(location?.addressLine2);

  if (street && (!name || matchesCityName(name, city))) {
    return street;
  }

  return name || street || addressLine2 || city || fallback;
}
