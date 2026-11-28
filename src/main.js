import { content } from "./content.js";
import "./styles.css";

const ICONS = {
  /* Full-bleed brand tiles — container rounds the corners */
  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="ig-grad" cx="30%" cy="107%" r="150%"><stop offset="0%" stop-color="#fdf497"/><stop offset="45%" stop-color="#fd5949"/><stop offset="60%" stop-color="#d6249f"/><stop offset="90%" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" fill="url(#ig-grad)"/><rect x="5.4" y="5.4" width="13.2" height="13.2" rx="4" fill="none" stroke="#fff" stroke-width="1.85"/><circle cx="12" cy="12" r="3.55" fill="none" stroke="#fff" stroke-width="1.85"/><circle cx="16.85" cy="7.2" r="1.15" fill="#fff"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" fill="#010101"/><g transform="translate(1.2 1.4) scale(0.9)"><path fill="#25F4EE" d="M14.2 2.8h2.1c.2 1.7 1.2 3.2 2.7 4.1A6.4 6.4 0 0 0 21 7.9v2.2a8.3 8.3 0 0 1-3.7-1v6.2a6.5 6.5 0 1 1-6.5-6.5c.3 0 .7 0 1 .1v2.4a4.1 4.1 0 1 0 2.9 3.9V2.8z" transform="translate(-0.85 0.75)"/><path fill="#FE2C55" d="M14.2 2.8h2.1c.2 1.7 1.2 3.2 2.7 4.1A6.4 6.4 0 0 0 21 7.9v2.2a8.3 8.3 0 0 1-3.7-1v6.2a6.5 6.5 0 1 1-6.5-6.5c.3 0 .7 0 1 .1v2.4a4.1 4.1 0 1 0 2.9 3.9V2.8z" transform="translate(0.85 -0.75)"/><path fill="#fff" d="M14.2 2.8h2.1c.2 1.7 1.2 3.2 2.7 4.1A6.4 6.4 0 0 0 21 7.9v2.2a8.3 8.3 0 0 1-3.7-1v6.2a6.5 6.5 0 1 1-6.5-6.5c.3 0 .7 0 1 .1v2.4a4.1 4.1 0 1 0 2.9 3.9V2.8z"/></g></svg>`,
  youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" fill="#FF0000"/><path fill="#fff" d="M9.2 7.6v8.8L17.2 12 9.2 7.6z"/></svg>`,
  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" fill="#1877F2"/><path fill="#fff" d="M13.55 22V13.4h2.55l.38-3h-2.93V8.55c0-.86.27-1.5 1.5-1.5h1.6V4.35C15.85 4.28 14.7 4.15 13.45 4.15c-2.55 0-4.25 1.52-4.25 4.35v2.9H6.9v3h2.3V22h4.35z"/></svg>`,
  snapchat: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" fill="#FFFC00"/><path fill="#111" d="M12 3.9c2.55 0 4.15 1.7 4.15 4.05 0 .5 0 1.6.4 2 .28.28.75.28 1.25.48.65.22 1.05.6 1.05 1.08 0 .6-.48.98-1.12 1.25-.28.1-.6.28-.6.6 0 .65.75 1.3 1.4 1.68.48.28.65.58.65.95 0 .65-.65 1.12-1.6 1.12-.38 0-.75-.1-1.12-.22-.48-.16-.92-.28-1.4 0-.75.48-1.5 1.02-3.06 1.02s-2.3-.54-3.06-1.02c-.48-.28-.92-.16-1.4 0-.37.12-.74.22-1.12.22-.95 0-1.6-.47-1.6-1.12 0-.37.17-.67.65-.95.65-.38 1.4-1.03 1.4-1.68 0-.32-.32-.5-.6-.6-.64-.27-1.12-.65-1.12-1.25 0-.48.4-.86 1.05-1.08.5-.2.97-.2 1.25-.48.4-.4.4-1.5.4-2C7.85 5.6 9.45 3.9 12 3.9z"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 7.5 12 13l7.5-5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
}

function formatCompact(n) {
  const value = Math.max(0, Number(n) || 0);
  if (value >= 1_000_000) {
    const v = value / 1_000_000;
    return `${v >= 10 || Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}M+`;
  }
  if (value >= 1_000) {
    const v = value / 1_000;
    return `${v >= 10 || Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}K+`;
  }
  return `${Math.round(value)}`;
}

function audienceUnit(social) {
  return social?.id === "youtube" ? "subscribers" : "followers";
}

function formatAudience(social) {
  if (social?.audienceLabel?.trim()) return social.audienceLabel.trim();
  const n = social?.followers;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  return `${formatCompact(n)} ${audienceUnit(social)}`;
}

function totalChipLabel() {
  if (content.totalFollowersLabel?.trim()) return content.totalFollowersLabel.trim();
  const n = content.totalFollowers;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  return formatCompact(n);
}

function monthlyViewsLabel() {
  if (content.monthlyPostViewsLabel?.trim()) return content.monthlyPostViewsLabel.trim();
  const n = content.monthlyPostViews;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "";
  return formatCompact(n);
}

function animateCount(el, target, { duration = 1400, delay = 0, suffix = "", finalLabel = null } = {}) {
  if (!el) return;

  const finish = () => {
    el.textContent = finalLabel || `${formatCompact(target)}${suffix}`;
    el.classList.add("is-settling");
  };

  if (prefersReducedMotion() || !(target > 0)) {
    finish();
    return;
  }

  el.textContent = `0${suffix}`;
  const startAt = performance.now() + delay;

  const frame = (now) => {
    if (now < startAt) {
      requestAnimationFrame(frame);
      return;
    }
    const t = Math.min(1, (now - startAt) / duration);
    const value = target * easeOutExpo(t);
    if (t < 1) {
      el.textContent = `${formatCompact(value)}${suffix}`;
      requestAnimationFrame(frame);
      return;
    }
    finish();
  };

  requestAnimationFrame(frame);
}

function initCountUps() {
  const totalEl = document.querySelector("[data-count-total]");
  if (totalEl) {
    const target = Number(totalEl.dataset.countTotal) || 0;
    const finalLabel = totalEl.dataset.countFinal || totalChipLabel();
    animateCount(totalEl, target, {
      duration: 1600,
      delay: 180,
      finalLabel,
    });
  }

  document.querySelectorAll("[data-count-followers]").forEach((el, index) => {
    const target = Number(el.dataset.countFollowers) || 0;
    const unit = el.dataset.countUnit || "followers";
    const finalLabel = el.dataset.countFinal || `${formatCompact(target)} ${unit}`;
    animateCount(el, target, {
      duration: 1200,
      delay: 420 + index * 90,
      suffix: ` ${unit}`,
      finalLabel,
    });
  });

  const viewsEl = document.querySelector("[data-count-views]");
  if (viewsEl) {
    const target = Number(viewsEl.dataset.countViews) || 0;
    const finalLabel = viewsEl.dataset.countFinal || monthlyViewsLabel();
    animateCount(viewsEl, target, {
      duration: 1500,
      delay: 320,
      finalLabel,
    });
  }
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
  const target =
    typeof content.totalFollowers === "number" && content.totalFollowers > 0
      ? content.totalFollowers
      : 0;

  const viewsLabel = monthlyViewsLabel();
  const viewsTarget =
    typeof content.monthlyPostViews === "number" && content.monthlyPostViews > 0
      ? content.monthlyPostViews
      : 0;
  const viewsText =
    content.monthlyPostViewsText?.trim() || "post views in the last 30 days";
  const viewsLine =
    viewsLabel || viewsTarget > 0
      ? `
        <span class="views-line mt-1 inline-flex max-w-[22rem] items-center justify-center gap-1.5 text-[0.72rem] font-semibold tracking-[0.04em] text-bone-faint">
          <span class="views-arrow" aria-hidden="true">↗</span>
          <span class="inline-flex flex-wrap items-center justify-center gap-x-1">
            <span
              class="tabular-nums text-bone-dim"
              data-count-views="${viewsTarget}"
              data-count-final="${escapeHtml(viewsLabel || formatCompact(viewsTarget))}"
            >0</span>
            <span>${escapeHtml(viewsText)}</span>
          </span>
        </span>
      `
      : "";

  return `
    <div class="rise mb-5 flex justify-center" style="--d:20ms">
      <p class="m-0 flex flex-col items-center gap-1.5 text-center">
        <span class="inline-flex items-center justify-center gap-2">
          <span
            class="total-display font-[family-name:var(--font-display)] text-[clamp(2.1rem,8vw,2.55rem)] leading-none tracking-[-0.04em]"
            data-count-total="${target}"
            data-count-final="${escapeHtml(label)}"
          >0</span>
          <span class="text-[0.95rem] font-semibold leading-none tracking-[-0.01em] text-bone-dim">followers</span>
        </span>
        ${viewsLine}
        <span class="mt-0.5 text-[0.72rem] font-semibold tracking-[0.2em] text-bone-faint uppercase">
          Across platforms
        </span>
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
      <h1 class="name-title m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,2.55rem)] font-normal leading-none tracking-[-0.03em]">
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
      const followers =
        typeof social.followers === "number" && social.followers > 0
          ? social.followers
          : 0;
      const unit = audienceUnit(social);
      const icon = ICONS[social.id] || ICONS.chevron;
      const audienceHtml = audience
        ? `<span
              class="audience-count text-[0.78rem] font-medium text-bone-faint"
              data-count-followers="${followers}"
              data-count-unit="${escapeHtml(unit)}"
              data-count-final="${escapeHtml(audience)}"
            >0 ${escapeHtml(unit)}</span>`
        : `<span class="text-[0.78rem] font-medium text-bone-faint">Open profile</span>`;
      return `
        <li class="rise" style="--d:${140 + index * 55}ms">
          <a
            class="link-row flex min-h-[56px] items-center gap-3.5 rounded-2xl border border-line bg-gradient-to-br from-bone/[0.06] to-bone/[0.02] px-4 py-3.5 backdrop-blur-md [-webkit-tap-highlight-color:transparent]"
            href="${escapeHtml(social.url.trim())}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${escapeHtml(social.label)}${audience ? ` — ${audience}` : ""}"
          >
            <span class="icon-pop social-icon grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[12px] shadow-[0_0_0_1px_rgba(244,241,234,0.08)] [&_svg]:h-full [&_svg]:w-full">
              ${icon}
            </span>
            <span class="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
              <span class="text-[1.02rem] font-semibold tracking-[-0.015em]">${escapeHtml(social.label)}</span>
              ${audienceHtml}
            </span>
            <span class="link-chevron shrink-0 text-bone-faint [&_svg]:h-[18px] [&_svg]:w-[18px]">${ICONS.chevron}</span>
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
          class="featured-card rise relative block aspect-[9/16] overflow-hidden rounded-[14px] border border-line bg-ink-3 [-webkit-tap-highlight-color:transparent]"
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

function renderBrandInquiry() {
  const email = content.brandEmail?.trim();
  if (!email) return "";

  return `
    <div class="mb-6 flex flex-col gap-3">
      <a
        class="brand-btn rise inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border border-line-bright bg-transparent px-5 py-3 text-center text-[0.95rem] font-semibold tracking-[-0.01em] text-bone [-webkit-tap-highlight-color:transparent]"
        style="--d:460ms"
        href="mailto:${escapeHtml(email)}"
      >
        <span class="brand-btn-icon grid h-5 w-5 place-items-center text-ember [&_svg]:h-[18px] [&_svg]:w-[18px]" aria-hidden="true">${ICONS.mail}</span>
        ${escapeHtml(content.brandEmailLabel || "Brand inquiries")}
      </a>
    </div>
  `;
}

const ICON_VIDEO_OUTLINE = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.5" y="7.2" width="11" height="9.6" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M15.5 9.2 20 7.4v9.2l-4.5-1.8V9.2z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;

function renderBooking() {
  const bookings = (content.booking || []).filter((b) => b?.url?.trim());
  if (!bookings.length) return "";

  const title = content.bookingTitle?.trim() || "Consultation";
  const blurb = content.bookingBlurb?.trim();

  const parts = bookings.map((booking, index) => {
    const label = booking.label?.trim() || "Strategy call";
    const price = booking.priceLabel?.trim();
    const isPrimary =
      booking.primary !== false && (booking.primary === true || index === 0);
    const delay = 580 + index * 50;
    const className = isPrimary
      ? "book-btn book-btn-primary rise"
      : "book-btn book-btn-secondary rise";

    return `
      <a
        class="${className}"
        style="--d:${delay}ms"
        href="${escapeHtml(booking.url.trim())}"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="book-btn-icon" aria-hidden="true">${ICON_VIDEO_OUTLINE}</span>
        <span class="book-btn-label">${escapeHtml(label)}</span>
        ${price ? `<small class="book-btn-price">${escapeHtml(price)}</small>` : ""}
      </a>
    `;
  });

  return `
    <section class="mb-6" aria-labelledby="booking-heading">
      <div class="rise mb-3 text-center" style="--d:560ms">
        <h2 id="booking-heading" class="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-bone-faint uppercase">${escapeHtml(title)}</h2>
        ${
          blurb
            ? `<p class="mx-auto mt-2 mb-0 max-w-[34ch] text-[0.88rem] leading-snug text-bone-dim">${escapeHtml(blurb)}</p>`
            : ""
        }
      </div>
      <div class="book-stack">${parts.join("")}</div>
    </section>
  `;
}

function renderScoutViral() {
  const project = content.scoutviral;
  if (!project?.url?.trim()) return "";
  const logo = project.logo?.trim();

  return `
    <section class="mb-6" aria-labelledby="scoutviral-heading">
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
      <p class="m-0">Adams Braimah</p>
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
    renderBrandInquiry(),
    renderScoutViral(),
    renderBooking(),
    renderFooter(),
  ].join("");

  if (content.metaTitle) document.title = content.metaTitle;
  initCountUps();
}

render();
