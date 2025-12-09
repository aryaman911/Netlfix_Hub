// js/auth.js
import { apiRequest, apiFormRequest, setAuthToken, setUserInfo, clearAuthToken, isAdmin, isLoggedIn } from "./api.js";

/**
 * Login with username/email and password
 */
export async function login(usernameOrEmail, password) {
  const formData = new URLSearchParams();
  formData.append("username", usernameOrEmail);
  formData.append("password", password);

  const data = await apiFormRequest("/auth/login", formData);

  setAuthToken(data.access_token);
  setUserInfo({
    roles: data.roles || [],
    user_id: data.user_id,
  });

  return data;
}

/**
 * Register a new account
 */
export async function signup(email, username, password) {
  const payload = { email, username, password };
  
  const data = await apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data;
}

/**
 * Logout and redirect
 */
export function logout() {
  clearAuthToken();
  window.location.href = "index.html";
}

/**
 * Route guard - redirect to login if not authenticated
 */
export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

/**
 * Route guard - redirect if not admin/employee
 */
export function requireAdmin() {
  if (!requireAuth()) return false;
  if (!isAdmin()) {
    window.location.href = "home.html";
    return false;
  }
  return true;
}

/**
 * Redirect if already logged in
 */
export function redirectIfLoggedIn(destination = "home.html") {
  if (isLoggedIn()) {
    window.location.href = destination;
    return true;
  }
  return false;
}

export { isAdmin, isLoggedIn };
