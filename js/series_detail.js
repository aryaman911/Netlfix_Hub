// js/series_detail.js
import { requireAuth, logout } from "./auth.js";
import { apiRequest } from "./api.js";

requireAuth();

const logoutBtn = document.getElementById("btn-logout");
logoutBtn.addEventListener("click", () => logout());

const backBtn = document.getElementById("btn-back");
backBtn.addEventListener("click", () => window.history.back());

const urlParams = new URLSearchParams(window.location.search);
const seriesId = urlParams.get("id");

const seriesHeader = document.getElementById("series-header");
const episodesList = document.getElementById("episodes-list");
const feedbackSummary = document.getElementById("feedback-summary");
const feedbackList = document.getElementById("feedback-list");

const feedbackForm = document.getElementById("feedback-form");
const feedbackRating = document.getElementById("feedback-rating");
const feedbackText = document.getElementById("feedback-text");
const feedbackError = document.getElementById("feedback-error");

if (!seriesId) {
  seriesHeader.innerHTML = "<p class='error-text'>Missing series ID.</p>";
}

async function loadSeriesDetail() {
  try {
    // FIXED: endpoint is /series/{id}
    const data = await apiRequest(`/series/${seriesId}`);
    renderSeriesHeader(data);
    renderEpisodes(data.episodes || []);
  } catch (err) {
    seriesHeader.innerHTML = `<p class="error-text">Failed to load series: ${err.message}</p>`;
  }
}

function renderSeriesHeader(s) {
  // FIXED: field names match backend response
  const avgRating = s.avg_rating != null ? s.avg_rating.toFixed(1) : "N/A";

  seriesHeader.innerHTML = `
    <div class="series-banner" style="background-image:url('${s.banner_url || ""}')">
      <div class="series-banner-overlay">
        <img class="series-poster" src="${s.poster_url || ""}" alt="${s.name}" />
        <div class="series-meta">
          <h1>${s.name}</h1>
          <p class="muted">${s.origin_country || ""} • ${s.release_date || ""}</p>
          <p class="muted">Rating: ${avgRating} (${s.rating_count || 0} ratings)</p>
          <p>${s.description || ""}</p>
          <p class="muted">Maturity: ${s.maturity_rating || "N/A"}</p>
        </div>
      </div>
    </div>
  `;
}

function renderEpisodes(episodes) {
  episodesList.innerHTML = "";
  if (!episodes.length) {
    episodesList.innerHTML = `<li class="muted">No episodes found.</li>`;
    return;
  }
  episodes.forEach((ep) => {
    const li = document.createElement("li");
    li.className = "episode-item";
    li.innerHTML = `
      <div>
        <strong>Ep ${ep.episode_number}: ${ep.title}</strong>
        <p class="muted">${ep.synopsis || ""}</p>
      </div>
      <div class="muted">
        ${ep.runtime_minutes ? ep.runtime_minutes + " min" : ""}
      </div>
    `;
    episodesList.appendChild(li);
  });
}

async function loadFeedback() {
  try {
    // FIXED: endpoint is /series/{id}/feedback
    const data = await apiRequest(`/series/${seriesId}/feedback`);
    
    // Response shape:
    // { average_rating, rating_count, items: [ { rating, feedback_text, feedback_date, account_name } ] }

    feedbackSummary.textContent = `Average rating: ${
      data.average_rating != null ? data.average_rating.toFixed(1) : "N/A"
    } from ${data.rating_count || 0} ratings.`;

    feedbackList.innerHTML = "";
    if (!data.items || !data.items.length) {
      feedbackList.innerHTML = `<li class="muted">No feedback yet. Be the first!</li>`;
      return;
    }

    data.items.forEach((fb) => {
      const li = document.createElement("li");
      li.className = "feedback-item";
      li.innerHTML = `
        <div class="feedback-header">
          <strong>${fb.account_name || "Anonymous"}</strong>
          <span>${"★".repeat(fb.rating)}${"☆".repeat(5 - fb.rating)}</span>
        </div>
        <p class="muted">${fb.feedback_date || ""}</p>
        <p>${fb.feedback_text || ""}</p>
      `;
      feedbackList.appendChild(li);
    });
  } catch (err) {
    feedbackSummary.textContent = `Failed to load feedback: ${err.message}`;
  }
}

feedbackForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  feedbackError.textContent = "";

  const rating = Number(feedbackRating.value);
  const text = feedbackText.value.trim();

  if (!rating || rating < 1 || rating > 5) {
    feedbackError.textContent = "Rating must be between 1 and 5.";
    return;
  }

  try {
    await apiRequest(`/series/${seriesId}/feedback`, {
      method: "POST",
      body: JSON.stringify({
        rating,
        feedback_text: text || null,
      }),
    });

    feedbackText.value = "";
    feedbackRating.value = "";
    await Promise.all([loadSeriesDetail(), loadFeedback()]);
  } catch (err) {
    feedbackError.textContent = err.message || "Failed to submit feedback.";
  }
});

(async () => {
  if (seriesId) {
    await loadSeriesDetail();
    await loadFeedback();
  }
})();
