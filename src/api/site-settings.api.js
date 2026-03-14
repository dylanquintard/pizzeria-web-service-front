import api, { authConfig } from "./http";

export const getPublicSiteSettings = async () => {
  const response = await api.get("/site-settings/public");
  return response.data;
};

export const getAdminSiteSettings = async (token) => {
  const response = await api.get("/site-settings/admin", authConfig(token));
  return response.data;
};

export const translateSiteSettingsToEnglish = async (token, payload) => {
  const response = await api.post(
    "/site-settings/translate-to-english",
    payload,
    authConfig(token)
  );
  return response.data;
};

export const updateSiteSettings = async (token, payload) => {
  const response = await api.put("/site-settings", payload, authConfig(token));
  return response.data;
};
