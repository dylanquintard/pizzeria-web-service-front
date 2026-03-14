import { Link } from "react-router-dom";
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
  const mainLinks = [
    { to: "/", label: language === "en" ? "Home" : "Accueil" },
    { to: "/menu", label: language === "en" ? "Menu" : "Menu" },
    { to: "/planing", label: language === "en" ? "Opening hours" : "Horaires" },
    { to: "/contact", label: language === "en" ? "Contact" : "Contact" },
    { to: "/blog", label: "Blog" },
  ];
  const legalLinks = [
    {
      to: "/mentions-legales",
      label: language === "en" ? "Legal notice" : "Mentions legales",
    },
    {
      to: "/confidentialite",
      label: language === "en" ? "Privacy" : "Confidentialite",
    },
    {
      to: "/conditions-generales",
      label: language === "en" ? "Terms" : "Conditions",
    },
  ];

  return (
    <footer className="border-t border-white/10 bg-charcoal/70">
      <div className="section-shell py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-saffron">{siteName}</p>
            {shortText ? <p className="mt-3 text-sm text-stone-300">{shortText}</p> : null}
            {legalText ? <p className="mt-3 text-xs text-stone-400">{legalText}</p> : null}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
              {language === "en" ? "Navigation" : "Navigation"}
            </p>
            <div className="mt-3 grid gap-2 text-sm text-stone-300">
              {mainLinks.map((link) => (
                <Link key={link.to} to={link.to} className="hover:text-saffron">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
              {language === "en" ? "Legal" : "Legal"}
            </p>
            <div className="mt-3 grid gap-2 text-sm text-stone-300">
              {legalLinks.map((link) => (
                <Link key={link.to} to={link.to} className="hover:text-saffron">
                  {link.label}
                </Link>
              ))}
            </div>
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
