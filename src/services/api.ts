import axios from "axios";

const API = axios.create({
 baseURL: "http://localhost:5000/api",
  // baseURL: "https://api.gowmithra.com/api",
  withCredentials: true,
});

// Clears stale/invalid token placeholders left by old sessions.
// Called once at app startup so users with a broken session are
// redirected to login cleanly rather than getting silent 403s.
function clearBadTokens() {
  const stored = localStorage.getItem("token");
  if (stored === "cookie-auth" || stored === "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}
clearBadTokens();

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && token !== "undefined" && token !== "cookie-auth") {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // 401 = session expired/invalid → clear tokens and force re-login
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    // 403 = authenticated but not authorized for this resource
    // Let the individual page/component handle and display the error.
    return Promise.reject(error);
  }
);

export default API;