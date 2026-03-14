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

function SectionCard({ eyebrow, title, description, children }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">{eyebrow}</p>
        <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
        {description ? <p className="mt-2 max-w-3xl text-sm text-stone-300">{description}</p> : null}
      </div>
      {children}
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
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return;

    try {
      setSaving(true);
      setMessage("");

      let defaultOgImageUrl = String(form.seo.defaultOgImageUrl || "").trim();
      if (form.seo.defaultOgImageFile) {
        const uploaded = await uploadGalleryImage(token, form.seo.defaultOgImageFile);
        defaultOgImageUrl = uploaded.imageUrl;
      }

      const payload = {
        siteName: form.siteName.trim(),
        siteTagline: form.siteTagline,
        siteDescription: form.siteDescription,
        contact: form.contact,
        social: form.social,
        seo: {
          defaultMetaTitle: form.seo.defaultMetaTitle,
          defaultMetaDescription: form.seo.defaultMetaDescription,
          defaultOgImageUrl,
          canonicalSiteUrl: form.seo.canonicalSiteUrl,
        },
        home: form.home,
        blog: form.blog,
        contactPage: form.contactPage,
        order: form.order,
        footer: form.footer,
        announcement: form.announcement,
      };

      const saved = await updateSiteSettings(token, payload);
      applySettings(saved);
      setForm(createFormFromSettings(saved));
      setMessage(tr("Informations du site enregistrees.", "Site information saved."));
      setMessageType("success");
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          tr("Impossible d'enregistrer les informations du site.", "Unable to save site information.")
      );
      setMessageType("error");
    } finally {
      setSaving(false);
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
          "Traduction anglaise generee. Vous pouvez relire puis enregistrer.",
          "English translation generated. You can review it and save."
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
            "Modifiez ici les informations visibles sur le site, les textes principaux, les coordonnees, le SEO global et le bandeau d'annonce.",
            "Edit the site-facing information here: main copy, contact details, global SEO and the announcement banner."
          )}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTranslateToEnglish}
            disabled={translating || saving}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard
          eyebrow={tr("Identite", "Identity")}
          title={tr("Nom, baseline et description", "Name, tagline and description")}
          description={tr(
            "Ces informations servent de base sur le site et dans certaines zones SEO.",
            "These details are used across the site and in some SEO areas."
          )}
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
        </SectionCard>

        <SectionCard
          eyebrow={tr("Coordonnees", "Contact details")}
          title={tr("Infos de contact", "Contact information")}
          description={tr(
            "Ces informations alimentent la page contact et les blocs de contact du site.",
            "These details power the contact page and contact blocks across the site."
          )}
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
        </SectionCard>

        <SectionCard
          eyebrow={tr("Reseaux", "Social media")}
          title={tr("Liens publics", "Public links")}
          description={tr(
            "Ces liens peuvent etre affiches dans la page contact ou d'autres blocs du site.",
            "These links can be displayed on the contact page or in other site sections."
          )}
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
        </SectionCard>

        <SectionCard
          eyebrow={tr("SEO global", "Global SEO")}
          title={tr("Meta par defaut", "Default metadata")}
          description={tr(
            "Utilise pour les metas globales, l'image de partage et l'URL canonique principale.",
            "Used for global metadata, the default sharing image and the main canonical URL."
          )}
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
                    onChange={(event) => updateNestedField("seo", "defaultOgImageUrl", event.target.value)}
                    className="rounded-2xl border border-white/15 bg-charcoal/70 px-4 py-3 text-sm text-white"
                  />
                </label>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow={tr("Accueil", "Home")}
          title={tr("Hero et reassurance", "Hero and reassurance")}
          description={tr(
            "Ces textes pilotent la zone hero de la page d'accueil.",
            "These copy blocks control the home page hero section."
          )}
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
        </SectionCard>

        <SectionCard
          eyebrow={tr("Annonce", "Announcement")}
          title={tr("Bandeau public", "Public banner")}
          description={tr(
            "Affiche un message en haut du site pour une information ponctuelle ou importante.",
            "Display a message at the top of the site for temporary or important updates."
          )}
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
        </SectionCard>

        <SectionCard
          eyebrow={tr("Blog", "Blog")}
          title={tr("Introduction du blog", "Blog introduction")}
          description={tr(
            "Ces textes pilotent le hero de la page blog.",
            "These texts control the blog page hero."
          )}
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
        </SectionCard>

        <SectionCard
          eyebrow={tr("Contact", "Contact")}
          title={tr("Page contact", "Contact page")}
          description={tr(
            "Textes d'introduction visibles sur la page contact.",
            "Introductory texts shown on the contact page."
          )}
        >
          <div className="grid gap-4">
            <LocalizedField
              label={tr("Titre de page", "Page title")}
              value={form.contactPage.pageTitle}
              onChange={(locale, value) => updateNestedLocalized("contactPage", "pageTitle", locale, value)}
            />
            <LocalizedField
              label={tr("Texte principal", "Main text")}
              value={form.contactPage.introText}
              multiline
              onChange={(locale, value) => updateNestedLocalized("contactPage", "introText", locale, value)}
            />
            <LocalizedField
              label={tr("Texte secondaire", "Secondary text")}
              value={form.contactPage.helperText}
              multiline
              onChange={(locale, value) => updateNestedLocalized("contactPage", "helperText", locale, value)}
            />
          </div>
        </SectionCard>

        <SectionCard
          eyebrow={tr("Commande", "Ordering")}
          title={tr("Messages du parcours commande", "Order flow messages")}
          description={tr(
            "Petits textes visibles pendant la selection du retrait et la confirmation finale.",
            "Short texts shown during pickup selection and final confirmation."
          )}
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
        </SectionCard>

        <SectionCard
          eyebrow={tr("Footer", "Footer")}
          title={tr("Pied de page", "Footer")}
          description={tr(
            "Textes globaux affiches en bas du site.",
            "Global texts shown at the bottom of the site."
          )}
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
        </SectionCard>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving || translating}
            className="rounded-full bg-saffron px-5 py-3 text-xs font-bold uppercase tracking-wide text-charcoal transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? tr("Enregistrement...", "Saving...") : tr("Enregistrer", "Save")}
          </button>
        </div>
      </form>
    </div>
  );
}
