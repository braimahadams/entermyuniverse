import { content } from "./content.js";
import "./styles.css";

const ICONS = {
  instagram: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.7"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.2 3h2.1c.2 1.7 1.2 3.2 2.7 4.1A6.4 6.4 0 0 0 21 8.1v2.2a8.3 8.3 0 0 1-3.7-1v6.2a6.5 6.5 0 1 1-6.5-6.5c.3 0 .7 0 1 .1v2.4a4.1 4.1 0 1 0 2.9 3.9V3z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.2 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6H17.5V4.1C17.1 4 15.9 3.9 14.6 3.9c-2.7 0-4.5 1.6-4.5 4.7v2.6H7.2v3.2h2.9V22h4.1z"/></svg>`,
  snapchat: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3c2.7 0 4.4 1.8 4.4 4.3 0 .5 0 1.7.4 2.1.3.3.8.3 1.3.5.7.2 1.1.6 1.1 1.1 0 .6-.5 1-1.2 1.3-.3.1-.6.3-.6.6 0 .7.8 1.4 1.5 1.8.5.3.7.6.7 1 0 .7-.7 1.2-1.7 1.2-.4 0-.8-.1-1.2-.2-.5-.2-1-.3-1.5 0-.8.5-1.6 1.1-3.2 1.1s-2.4-.6-3.2-1.1c-.5-.3-1-.2-1.5 0-.4.1-.8.2-1.2.2-1 0-1.7-.5-1.7-1.2 0-.4.2-.7.7-1 .7-.4 1.5-1.1 1.5-1.8 0-.3-.3-.5-.6-.6-.7-.3-1.2-.7-1.2-1.3 0-.5.4-.9 1.1-1.1.5-.2 1-.2 1.3-.5.4-.4.4-1.6.4-2.1C7.6 4.8 9.3 3 12 3z"/></svg>`,
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

function formatAudience(social) {
  if (social?.audienceLabel?.trim()) return social.audienceLabel.trim();
  const n = social?.followers;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  const unit = social?.id === "youtube" ? "subscribers" : "followers";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}M+ ${unit}`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}K+ ${unit}`;
  }
  return `${n.toLocaleString("en-US")} ${unit}`;
}

function totalChipLabel() {
  if (content.totalFollowersLabel?.trim()) return content.totalFollowersLabel.trim();
  const n = content.totalFollowers;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}M+`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}K+`;
  }
  return `${n.toLocaleString("en-US")}+`;
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function renderTotal() {
  const label = totalChipLabel();
  if (!label) return "";
  return `
    <div class="rise mb-4 flex justify-center" style="--d:20ms">
      <p class="total-chip inline-flex items-center gap-2 rounded-full border border-line-bright/80 bg-bone/[0.04] px-4 py-1.5 text-[0.72rem] font-semibold tracking-[0.18em] text-ember uppercase">
        <span class="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden="true"></span>
        ${escapeHtml(label)}
        <span class="tracking-[0.12em] text-bone-faint normal-case">across platforms</span>
      </p>
    </div>
  `;
}

function renderHero() {
  const portrait = content.portrait?.trim();
  const media = portrait
    ? `<img class="h-full w-full object-cover" src="${escapeHtml(portrait)}" alt="${escapeHtml(content.name)}" width="112" height="112" decoding="async" />`
    : `<div class="grid h-full w-full place-items-center bg-gradient-to-b from-[#1a1412] to-ink-2 font-[family-name:var(--font-display)] text-[2rem] text-ember" aria-hidden="true">${escapeHtml(initials(content.name))}</div>`;

  return `
    <header class="hero rise mb-5 flex flex-col items-center text-center" style="--d:60ms">
      <div class="portrait-halo relative z-0 mb-4 h-28 w-28 overflow-hidden rounded-full border-2 border-bone/15 shadow-[0_0_0_1px_rgba(255,122,69,0.12)]">
        ${media}
      </div>
      <h1 class="m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,2.55rem)] font-normal leading-none tracking-[-0.03em]">
        ${escapeHtml(content.name)}
      </h1>
      ${
        content.tagline?.trim()
          ? `<p class="mt-2 text-[0.98rem] font-medium tracking-[0.01em] text-bone-dim">${escapeHtml(content.tagline.trim())}</p>`
          : ""
      }
    </header>
  `;
}

function renderSocials() {
  const items = (content.socials || []).filter((s) => s?.url?.trim());
  if (!items.length) return "";

  const rows = items
    .map((social, index) => {
      const audience = formatAudience(social);
      const icon = ICONS[social.id] || ICONS.chevron;
      return `
        <li class="rise" style="--d:${140 + index * 55}ms">
          <a
            class="link-row flex min-h-[56px] items-center gap-3.5 rounded-2xl border border-line bg-gradient-to-br from-bone/[0.06] to-bone/[0.02] px-4 py-3.5 backdrop-blur-md [-webkit-tap-highlight-color:transparent]"
            href="${escapeHtml(social.url.trim())}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(social.label)}${audience ? ` — ${audience}` : ""}"
          >
            <span class="icon-pop grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-ink-3/80 text-bone [&_svg]:h-[22px] [&_svg]:w-[22px]">
              ${icon}
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
              <span class="text-[1.02rem] font-semibold tracking-[-0.015em]">${escapeHtml(social.label)}</span>
              ${audience ? `<span class="text-[0.78rem] font-medium text-bone-faint">${escapeHtml(audience)}</span>` : `<span class="text-[0.78rem] font-medium text-bone-faint">Open profile</span>`}
            </span>
            <span class="shrink-0 text-bone-faint [&_svg]:h-[18px] [&_svg]:w-[18px]">${ICONS.chevron}</span>
          </a>
        </li>
      `;
    })
    .join("");

  return `<ul class="mb-6 flex list-none flex-col gap-3 p-0">${rows}</ul>`;
}

function renderFeatured() {
  const videos = (content.featuredVideos || []).filter(
    (v) => v?.cover?.trim() && v?.url?.trim(),
  );
  if (!videos.length) return "";

  const cards = videos
    .slice(0, 3)
    .map((video, index) => {
      const views =
        typeof video.views === "number" && video.views > 0
          ? formatAudience({ followers: video.views, audienceLabel: "" }).replace(
              /followers|subscribers/g,
              "views",
            )
          : "";
      const badge =
        (video.campaign && String(video.campaign).trim()) || views;
      const title = video.title?.trim() || "Featured video";
      return `
        <a
          class="rise relative block aspect-[9/16] overflow-hidden rounded-[14px] border border-line bg-ink-3 transition-transform duration-300 [-webkit-tap-highlight-color:transparent] hover:-translate-y-0.5"
          style="--d:${320 + index * 70}ms"
          href="${escapeHtml(video.url.trim())}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="${escapeHtml(title)}${badge ? ` — ${badge}` : ""}"
        >
          <img class="h-full w-full object-cover" src="${escapeHtml(video.cover.trim())}" alt="" loading="lazy" decoding="async" />
          ${badge ? `<span class="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-ink/75 px-1.5 py-1 text-center text-[0.65rem] font-semibold leading-tight backdrop-blur-sm">${escapeHtml(badge)}</span>` : ""}
        </a>
      `;
    })
    .join("");

  return `
    <section class="mb-6" aria-labelledby="featured-heading">
      <h2 id="featured-heading" class="rise mb-3 text-[0.7rem] font-semibold tracking-[0.18em] text-bone-faint uppercase" style="--d:300ms">Featured videos</h2>
      <div class="grid grid-cols-3 gap-2.5">${cards}</div>
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
        class="rise inline-flex min-h-[52px] items-center justify-center rounded-full bg-gradient-to-br from-ember to-ember-deep px-5 py-3 text-center text-[0.95rem] font-semibold tracking-[-0.01em] text-ink shadow-[0_10px_28px_rgba(255,122,69,0.22)] transition hover:brightness-105 active:scale-[0.985] [-webkit-tap-highlight-color:transparent]"
        style="--d:460ms"
        href="${escapeHtml(bookUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >${escapeHtml(content.bookCallLabel || "Book a creator strategy call")}</a>
    `);
  }

  if (email) {
    parts.push(`
      <a
        class="rise inline-flex min-h-[52px] items-center justify-center rounded-full border border-line-bright bg-transparent px-5 py-3 text-center text-[0.95rem] font-semibold tracking-[-0.01em] text-bone transition hover:border-ember/45 hover:bg-ember/[0.08] active:scale-[0.985] [-webkit-tap-highlight-color:transparent]"
        style="--d:510ms"
        href="mailto:${escapeHtml(email)}"
      >${escapeHtml(content.brandEmailLabel || "Brand inquiries")}</a>
    `);
  }

  if (!parts.length) return "";
  return `<div class="mb-6 flex flex-col gap-3">${parts.join("")}</div>`;
}

function renderScoutViral() {
  const project = content.scoutviral;
  if (!project?.url?.trim()) return "";
  const logo = project.logo?.trim();

  return `
    <section class="mb-2" aria-labelledby="scoutviral-heading">
      <a
        class="link-row rise block rounded-[22px] border border-line bg-gradient-to-br from-bone/[0.06] to-bone/[0.015] p-5 sm:p-6 [-webkit-tap-highlight-color:transparent]"
        style="--d:560ms"
        href="${escapeHtml(project.url.trim())}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div class="flex items-start gap-4">
          ${
            logo
              ? `<span class="icon-pop mt-0.5 grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-ink-3/90 shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                  <img src="${escapeHtml(logo)}" alt="" width="56" height="56" class="h-full w-full object-cover" decoding="async" />
                </span>`
              : ""
          }
          <div class="min-w-0 flex-1">
            <p class="m-0 mb-1.5 text-[0.68rem] font-semibold tracking-[0.16em] text-ember uppercase">${escapeHtml(project.role || "Founder & CEO")}</p>
            <h2 id="scoutviral-heading" class="m-0 font-[family-name:var(--font-display)] text-[1.7rem] leading-none tracking-[-0.02em] sm:text-[1.85rem]">${escapeHtml(project.title || "ScoutViral")}</h2>
            <p class="mt-3 mb-0 max-w-none text-[0.95rem] leading-relaxed text-bone-dim sm:text-[1rem] sm:leading-[1.55]">${escapeHtml(project.body)}</p>
            <span class="mt-4 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-bone">
              ${escapeHtml(project.cta || "Explore ScoutViral")}
              <span class="text-ember [&_svg]:h-4 [&_svg]:w-4">${ICONS.arrow}</span>
            </span>
          </div>
        </div>
      </a>
    </section>
  `;
}

function renderFooter() {
  return `
    <footer class="rise mt-8 text-center text-[0.75rem] tracking-[0.04em] text-bone-faint" style="--d:640ms">
      <p class="m-0">Enter My Universe</p>
    </footer>
  `;
}

function render() {
  const root = document.getElementById("app");
  if (!root) return;

  root.innerHTML = [
    renderTotal(),
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
