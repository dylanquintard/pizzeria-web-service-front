import { useLanguage } from "../../context/LanguageContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { getLocalizedSiteText } from "../../site/siteSettings";

export default function SiteFooter() {
  const { language } = useLanguage();
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || "Pizza Truck";
  const shortText = getLocalizedSiteText(settings.footer?.shortText, language, "").trim();
  const legalText = getLocalizedSiteText(settings.footer?.legalText, language, "").trim();
  const copyrightText = getLocalizedSiteText(
    settings.footer?.copyright,
    language,
    "All rights reserved."
  ).trim();
  const phone = String(settings.contact?.phone || "").trim();
  const email = String(settings.contact?.email || "").trim();
  const serviceArea = getLocalizedSiteText(settings.contact?.serviceArea, language, "").trim();

  return (
    <footer className="border-t border-white/10 bg-charcoal/70">
      <div className="section-shell py-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-saffron">{siteName}</p>
            {shortText ? <p className="mt-3 text-sm text-stone-300">{shortText}</p> : null}
            {legalText ? <p className="mt-3 text-xs text-stone-400">{legalText}</p> : null}
          </div>

          <div className="grid gap-2 text-sm text-stone-300">
            {serviceArea ? <p>{serviceArea}</p> : null}
            {phone ? <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-saffron">{phone}</a> : null}
            {email ? <a href={`mailto:${email}`} className="hover:text-saffron">{email}</a> : null}
          </div>
        </div>

        <p className="mt-6 text-xs text-stone-500">
          © {new Date().getFullYear()} {siteName}. {copyrightText}
        </p>
      </div>
    </footer>
  );
}
