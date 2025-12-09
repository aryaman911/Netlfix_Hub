// js/auth.js
import { apiRequest, setAuthToken, setUserInfo, clearAuthToken, isAdmin } from "./api.js";

export async function login(usernameOrEmail, password) {
  // Adjust payload to match your backend /auth/login schema
  const payload = {
    username: usernameOrEmail,
    password: password,
  };

  const data = await apiRequest("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // EXPECTED RESPONSE SHAPE (adjust backend if needed):
  // {
  //   "access_token": "jwt",
  //   "token_type": "bearer",
  //   "user_id": 1,
  //   "roles": ["USER"] or ["ADMIN"]
  // }

  setAuthToken(data.access_token);
  setUserInfo({
    roles: data.roles || [],
    user_id: data.user_id,
  });

  return data;
}

export async function signup(email, username, password) {
  const payload = {
    email,
    username,
    password,
  };

  // Adjust to your actual /auth/register endpoint
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return data;
}

export function logout() {
  clearAuthToken();
  window.location.href = "index.html";
}

// Route guards
export function requireAuth() {
  if (!localStorage.getItem("access_token")) {
    window.location.href = "index.html";
  }
}

export function requireAdmin() {
  requireAuth();
  if (!isAdmin()) {
    window.location.href = "home.html";
  }
}
