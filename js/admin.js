// js/admin.js
import { requireAdmin, logout } from "./auth.js";
import { apiRequest } from "./api.js";

requireAdmin();

const logoutBtn = document.getElementById("btn-logout");
logoutBtn.addEventListener("click", () => logout());

const form = document.getElementById("series-form");
const seriesIdInput = document.getElementById("series-id");
const nameInput = document.getElementById("series-name");
const langInput = document.getElementById("series-language");
const countryInput = document.getElementById("series-country");
const releaseInput = document.getElementById("series-release");
const numEpInput = document.getElementById("series-num-episodes");
const descInput = document.getElementById("series-description");
const maturityInput = document.getElementById("series-maturity");
const posterInput = document.getElementById("series-poster");
const bannerInput = document.getElementById("series-banner");
const errorEl = document.getElementById("series-form-error");
const resetBtn = document.getElementById("series-reset-btn");

const tableBody = document.getElementById("series-table-body");

async function loadSeries() {
  try {
    // FIXED: endpoint is /series (router prefix is set in main.py)
    const data = await apiRequest("/series");
    renderTable(data);
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="6" class="error-text">Failed to load series: ${err.message}</td></tr>`;
  }
}

function renderTable(seriesList) {
  tableBody.innerHTML = "";
  if (!seriesList.length) {
    tableBody.innerHTML = `<tr><td colspan="6" class="muted">No series yet.</td></tr>`;
    return;
  }

  seriesList.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.series_id}</td>
      <td>${s.name}</td>
      <td>${s.origin_country || ""}</td>
      <td>${s.language_code || ""}</td>
      <td>${s.release_date || ""}</td>
      <td>
        <button class="btn-small" data-action="edit" data-id="${s.series_id}">Edit</button>
        <button class="btn-small btn-danger" data-action="delete" data-id="${s.series_id}">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");

  if (action === "edit") {
    await loadSeriesIntoForm(id);
  } else if (action === "delete") {
    if (confirm("Delete this series?")) {
      await deleteSeries(id);
    }
  }
});

async function loadSeriesIntoForm(id) {
  errorEl.textContent = "";
  try {
    const s = await apiRequest(`/series/${id}`);
    seriesIdInput.value = s.series_id;
    nameInput.value = s.name || "";
    langInput.value = s.language_code || "";
    countryInput.value = s.origin_country || "";
    releaseInput.value = s.release_date || "";
    numEpInput.value = s.num_episodes || "";
    descInput.value = s.description || "";
    maturityInput.value = s.maturity_rating || "";
    posterInput.value = s.poster_url || "";
    bannerInput.value = s.banner_url || "";
  } catch (err) {
    errorEl.textContent = err.message || "Failed to load series.";
  }
}

async function deleteSeries(id) {
  errorEl.textContent = "";
  try {
    await apiRequest(`/series/${id}`, { method: "DELETE" });
    await loadSeries();
  } catch (err) {
    errorEl.textContent = err.message || "Failed to delete series.";
  }
}

resetBtn.addEventListener("click", () => {
  seriesIdInput.value = "";
  form.reset();
  errorEl.textContent = "";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";

  // FIXED: field names match backend schema
  const payload = {
    name: nameInput.value.trim(),
    language_code: langInput.value.trim(),
    origin_country: countryInput.value.trim(),
    release_date: releaseInput.value,
    num_episodes: Number(numEpInput.value) || 0,
    description: descInput.value.trim() || null,
    maturity_rating: maturityInput.value.trim() || null,
    poster_url: posterInput.value.trim() || null,
    banner_url: bannerInput.value.trim() || null,
  };

  const id = seriesIdInput.value;

  try {
    if (id) {
      await apiRequest(`/series/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiRequest("/series", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    form.reset();
    seriesIdInput.value = "";
    await loadSeries();
  } catch (err) {
    errorEl.textContent = err.message || "Failed to save series.";
  }
});

loadSeries();
