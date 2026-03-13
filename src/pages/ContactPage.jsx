import ContactPanel from "../components/contact/ContactPanel";
import SeoHead from "../components/seo/SeoHead";
import SeoInternalLinks from "../components/seo/SeoInternalLinks";
import { useLanguage } from "../context/LanguageContext";
import { buildBaseFoodEstablishmentJsonLd } from "../seo/jsonLd";

export default function ContactPage() {
  const { tr } = useLanguage();
  const title = tr(
    "Contact | Camion pizza napolitaine en Moselle",
    "Contact | Neapolitan pizza truck in Moselle"
  );
  const description = tr(
    "Contactez Pizza Truck en Moselle. Informations de contact, Instagram et formulaire pour vos demandes.",
    "Get in touch with Pizza Truck in Moselle. Contact details, Instagram and a contact form for your questions."
  );

  return (
    <div className="section-shell space-y-8 pb-20 pt-10">
      <SeoHead
        title={title}
        description={description}
        pathname="/contact"
        jsonLd={buildBaseFoodEstablishmentJsonLd({
          pagePath: "/contact",
          pageName: title,
          description,
        })}
      />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-saffron">{tr("Contact", "Contact")}</p>
        <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-5xl">
          {tr("Nous contacter", "Get in touch")}
        </h1>
        <p className="max-w-3xl text-sm text-stone-300 sm:text-base">
          {tr(
            "Pour toute question sur la commande ou les horaires d'ouvertures, contacte-nous directement.",
            "For any question about ordering or opening hours, contact us directly."
          )}
        </p>
      </header>

      <ContactPanel />

      <SeoInternalLinks />
    </div>
  );
}
