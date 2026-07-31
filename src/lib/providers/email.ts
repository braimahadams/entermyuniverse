import { config } from "@/lib/config";

/**
 * EMAIL
 *
 *   console — prints the whole message to your terminal. Free, and it
 *             lets you develop the entire flow before you own a domain.
 *   resend  — 3,000 emails/month free, 100/day. Costs nothing until you
 *             are genuinely busy. Set RESEND_API_KEY and a verified
 *             EMAIL_FROM domain, that's the whole migration.
 *
 * Deliberately no SDK dependency: Resend's REST API is one fetch call,
 * so the package would be 100% overhead.
 */

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Attached as an .ics so the call lands in their real calendar. */
  calendar?: string;
};

export async function sendMail(mail: Mail): Promise<boolean> {
  if (config.email.provider === "resend" && config.email.resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.email.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: config.email.from,
          to: [mail.to],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          attachments: mail.calendar
            ? [
                {
                  filename: "one-talk.ics",
                  content: Buffer.from(mail.calendar).toString("base64"),
                },
              ]
            : undefined,
        }),
      });

      if (res.ok) return true;
      console.error("[email] Resend rejected:", await res.text());
    } catch (err) {
      console.error("[email] Resend unreachable:", err);
    }
    // Fall through and log it, so the content is never simply lost.
  }

  console.log(
    [
      "",
      "┌─────────────── EMAIL ───────────────",
      `│ To:      ${mail.to}`,
      `│ Subject: ${mail.subject}`,
      "├─────────────────────────────────────",
      mail.text
        .split("\n")
        .map((l) => `│ ${l}`)
        .join("\n"),
      mail.calendar ? "│ [.ics calendar invite attached]" : "",
      "└─────────────────────────────────────",
      "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return true;
}
