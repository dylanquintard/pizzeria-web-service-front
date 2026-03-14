import {
  DEFAULT_SITE_SETTINGS,
  getLocalizedSiteText,
  mergeSiteSettings,
} from "./siteSettings";

test("site settings defaults use the generic site identity", () => {
  expect(DEFAULT_SITE_SETTINGS.siteName).toBe("Camion Pizza Italienne");
  expect(DEFAULT_SITE_SETTINGS.seo.defaultMetaTitle.fr).not.toMatch(/Pizza Truck/i);
  expect(DEFAULT_SITE_SETTINGS.siteDescription.fr).not.toMatch(/Metz/i);
});

test("mergeSiteSettings falls back to the default site identity", () => {
  const merged = mergeSiteSettings({});

  expect(merged.siteName).toBe(DEFAULT_SITE_SETTINGS.siteName);
  expect(merged.contact.serviceArea.fr).toBe("Moselle et alentours");
});

test("getLocalizedSiteText returns the requested language when available", () => {
  const value = { fr: "Bonjour", en: "Hello" };

  expect(getLocalizedSiteText(value, "fr", "")).toBe("Bonjour");
  expect(getLocalizedSiteText(value, "en", "")).toBe("Hello");
});
