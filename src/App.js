import { Suspense, lazy, useContext, useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigationType,
  useParams,
} from "react-router-dom";
import Header from "./components/layout/Header";
import MobileStickyCta from "./components/layout/MobileStickyCta";
import SiteFooter from "./components/layout/SiteFooter";
import MainContent from "./components/layout/MainContent";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { SiteSettingsProvider } from "./context/SiteSettingsContext";
import { ThemeProvider } from "./context/ThemeContext";
import Home from "./pages/Home";
import { slugifyCity } from "./seo/localLandingContent";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const Gallery = lazy(() => import("./pages/Gallery"));
const GalleryAdmin = lazy(() => import("./pages/GalleryAdmin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Menu = lazy(() => import("./pages/Menu"));
const TourneeCamion = lazy(() => import("./pages/planing"));
const APropos = lazy(() => import("./pages/APropos"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LocalSeoPage = lazy(() => import("./pages/LocalSeoPage"));
const CitySeoPage = lazy(() => import("./pages/CitySeoPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const BlogAdmin = lazy(() => import("./pages/BlogAdmin"));
const FaqAdmin = lazy(() => import("./pages/FaqAdmin"));
const SiteInfoAdmin = lazy(() => import("./pages/SiteInfoAdmin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Ingredients = lazy(() => import("./pages/Ingredients"));
const Locations = lazy(() => import("./pages/Locations"));
const Login = lazy(() => import("./pages/Login"));
const LegalMentions = lazy(() => import("./pages/LegalMentions"));
const Order = lazy(() => import("./pages/Order"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const OrderList = lazy(() => import("./pages/OrderList"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Products = lazy(() => import("./pages/Products"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const TimeslotsAdmin = lazy(() => import("./pages/Timeslots"));
const PrintAdmin = lazy(() => import("./pages/PrintAdmin"));
const TicketsAdmin = lazy(() => import("./pages/TicketsAdmin"));
const Users = lazy(() => import("./pages/Users"));
const UserOrders = lazy(() => import("./pages/UsersOrders"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

const PrivateRoute = ({ children }) => {
  const { token, loading } = useContext(AuthContext);
  const { tr } = useLanguage();

  if (loading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { token, user, loading } = useContext(AuthContext);
  const { tr } = useLanguage();

  if (loading) return <p>{tr("Chargement...", "Loading...")}</p>;
  if (!token || user?.role !== "ADMIN") return <Navigate to="/login" replace />;
  return children;
};

const AppLayout = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (location.hash) return;
      if (navigationType === "POP") return;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname, location.search, location.hash, navigationType]);

  return (
    <>
      <Header />
      <MainContent>
        <Outlet />
      </MainContent>
      {!isAdminRoute ? <SiteFooter /> : null}
      {!isAdminRoute ? <MobileStickyCta /> : null}
    </>
  );
};

const LegacyPizzaCityRoute = () => {
  const { city } = useParams();
  const slug = slugifyCity(city);
  if (!slug) {
    return <NotFound />;
  }
  return <Navigate to={`/pizza-${slug}`} replace />;
};

const LegacyBlogArticleRoute = () => {
  const { slug } = useParams();
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) {
    return <Navigate to="/blog" replace />;
  }
  return <Navigate to={`/${normalizedSlug}`} replace />;
};

const CatchAllRoute = () => {
  const location = useLocation();
  const pathname = String(location.pathname || "").toLowerCase();
  const pizzaMatch = /^\/pizza-([a-z0-9-]+)$/.exec(pathname);
  if (pizzaMatch) {
    return <CitySeoPage forcedCitySlug={pizzaMatch[1]} />;
  }

  const blogMatch = /^\/([a-z0-9-]+)$/.exec(pathname);
  if (blogMatch) {
    return <BlogArticle forcedSlug={blogMatch[1]} />;
  }

  return <NotFound />;
};

function AppRoutes() {
  const { tr } = useLanguage();
  const loadingFallback = (
    <p className="section-shell py-8 text-sm text-stone-400">
      {tr("Chargement...", "Loading...")}
    </p>
  );

  return (
    <Suspense fallback={loadingFallback}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/planing" element={<TourneeCamion />} />
          <Route path="/tournee-camion" element={<Navigate to="/planing" replace />} />
          <Route path="/tournee" element={<Navigate to="/planing" replace />} />
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/mentions-legales" element={<LegalMentions />} />
          <Route path="/confidentialite" element={<PrivacyPolicy />} />
          <Route path="/conditions-generales" element={<TermsPage />} />
          <Route path="/blog/:slug" element={<LegacyBlogArticleRoute />} />
          <Route path="/pizza-napolitaine-thionville" element={<LocalSeoPage cityKey="thionville" />} />
          <Route path="/food-truck-pizza-moselle" element={<LocalSeoPage cityKey="moselle" />} />
          <Route path="/pizza" element={<CitySeoPage />} />
          <Route path="/pizza/:city" element={<LegacyPizzaCityRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route
            path="/order"
            element={
              <PrivateRoute>
                <Order />
              </PrivateRoute>
            }
          />
          <Route
            path="/order/confirmation"
            element={
              <PrivateRoute>
                <OrderConfirmation />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/userorders"
            element={
              <PrivateRoute>
                <UserOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Dashboard>
                  <p className="rounded-xl border border-stone-200 bg-white p-4 text-stone-700">
                    {tr(
                      "Selectionnez une section dans le menu administrateur.",
                      "Select an admin section from the menu."
                    )}
                  </p>
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <Dashboard>
                  <OrderList />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Dashboard>
                  <Users />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/menu"
            element={
              <AdminRoute>
                <Dashboard>
                  <Products />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/ingredients"
            element={
              <AdminRoute>
                <Dashboard>
                  <Ingredients />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/locations"
            element={
              <AdminRoute>
                <Dashboard>
                  <Locations />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/timeslots"
            element={
              <AdminRoute>
                <Dashboard>
                  <TimeslotsAdmin />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/gallery"
            element={
              <AdminRoute>
                <Dashboard>
                  <GalleryAdmin />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/print"
            element={
              <AdminRoute>
                <Dashboard>
                  <PrintAdmin />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <AdminRoute>
                <Dashboard>
                  <TicketsAdmin />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/blog"
            element={
              <AdminRoute>
                <Dashboard>
                  <BlogAdmin />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/faq"
            element={
              <AdminRoute>
                <Dashboard>
                  <FaqAdmin />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/site-info"
            element={
              <AdminRoute>
                <Dashboard>
                  <SiteInfoAdmin />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/editproduct/:id"
            element={
              <AdminRoute>
                <Dashboard>
                  <EditProduct />
                </Dashboard>
              </AdminRoute>
            }
          />
          <Route path="*" element={<CatchAllRoute />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <SiteSettingsProvider>
            <CartProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </CartProvider>
          </SiteSettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
