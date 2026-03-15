import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS, getLocalizedSiteText } from "../../site/siteSettings";

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.6 1.6-1.6H16V4.8c-.3 0-.9-.1-1.8-.1-2.8 0-4.7 1.7-4.7 4.8V11H7v3h2.5v7h4z" />
    </svg>
  );
}

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.8 3c.3 1.9 1.4 3.3 3.2 4 .7.3 1.4.4 2 .4V11c-1 0-2-.2-2.9-.6v5.6c0 3.2-2.5 5.4-5.7 5.4-3 0-5.4-2.3-5.4-5.2 0-3.2 2.7-5.6 5.9-5.1v3.2c-1.2-.4-2.5.5-2.5 1.9 0 1.1.9 2 2.1 2 1.2 0 2-.9 2-2.1V3h3.3z" />
    </svg>
  );
}

export default function SiteFooter() {
  const { language } = useLanguage();
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || DEFAULT_SITE_SETTINGS.siteName;
  const shortText = getLocalizedSiteText(settings.footer?.shortText, language, "").trim();
  const legalText = getLocalizedSiteText(settings.footer?.legalText, language, "").trim();
  const copyrightText = getLocalizedSiteText(
    settings.footer?.copyright,
    language,
    "All rights reserved."
  ).trim();
  const headerLogoUrl = String(settings.seo?.headerLogoUrl || "").trim();
  const phone = String(settings.contact?.phone || "").trim();
  const email = String(settings.contact?.email || "").trim();
  const serviceArea = getLocalizedSiteText(settings.contact?.serviceArea, language, "").trim();
  const socialLinks = [
    {
      href: String(settings.social?.instagramUrl || "").trim(),
      label: "Instagram",
      Icon: InstagramIcon,
    },
    {
      href: String(settings.social?.facebookUrl || "").trim(),
      label: "Facebook",
      Icon: FacebookIcon,
    },
    {
      href: String(settings.social?.tiktokUrl || "").trim(),
      label: "TikTok",
      Icon: TikTokIcon,
    },
  ].filter((item) => item.href);
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
            {headerLogoUrl ? (
              <img
                src={headerLogoUrl}
                alt={siteName}
                className="mt-3 h-14 w-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            ) : null}
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
            {socialLinks.length > 0 ? (
              <div className="pt-2">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                  {language === "en" ? "Social" : "Reseaux"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {socialLinks.map(({ href, label, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-stone-100 transition hover:border-saffron/40 hover:bg-saffron/10 hover:text-saffron"
                      aria-label={label}
                      title={label}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-6 text-xs text-stone-500">
          (c) {new Date().getFullYear()} {siteName}. {copyrightText}
        </p>
      </div>
    </footer>
  );
}
