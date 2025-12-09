// js/auth.js
import { apiRequest, apiFormRequest, setAuthToken, setUserInfo, clearAuthToken, isAdmin } from "./api.js";

/**
 * Login with username/email and password
 * FIXED: 
 * - Endpoint is /auth/login (not /login)
 * - Must send as form data (x-www-form-urlencoded), not JSON
 */
export async function login(usernameOrEmail, password) {
  // OAuth2PasswordRequestForm expects form-urlencoded data with 'username' and 'password' fields
  const formData = new URLSearchParams();
  formData.append("username", usernameOrEmail);  // FastAPI OAuth2 expects 'username' field
  formData.append("password", password);

  // FIXED: correct endpoint
  const data = await apiFormRequest("/auth/login", formData);

  // Response shape from backend:
  // {
  //   "access_token": "jwt",
  //   "token_type": "bearer",
  //   "user_id": 1,
  //   "roles": ["USER"] or ["ADMIN", "EMPLOYEE"]
  // }

  setAuthToken(data.access_token);
  setUserInfo({
    roles: data.roles || [],
    user_id: data.user_id,
  });

  return data;
}

/**
 * Register a new account
 * FIXED: Endpoint is /auth/signup (not /auth/register)
 */
export async function signup(email, username, password) {
  const payload = {
    email,
    username,
    password,
  };

  // FIXED: correct endpoint
  const data = await apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data;
}

/**
 * Logout - clear stored auth data and redirect
 */
export function logout() {
  clearAuthToken();
  window.location.href = "index.html";
}

/**
 * Route guard - redirect to login if not authenticated
 */
export function requireAuth() {
  if (!localStorage.getItem("access_token")) {
    window.location.href = "index.html";
  }
}

/**
 * Route guard - redirect if not admin/employee
 */
export function requireAdmin() {
  requireAuth();
  if (!isAdmin()) {
    window.location.href = "home.html";
  }
}
