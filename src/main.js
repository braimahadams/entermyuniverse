import { content } from "./content.js";
import "./styles.css";

const ICONS = {
  instagram: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.7"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.2 3h2.1c.2 1.7 1.2 3.2 2.7 4.1A6.4 6.4 0 0 0 21 8.1v2.2a8.3 8.3 0 0 1-3.7-1v6.2a6.5 6.5 0 1 1-6.5-6.5c.3 0 .7 0 1 .1v2.4a4.1 4.1 0 1 0 2.9 3.9V3z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.2 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6H17.5V4.1C17.1 4 15.9 3.9 14.6 3.9c-2.7 0-4.5 1.6-4.5 4.7v2.6H7.2v3.2h2.9V22h4.1z"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatFollowers(n) {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}M followers`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}K followers`;
  }
  return `${n.toLocaleString("en-US")} followers`;
}

function formatViews(n) {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}M views`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}K views`;
  }
  return `${n.toLocaleString("en-US")} views`;
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function renderHero() {
  const portrait = content.portrait?.trim();
  const media = portrait
    ? `<img class="portrait" src="${escapeHtml(portrait)}" alt="${escapeHtml(content.name)}" width="96" height="96" decoding="async" />`
    : `<div class="portrait-mark" aria-hidden="true">${escapeHtml(initials(content.name))}</div>`;

  return `
    <header class="hero rise" style="--d:40ms">
      <div class="portrait-wrap">${media}</div>
      <h1 class="hero__name">${escapeHtml(content.name)}</h1>
      ${content.tagline?.trim() ? `<p class="hero__tagline">${escapeHtml(content.tagline.trim())}</p>` : ""}
    </header>
  `;
}

function renderSocials() {
  const items = (content.socials || []).filter((s) => s?.url?.trim());
  if (!items.length) return "";

  const rows = items
    .map((social, index) => {
      const followers = formatFollowers(social.followers);
      const icon = ICONS[social.id] || ICONS.chevron;
      return `
        <li class="rise" style="--d:${120 + index * 60}ms">
          <a
            class="social"
            href="${escapeHtml(social.url.trim())}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(social.label)}${followers ? ` — ${followers}` : ""}"
          >
            <span class="social__icon">${icon}</span>
            <span class="social__meta">
              <span class="social__label">${escapeHtml(social.label)}</span>
              ${followers ? `<span class="social__followers">${escapeHtml(followers)}</span>` : ""}
            </span>
            <span class="social__chevron">${ICONS.chevron}</span>
          </a>
        </li>
      `;
    })
    .join("");

  return `<ul class="socials">${rows}</ul>`;
}

function renderFeatured() {
  const videos = (content.featuredVideos || []).filter(
    (v) => v?.cover?.trim() && v?.url?.trim(),
  );
  if (!videos.length) return "";

  const cards = videos
    .slice(0, 3)
    .map((video, index) => {
      const badge =
        (video.campaign && String(video.campaign).trim()) ||
        formatViews(video.views);
      const title = video.title?.trim() || "Featured video";
      return `
        <a
          class="video rise"
          style="--d:${280 + index * 70}ms"
          href="${escapeHtml(video.url.trim())}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="${escapeHtml(title)}${badge ? ` — ${badge}` : ""}"
        >
          <img
            class="video__cover"
            src="${escapeHtml(video.cover.trim())}"
            alt=""
            loading="lazy"
            decoding="async"
          />
          ${badge ? `<span class="video__badge">${escapeHtml(badge)}</span>` : ""}
        </a>
      `;
    })
    .join("");

  return `
    <section class="section" aria-labelledby="featured-heading">
      <h2 id="featured-heading" class="section__title rise" style="--d:260ms">Featured videos</h2>
      <div class="videos">${cards}</div>
    </section>
  `;
}

function renderCtas() {
  const bookUrl = content.bookCallUrl?.trim();
  const email = content.brandEmail?.trim();
  const parts = [];

  if (bookUrl) {
    parts.push(`
      <a
        class="btn btn--primary rise"
        style="--d:420ms"
        href="${escapeHtml(bookUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >${escapeHtml(content.bookCallLabel || "Book a creator strategy call")}</a>
    `);
  }

  if (email) {
    parts.push(`
      <a
        class="btn btn--ghost rise"
        style="--d:480ms"
        href="mailto:${escapeHtml(email)}"
      >${escapeHtml(content.brandEmailLabel || "Brand inquiries")}</a>
    `);
  }

  if (!parts.length) return "";
  return `<div class="ctas">${parts.join("")}</div>`;
}

function renderScoutViral() {
  const project = content.scoutviral;
  if (!project?.url?.trim()) return "";

  return `
    <section class="section" aria-labelledby="scoutviral-heading">
      <a
        class="project rise"
        style="--d:540ms"
        href="${escapeHtml(project.url.trim())}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <p class="project__eyebrow">${escapeHtml(project.role || "Founder & CEO")}</p>
        <h2 id="scoutviral-heading" class="project__title">${escapeHtml(project.title || "ScoutViral")}</h2>
        <p class="project__body">${escapeHtml(project.body)}</p>
        <span class="project__cta">
          ${escapeHtml(project.cta || "Explore ScoutViral")}
          ${ICONS.arrow}
        </span>
      </a>
    </section>
  `;
}

function renderFooter() {
  return `
    <footer class="footer rise" style="--d:620ms">
      <p>Enter My Universe</p>
    </footer>
  `;
}

function render() {
  const root = document.getElementById("app");
  if (!root) return;

  root.innerHTML = [
    renderHero(),
    renderSocials(),
    renderFeatured(),
    renderCtas(),
    renderScoutViral(),
    renderFooter(),
  ].join("");

  if (content.metaTitle) document.title = content.metaTitle;
}

render();
