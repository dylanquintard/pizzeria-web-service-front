export const ADMIN_NAV_LINKS = Object.freeze([
  { to: "/admin/orders", labelFr: "Commandes", labelEn: "Orders" },
  { to: "/admin/menu", labelFr: "Menu", labelEn: "Menu" },
  { to: "/admin/locations", labelFr: "Adresses", labelEn: "Addresses" },
  { to: "/admin/timeslots", labelFr: "Horaires", labelEn: "Schedules" },
  { to: "/admin/print", labelFr: "Camions & Impressions", labelEn: "Trucks & Printing" },
  { to: "/admin/tickets", labelFr: "Tickets", labelEn: "Tickets" },
  { to: "/admin/users", labelFr: "Clients", labelEn: "Users" },
  { to: "/admin/gallery", labelFr: "Galerie", labelEn: "Gallery" },
  { to: "/admin/blog", labelFr: "Blog", labelEn: "Blog" },
  { to: "/admin/faq", labelFr: "FAQ", labelEn: "FAQ" },
  { to: "/admin/site-info", labelFr: "Info site", labelEn: "Site info" },
]);

export function getAdminNavLinks(tr) {
  return ADMIN_NAV_LINKS.map((item) => ({
    to: item.to,
    label: typeof tr === "function" ? tr(item.labelFr, item.labelEn) : item.labelFr,
  }));
}
