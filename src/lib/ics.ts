/**
 * Calendar invites, hand-rolled.
 *
 * An .ics attachment is the single highest-leverage anti-no-show tool
 * there is: the call appears in their calendar with the join link on it,
 * and their phone reminds them without you paying for anything.
 */

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// RFC 5545 caps lines at 75 octets; long URLs break clients otherwise.
function fold(line: string): string {
  if (line.length <= 74) return line;
  const chunks: string[] = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 73) {
    chunks.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  if (rest) chunks.push(" " + rest);
  return chunks.join("\r\n");
}

function escape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildIcs(opts: {
  uid: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  url: string;
  organizerEmail: string;
  attendeeEmail: string;
  attendeeName: string;
}): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//One Talk//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@one-talk`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(opts.startsAt)}`,
    `DTEND:${stamp(opts.endsAt)}`,
    fold(`SUMMARY:${escape(opts.title)}`),
    fold(`DESCRIPTION:${escape(opts.description)}`),
    fold(`LOCATION:${escape(opts.url)}`),
    fold(`URL:${opts.url}`),
    `ORGANIZER;CN=One Talk:mailto:${opts.organizerEmail}`,
    fold(
      `ATTENDEE;CN=${escape(opts.attendeeName)};RSVP=TRUE:mailto:${opts.attendeeEmail}`,
    ),
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    // Nudge them 30 minutes out, from inside their own calendar app.
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Your One Talk starts in 30 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
