// js/api.js
import { API_BASE_URL } from "./config.js";

// ============================================
// TOKEN MANAGEMENT
// ============================================

export function getAuthToken() {
  return localStorage.getItem("access_token");
}

export function setAuthToken(token) {
  localStorage.setItem("access_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_roles");
  localStorage.removeItem("user_id");
}

export function setUserInfo({ roles = [], user_id = null }) {
  localStorage.setItem("user_roles", JSON.stringify(roles));
  if (user_id !== null) {
    localStorage.setItem("user_id", String(user_id));
  }
}

export function getUserId() {
  return localStorage.getItem("user_id");
}

export function getUserRoles() {
  const raw = localStorage.getItem("user_roles");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isAdmin() {
  const roles = getUserRoles();
  return roles.includes("ADMIN") || roles.includes("EMPLOYEE");
}

export function isLoggedIn() {
  return !!getAuthToken();
}

// ============================================
// API REQUEST HELPERS
// ============================================

/**
 * Generic JSON API request
 */
export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("Content-Type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = (data && data.detail) || (typeof data === "string" ? data : "Request failed");
    throw new Error(message);
  }

  return data;
}

/**
 * Form data request (for OAuth2 login)
 */
export async function apiFormRequest(path, formData, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (formData instanceof URLSearchParams) {
    headers.set("Content-Type", "application/x-www-form-urlencoded");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    ...options,
    headers,
    body: formData,
  });

  const contentType = response.headers.get("Content-Type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = (data && data.detail) || (typeof data === "string" ? data : "Request failed");
    throw new Error(message);
  }

  return data;
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = "success") {
  const container = getToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === "success" ? "✓" : type === "error" ? "✕" : "!"}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatRating(rating) {
  if (rating == null) return "N/A";
  return Number(rating).toFixed(1);
}

export function generateStars(rating, max = 5) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  let html = "";
  
  for (let i = 0; i < fullStars; i++) {
    html += '<span class="star filled">★</span>';
  }
  if (hasHalf) {
    html += '<span class="star filled">★</span>';
  }
  for (let i = fullStars + (hasHalf ? 1 : 0); i < max; i++) {
    html += '<span class="star">★</span>';
  }
  
  return html;
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
