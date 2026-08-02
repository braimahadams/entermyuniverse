import { brand } from "@/lib/brand";
import { config } from "@/lib/config";
import { formatInZone, zoneAbbreviation } from "@/lib/time";
import { formatPrice } from "@/lib/types";

/**
 * Transactional email.
 *
 * Written as inline-styled tables because that is still the only thing
 * every mail client renders the same way. Dark background to match the
 * site — the confirmation should feel like the same product.
 */

type BookingEmailData = {
  reference: string;
  name: string;
  email: string;
  topic: string;
  context: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  sessionName: string;
  durationMin: number;
  amountCents: number;
  currency: string;
  meetingUrl: string;
  manageUrl: string;
};

function shell(inner: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#07070a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07070a;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0c0c11;border:1px solid rgba(244,241,234,0.1);border-radius:20px;overflow:hidden;">
<tr><td style="padding:36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#f4f1ea;">
${inner}
</td></tr>
</table>
<p style="margin:22px 0 0;font-family:-apple-system,sans-serif;font-size:12px;color:#6b6862;">
  ${brand.name} · ${config.siteUrl.replace(/^https?:\/\//, "")}
</p>
</td></tr></table>
</body></html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:11px 0;border-bottom:1px solid rgba(244,241,234,0.08);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6862;width:38%;vertical-align:top;">${label}</td>
    <td style="padding:11px 0;border-bottom:1px solid rgba(244,241,234,0.08);font-size:14px;color:#f4f1ea;">${value}</td>
  </tr>`;
}

/** Sent to the guest the moment payment clears. */
export function guestConfirmation(data: BookingEmailData) {
  const when = formatInZone(data.startsAt, data.timezone);
  const zone = zoneAbbreviation(data.timezone, data.startsAt);

  const html = shell(`
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#ff7a45;">Confirmed</p>
    <h1 style="margin:0 0 18px;font-size:26px;font-weight:400;line-height:1.15;">You're booked.</h1>
    <p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:#a8a49c;">
      ${escapeHtml(data.name)} — we're on for the time below. Bring the thing you actually want to talk about, not the polished version.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${row("When", `${when}<br><span style="color:#6b6862;font-size:12px;">${zone}</span>`)}
      ${row("Session", `${escapeHtml(data.sessionName)} · ${data.durationMin} min`)}
      ${row("Topic", escapeHtml(data.topic))}
      ${row("Reference", data.reference)}
      ${data.amountCents > 0 ? row("Paid", formatPrice(data.amountCents, data.currency)) : ""}
    </table>

    <a href="${data.meetingUrl}" style="display:block;padding:16px;background:#ff7a45;color:#07070a;text-decoration:none;text-align:center;border-radius:999px;font-weight:600;font-size:15px;">
      Join the call
    </a>
    <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#6b6862;text-align:center;">
      Same link works at the time. Nothing to install.
    </p>

    <p style="margin:28px 0 0;padding-top:22px;border-top:1px solid rgba(244,241,234,0.08);font-size:13px;line-height:1.6;color:#a8a49c;">
      Need to move it? <a href="${data.manageUrl}" style="color:#ff7a45;">Reschedule or cancel here</a> up to 12 hours before.
    </p>
  `);

  const text = [
    `You're booked.`,
    ``,
    `When:      ${when} (${zone})`,
    `Session:   ${data.sessionName} · ${data.durationMin} min`,
    `Topic:     ${data.topic}`,
    `Reference: ${data.reference}`,
    ``,
    `Join: ${data.meetingUrl}`,
    ``,
    `Reschedule or cancel: ${data.manageUrl}`,
  ].join("\n");

  return {
    // The when carries the weight, not the brand: this email gets found
    // again weeks later by searching an inbox, so the date and time should
    // be readable without opening it.
    subject: `Confirmed — ${formatInZone(data.startsAt, data.timezone, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    })}`,
    html,
    text,
  };
}

/** Sent to you. Optimised for reading on a phone in three seconds. */
export function ownerNotification(data: BookingEmailData) {
  const yourZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const whenYours = formatInZone(data.startsAt, yourZone);
  const whenTheirs = formatInZone(data.startsAt, data.timezone);

  const html = shell(`
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#ff7a45;">New booking</p>
    <h1 style="margin:0 0 22px;font-size:24px;font-weight:400;line-height:1.2;">${escapeHtml(data.name)}</h1>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row("Your time", whenYours)}
      ${row("Their time", `${whenTheirs}<br><span style="color:#6b6862;font-size:12px;">${escapeHtml(data.timezone)}</span>`)}
      ${row("Email", escapeHtml(data.email))}
      ${row("Session", `${escapeHtml(data.sessionName)} · ${data.durationMin} min`)}
      ${row("Paid", data.amountCents > 0 ? formatPrice(data.amountCents, data.currency) : "Free session")}
    </table>

    <div style="padding:18px;background:rgba(255,122,69,0.08);border:1px solid rgba(255,122,69,0.28);border-radius:14px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#ff7a45;">What they want to talk about</p>
      <p style="margin:0;font-size:15px;line-height:1.55;color:#f4f1ea;">${escapeHtml(data.topic)}</p>
      ${
        data.context
          ? `<p style="margin:14px 0 0;padding-top:14px;border-top:1px solid rgba(255,122,69,0.2);font-size:14px;line-height:1.6;color:#a8a49c;">${escapeHtml(data.context)}</p>`
          : ""
      }
    </div>

    <a href="${data.meetingUrl}" style="display:block;margin-top:22px;padding:14px;border:1px solid rgba(244,241,234,0.2);color:#f4f1ea;text-decoration:none;text-align:center;border-radius:999px;font-size:14px;">
      Open the room
    </a>
  `);

  const text = [
    `NEW BOOKING — ${data.name}`,
    ``,
    `Your time:  ${whenYours}`,
    `Their time: ${whenTheirs} (${data.timezone})`,
    `Email:      ${data.email}`,
    `Session:    ${data.sessionName}`,
    ``,
    `TOPIC: ${data.topic}`,
    data.context ? `\nCONTEXT: ${data.context}` : "",
    ``,
    `Room: ${data.meetingUrl}`,
  ].join("\n");

  return { subject: `New booking — ${data.name}`, html, text };
}

/**
 * User-supplied strings go into HTML email. Escaping is not optional:
 * name/topic/context all come straight from a public form.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
