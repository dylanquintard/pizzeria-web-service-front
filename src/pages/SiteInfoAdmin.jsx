import { useContext, useEffect, useMemo, useState } from "react";
import {
  getAdminSiteSettings,
  translateSiteSettingsToEnglish,
  updateSiteSettings,
} from "../api/site-settings.api";
import { uploadGalleryImage } from "../api/gallery.api";
import { AuthContext } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useSiteSettings } from "../context/SiteSettingsContext";
import { mergeSiteSettings } from "../site/siteSettings";

function createFormFromSettings(settings) {
  const merged = mergeSiteSettings(settings);
  return {
    ...merged,
    seo: {
      ...merged.seo,
      defaultOgImageFile: null,
      defaultOgImagePreviewUrl: merged.seo.defaultOgImageUrl || "",
    },
  };
}

function AccordionSection({
  eyebrow,
  title,
  description,
  isOpen,
  onToggle,
  onSave,
  saving,
  saveLabel,
  children,
}) {
  return (
    <section
      className={`rounded-[1.75rem] border p-5 transition sm:p-6 ${
        isOpen
          ? "border-saffron/40 bg-white/8 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-4 text-left">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-saffron">{eyebrow}</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
          {description ? <p className="mt-2 max-w-3xl text-sm text-stone-300">{description}</p> : null}
        </div>
        <span
          className={`mt-1 inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border text-lg font-bold transition ${
            isOpen
              ? "border-saffron/40 bg-saffron text-charcoal"
              : "border-white/15 bg-black/20 text-white"
          }`}
          aria-hidden="true"
        >
          {isOpen ? "^" : "v"}
        </span>
      </button>

      {isOpen ? (
        <div className="mt-5 border-t border-white/10 pt-5">
          {children}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-full bg-saffron px-5 py-3 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? `${saveLabel}...` : saveLabel}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function LocalizedField({ label, value, onChange, multiline = false }) {
  const inputClassName =
    "rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white";

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <label className="grid gap-1 text-xs text-stone-300">
        <span>{label} FR</span>
        {multiline ? (
          <textarea
            rows={4}
            value={value.fr}
            onChange={(event) => onChange("fr", event.target.value)}
            className={`${inputClassName} leading-7`}
          />
        ) : (
          <input
            value={value.fr}
            onChange={(event) => onChange("fr", event.target.value)}
            className={inputClassName}
          />
        )}
      </label>
      <label className="grid gap-1 text-xs text-stone-300">
        <span>{label} EN</span>
        {multiline ? (
          <textarea
            rows={4}
            value={value.en}
            onChange={(event) => onChange("en", event.target.value)}
            className={`${inputClassName} leading-7`}
          />
        ) : (
          <input
            value={value.en}
            onChange={(event) => onChange("en", event.target.value)}
            className={inputClassName}
          />
        )}
      </label>
    </div>
  );
}

export default function SiteInfoAdmin() {
  const { token, user, loading: authLoading } = useContext(AuthContext);
  const { tr } = useLanguage();
  const { settings: publicSettings, applySettings } = useSiteSettings();

  const [form, setForm] = useState(() => createFormFromSettings(publicSettings));
  const [loading, setLoading] = useState(false);
  const [savingSectionId, setSavingSectionId] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [openSectionId, setOpenSectionId] = useState("identity");

  useEffect(() => {
    if (authLoading || !token || user?.role !== "ADMIN") return;

    let active = true;
    async function loadAdminSettings() {
      try {
        setLoading(true);
        const data = await getAdminSiteSettings(token);
        if (active) {
          setForm(createFormFromSettings(data));
        }
      } catch (err) {
        if (active) {
          setMessage(
            err?.response?.data?.error ||
              tr("Impossible de charger les informations du site.", "Unable to load site information.")
          );
          setMessageType("error");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAdminSettings();
    return () => {
      active = false;
    };
  }, [authLoading, token, tr, user]);

  const feedbackClassName = useMemo(() => {
    if (messageType === "success") {
      return "border-emerald-300/35 bg-emerald-500/10 text-emerald-100";
    }
    if (messageType === "error") {
      return "border-red-400/35 bg-red-500/10 text-red-100";
    }
    return "border-white/10 bg-white/5 text-stone-100";
  }, [messageType]);

  const saveButtonLabel = tr("Sauvegarder", "Save");

  const updateRootField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateRootLocalized = (field, locale, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [locale]: value,
      },
    }));
  };

  const updateNestedField = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateNestedLocalized = (section, field, locale, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          [locale]: value,
        },
      },
    }));
  };

  const handleOgImageUpload = (file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        defaultOgImageFile: file,
        defaultOgImagePreviewUrl: previewUrl,
      },
    }));
  };

  const toggleSection = (sectionId) => {
    setOpenSectionId((current) => (current === sectionId ? null : sectionId));
  };

  const saveSection = async (sectionId) => {
    if (!token) return;

    try {
      setSavingSectionId(sectionId);
      setMessage("");

      let payload = null;

      switch (sectionId) {
        case "identity":
          payload = {
            siteName: form.siteName.trim(),
            siteTagline: form.siteTagline,
            siteDescription: form.siteDescription,
          };
          break;
        case "contact":
          payload = { contact: form.contact };
          break;
        case "social":
          payload = { social: form.social };
          break;
        case "seo": {
          let defaultOgImageUrl = String(form.seo.defaultOgImageUrl || "").trim();
          if (form.seo.defaultOgImageFile) {
            const uploaded = await uploadGalleryImage(token, form.seo.defaultOgImageFile);
            defaultOgImageUrl = uploaded.imageUrl;
          }

          payload = {
            seo: {
              defaultMetaTitle: form.seo.defaultMetaTitle,
              defaultMetaDescription: form.seo.defaultMetaDescription,
              defaultOgImageUrl,
              canonicalSiteUrl: form.seo.canonicalSiteUrl,
            },
          };
          break;
        }
        case "home":
          payload = { home: form.home };
          break;
        case "announcement":
          payload = { announcement: form.announcement };
          break;
        case "blog":
          payload = { blog: form.blog };
          break;
        case "contactPage":
          payload = { contactPage: form.contactPage };
          break;
        case "order":
          payload = { order: form.order };
          break;
        case "footer":
          payload = { footer: form.footer };
          break;
        default:
          throw new Error("Unknown section");
      }

      const saved = await updateSiteSettings(token, payload);
      applySettings(saved);
      setForm(createFormFromSettings(saved));
      setMessage(tr("Section enregistree.", "Section saved."));
      setMessageType("success");
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          tr("Impossible d'enregistrer cette section.", "Unable to save this section.")
      );
      setMessageType("error");
    } finally {
      setSavingSectionId(null);
    }
  };

  const handleTranslateToEnglish = async () => {
    if (!token) return;

    try {
      setTranslating(true);
      setMessage("");
      const translated = await translateSiteSettingsToEnglish(token, {
        siteName: form.siteName,
        siteTagline: form.siteTagline,
        siteDescription: form.siteDescription,
        contact: form.contact,
        social: form.social,
        seo: {
          defaultMetaTitle: form.seo.defaultMetaTitle,
          defaultMetaDescription: form.seo.defaultMetaDescription,
          defaultOgImageUrl: form.seo.defaultOgImageUrl,
          canonicalSiteUrl: form.seo.canonicalSiteUrl,
        },
        home: form.home,
        blog: form.blog,
        contactPage: form.contactPage,
        order: form.order,
        footer: form.footer,
        announcement: form.announcement,
      });

      setForm((prev) => ({
        ...prev,
        ...translated,
        seo: {
          ...prev.seo,
          ...translated.seo,
          defaultOgImageFile: prev.seo.defaultOgImageFile,
          defaultOgImagePreviewUrl:
            prev.seo.defaultOgImagePreviewUrl || translated.seo?.defaultOgImageUrl || "",
        },
      }));
      setMessage(
        tr(
          "Traduction anglaise generee. Vous pouvez relire puis sauvegarder section par section.",
          "English translation generated. You can review it and save section by section."
        )
      );
      setMessageType("success");
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          tr(
            "Impossible de generer la traduction anglaise.",
            "Unable to generate the English translation."
          )
      );
      setMessageType("error");
    } finally {
      setTranslating(false);
    }
  };

  if (authLoading || loading) {
    return <p>{tr("Chargement...", "Loading...")}</p>;
  }

  if (!token || user?.role !== "ADMIN") {
    return <p>{tr("Acces refuse : administrateur uniquement", "Access denied: admin only")}</p>;
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.16),_transparent_36%),linear-gradient(135deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02))] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">
          {tr("Info site", "Site info")}
        </p>
        <h2 className="mt-2 text-3xl font-bold text-white">
          {tr("Informations globales du site", "Global site information")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-300">
          {tr(
            "Chaque bloc s'ouvre au clic, se referme au reclique, et se sauvegarde separement pour garder une administration claire.",
            "Each block opens on click, closes when clicked again, and saves independently for a cleaner admin experience."
          )}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTranslateToEnglish}
            disabled={translating || Boolean(savingSectionId)}
            className="rounded-full border border-white/20 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {translating
              ? tr("Generation de l'anglais...", "Generating English...")
              : tr("Generer l'anglais", "Generate English")}
          </button>
        </div>
      </header>

      {message ? (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${feedbackClassName}`}>{message}</div>
      ) : null}

      <div className="space-y-6">
        <AccordionSection
          eyebrow={tr("Identite", "Identity")}
          title={tr("Nom, baseline et description", "Name, tagline and description")}
          description={tr(
            "Base du site et de plusieurs zones SEO.",
            "Base content used across the site and several SEO areas."
          )}
          isOpen={openSectionId === "identity"}
          onToggle={() => toggleSection("identity")}
          onSave={() => saveSection("identity")}
          saving={savingSectionId === "identity"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4">
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Nom du site", "Site name")}</span>
              <input
                value={form.siteName}
                onChange={(event) => updateRootField("siteName", event.target.value)}
                className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              />
            </label>

            <LocalizedField
              label={tr("Baseline", "Tagline")}
              value={form.siteTagline}
              onChange={(locale, value) => updateRootLocalized("siteTagline", locale, value)}
            />

            <LocalizedField
              label={tr("Description courte", "Short description")}
              value={form.siteDescription}
              multiline
              onChange={(locale, value) => updateRootLocalized("siteDescription", locale, value)}
            />
          </div>
        </AccordionSection>

        <AccordionSection
          eyebrow={tr("Coordonnees", "Contact details")}
          title={tr("Infos de contact", "Contact information")}
          description={tr(
            "Coordonnees visibles sur le site et dans la page contact.",
            "Contact details shown across the site and on the contact page."
          )}
          isOpen={openSectionId === "contact"}
          onToggle={() => toggleSection("contact")}
          onSave={() => saveSection("contact")}
          saving={savingSectionId === "contact"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("Telephone", "Phone")}</span>
              <input
                type="tel"
                value={form.contact.phone}
                onChange={(event) => updateNestedField("contact", "phone", event.target.value)}
                className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>Email</span>
              <input
                type="email"
                value={form.contact.email}
                onChange={(event) => updateNestedField("contact", "email", event.target.value)}
                className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300 lg:col-span-2">
              <span>{tr("Adresse affichee", "Displayed address")}</span>
              <input
                value={form.contact.address}
                onChange={(event) => updateNestedField("contact", "address", event.target.value)}
                className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300 lg:col-span-2">
              <span>{tr("Lien Google Maps", "Google Maps link")}</span>
              <input
                type="url"
                value={form.contact.mapsUrl}
                onChange={(event) => updateNestedField("contact", "mapsUrl", event.target.value)}
                className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              />
            </label>
          </div>

          <div className="mt-4">
            <LocalizedField
              label={tr("Zone desservie", "Service area")}
              value={form.contact.serviceArea}
              onChange={(locale, value) =>
                setForm((prev) => ({
                  ...prev,
                  contact: {
                    ...prev.contact,
                    serviceArea: {
                      ...prev.contact.serviceArea,
                      [locale]: value,
                    },
                  },
                }))
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          eyebrow={tr("Reseaux", "Social media")}
          title={tr("Liens publics", "Public links")}
          description={tr(
            "Liens utilises dans la page contact et les zones de confiance.",
            "Links used in the contact page and trust areas."
          )}
          isOpen={openSectionId === "social"}
          onToggle={() => toggleSection("social")}
          onSave={() => saveSection("social")}
          saving={savingSectionId === "social"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid gap-1 text-xs text-stone-300">
              <span>Instagram</span>
              <input
                type="url"
                value={form.social.instagramUrl}
                onChange={(event) => updateNestedField("social", "instagramUrl", event.target.value)}
                className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>Facebook</span>
              <input
                type="url"
                value={form.social.facebookUrl}
                onChange={(event) => updateNestedField("social", "facebookUrl", event.target.value)}
                className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              />
            </label>
            <label className="grid gap-1 text-xs text-stone-300">
              <span>TikTok</span>
              <input
                type="url"
                value={form.social.tiktokUrl}
                onChange={(event) => updateNestedField("social", "tiktokUrl", event.target.value)}
                className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              />
            </label>
          </div>
        </AccordionSection>

        <AccordionSection
          eyebrow={tr("SEO global", "Global SEO")}
          title={tr("Meta par defaut", "Default metadata")}
          description={tr(
            "Meta title, meta description, image de partage et URL canonique.",
            "Meta title, meta description, sharing image and canonical URL."
          )}
          isOpen={openSectionId === "seo"}
          onToggle={() => toggleSection("seo")}
          onSave={() => saveSection("seo")}
          saving={savingSectionId === "seo"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4">
            <LocalizedField
              label={tr("Meta title par defaut", "Default meta title")}
              value={form.seo.defaultMetaTitle}
              onChange={(locale, value) => updateNestedLocalized("seo", "defaultMetaTitle", locale, value)}
            />

            <LocalizedField
              label={tr("Meta description par defaut", "Default meta description")}
              value={form.seo.defaultMetaDescription}
              multiline
              onChange={(locale, value) =>
                updateNestedLocalized("seo", "defaultMetaDescription", locale, value)
              }
            />

            <label className="grid gap-1 text-xs text-stone-300">
              <span>{tr("URL canonique du site", "Canonical site URL")}</span>
              <input
                type="url"
                value={form.seo.canonicalSiteUrl}
                onChange={(event) => updateNestedField("seo", "canonicalSiteUrl", event.target.value)}
                className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
              <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20">
                {form.seo.defaultOgImagePreviewUrl || form.seo.defaultOgImageUrl ? (
                  <img
                    src={form.seo.defaultOgImagePreviewUrl || form.seo.defaultOgImageUrl}
                    alt={tr("Image de partage", "Sharing image")}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-stone-400">
                    {tr("Aucune image definie.", "No image set.")}
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1 text-xs text-stone-300">
                  <span>{tr("Uploader l'image de partage", "Upload sharing image")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleOgImageUpload(event.target.files?.[0] || null)}
                    className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white file:mr-3 file:rounded-full file:border-0 file:bg-saffron file:px-3 file:py-2 file:text-xs file:font-bold file:text-charcoal"
                  />
                </label>
                <label className="grid gap-1 text-xs text-stone-300">
                  <span>{tr("URL image actuelle", "Current image URL")}</span>
                  <input
                    value={form.seo.defaultOgImageUrl}
                    onChange={(event) => {
                      updateNestedField("seo", "defaultOgImageUrl", event.target.value);
                      updateNestedField("seo", "defaultOgImagePreviewUrl", event.target.value);
                    }}
                    className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
                  />
                </label>
              </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          eyebrow={tr("Accueil", "Home")}
          title={tr("Hero et reassurance", "Hero and reassurance")}
          description={tr(
            "Textes principaux de la page d'accueil.",
            "Main copy for the home page."
          )}
          isOpen={openSectionId === "home"}
          onToggle={() => toggleSection("home")}
          onSave={() => saveSection("home")}
          saving={savingSectionId === "home"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4">
            <LocalizedField
              label={tr("Titre hero", "Hero title")}
              value={form.home.heroTitle}
              onChange={(locale, value) => updateNestedLocalized("home", "heroTitle", locale, value)}
            />
            <LocalizedField
              label={tr("Sous-titre hero", "Hero subtitle")}
              value={form.home.heroSubtitle}
              multiline
              onChange={(locale, value) => updateNestedLocalized("home", "heroSubtitle", locale, value)}
            />
            <LocalizedField
              label={tr("Bouton principal", "Primary button")}
              value={form.home.primaryCtaLabel}
              onChange={(locale, value) =>
                updateNestedLocalized("home", "primaryCtaLabel", locale, value)
              }
            />
            <LocalizedField
              label={tr("Bouton secondaire", "Secondary button")}
              value={form.home.secondaryCtaLabel}
              onChange={(locale, value) =>
                updateNestedLocalized("home", "secondaryCtaLabel", locale, value)
              }
            />
            <LocalizedField
              label={tr("Texte de reassurance", "Reassurance text")}
              value={form.home.reassuranceText}
              onChange={(locale, value) =>
                updateNestedLocalized("home", "reassuranceText", locale, value)
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          eyebrow={tr("Annonce", "Announcement")}
          title={tr("Bandeau public", "Public banner")}
          description={tr(
            "Message ponctuel affiche en haut du site.",
            "Temporary message displayed at the top of the site."
          )}
          isOpen={openSectionId === "announcement"}
          onToggle={() => toggleSection("announcement")}
          onSave={() => saveSection("announcement")}
          saving={savingSectionId === "announcement"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4">
            <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100">
              <input
                type="checkbox"
                checked={form.announcement.enabled}
                onChange={(event) => updateNestedField("announcement", "enabled", event.target.checked)}
              />
              <span>{tr("Activer le bandeau", "Enable banner")}</span>
            </label>

            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <label className="grid gap-1 text-xs text-stone-300">
                <span>{tr("Type", "Type")}</span>
                <select
                  value={form.announcement.variant}
                  onChange={(event) => updateNestedField("announcement", "variant", event.target.value)}
                  className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
                >
                  <option value="info">{tr("Info", "Info")}</option>
                  <option value="alert">{tr("Alerte", "Alert")}</option>
                  <option value="success">{tr("Succes", "Success")}</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs text-stone-300">
                <span>{tr("Lien du bandeau", "Banner link")}</span>
                <input
                  value={form.announcement.linkUrl}
                  onChange={(event) => updateNestedField("announcement", "linkUrl", event.target.value)}
                  className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
                />
              </label>
            </div>

            <LocalizedField
              label={tr("Texte du bandeau", "Banner text")}
              value={form.announcement.text}
              multiline
              onChange={(locale, value) =>
                updateNestedLocalized("announcement", "text", locale, value)
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          eyebrow={tr("Blog", "Blog")}
          title={tr("Introduction du blog", "Blog introduction")}
          description={tr(
            "Textes d'introduction visibles sur la page blog.",
            "Introductory texts displayed on the blog page."
          )}
          isOpen={openSectionId === "blog"}
          onToggle={() => toggleSection("blog")}
          onSave={() => saveSection("blog")}
          saving={savingSectionId === "blog"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4">
            <LocalizedField
              label={tr("Titre blog", "Blog title")}
              value={form.blog.introTitle}
              onChange={(locale, value) => updateNestedLocalized("blog", "introTitle", locale, value)}
            />
            <LocalizedField
              label={tr("Texte d'introduction", "Intro text")}
              value={form.blog.introText}
              multiline
              onChange={(locale, value) => updateNestedLocalized("blog", "introText", locale, value)}
            />
          </div>
        </AccordionSection>

        <AccordionSection
          eyebrow={tr("Contact", "Contact")}
          title={tr("Page contact", "Contact page")}
          description={tr(
            "Textes d'introduction de la page contact.",
            "Introductory text for the contact page."
          )}
          isOpen={openSectionId === "contactPage"}
          onToggle={() => toggleSection("contactPage")}
          onSave={() => saveSection("contactPage")}
          saving={savingSectionId === "contactPage"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4">
            <LocalizedField
              label={tr("Titre de page", "Page title")}
              value={form.contactPage.pageTitle}
              onChange={(locale, value) =>
                updateNestedLocalized("contactPage", "pageTitle", locale, value)
              }
            />
            <LocalizedField
              label={tr("Texte principal", "Main text")}
              value={form.contactPage.introText}
              multiline
              onChange={(locale, value) =>
                updateNestedLocalized("contactPage", "introText", locale, value)
              }
            />
            <LocalizedField
              label={tr("Texte secondaire", "Secondary text")}
              value={form.contactPage.helperText}
              multiline
              onChange={(locale, value) =>
                updateNestedLocalized("contactPage", "helperText", locale, value)
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          eyebrow={tr("Commande", "Ordering")}
          title={tr("Messages du parcours commande", "Order flow messages")}
          description={tr(
            "Petits textes de guidage dans la commande.",
            "Short guidance texts inside the order flow."
          )}
          isOpen={openSectionId === "order"}
          onToggle={() => toggleSection("order")}
          onSave={() => saveSection("order")}
          saving={savingSectionId === "order"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4">
            <LocalizedField
              label={tr("Texte aide retrait", "Pickup help text")}
              value={form.order.pickupIntroText}
              multiline
              onChange={(locale, value) => updateNestedLocalized("order", "pickupIntroText", locale, value)}
            />
            <LocalizedField
              label={tr("Texte confirmation", "Confirmation text")}
              value={form.order.pickupConfirmationText}
              multiline
              onChange={(locale, value) =>
                updateNestedLocalized("order", "pickupConfirmationText", locale, value)
              }
            />
          </div>
        </AccordionSection>

        <AccordionSection
          eyebrow={tr("Footer", "Footer")}
          title={tr("Pied de page", "Footer")}
          description={tr(
            "Textes visibles en bas du site.",
            "Texts displayed at the bottom of the site."
          )}
          isOpen={openSectionId === "footer"}
          onToggle={() => toggleSection("footer")}
          onSave={() => saveSection("footer")}
          saving={savingSectionId === "footer"}
          saveLabel={saveButtonLabel}
        >
          <div className="grid gap-4">
            <LocalizedField
              label={tr("Texte principal", "Main text")}
              value={form.footer.shortText}
              multiline
              onChange={(locale, value) => updateNestedLocalized("footer", "shortText", locale, value)}
            />
            <LocalizedField
              label={tr("Texte legal court", "Short legal text")}
              value={form.footer.legalText}
              multiline
              onChange={(locale, value) => updateNestedLocalized("footer", "legalText", locale, value)}
            />
            <LocalizedField
              label={tr("Copyright", "Copyright")}
              value={form.footer.copyright}
              onChange={(locale, value) => updateNestedLocalized("footer", "copyright", locale, value)}
            />
          </div>
        </AccordionSection>
      </div>
    </div>
  );
}
