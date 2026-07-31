import { config } from "@/lib/config";

/**
 * LIVE 1:1 ROOM
 *
 * Called once, when a booking is confirmed. Returns the URL both of you
 * open at the appointed time.
 *
 *   jitsi  — meet.jit.si. Free, unlimited, no account, no SDK. The room
 *            name embeds the booking's access token, so the URL is
 *            effectively unguessable. This is the right default.
 *   daily  — Daily.co. Free tier is 10,000 participant-minutes/month,
 *            which is ~80 hour-long 1:1s. Real API, recordings, lobby.
 *   manual — you paste one Zoom/Meet link and reuse it. Zero setup,
 *            but the same link for everyone.
 */

export type MeetingRoom = {
  url: string;
  provider: string;
};

export async function createMeetingRoom(opts: {
  reference: string;
  accessToken: string;
  startsAt: Date;
  endsAt: Date;
}): Promise<MeetingRoom> {
  switch (config.meeting.provider) {
    case "daily": {
      if (!config.meeting.dailyApiKey) break; // fall through to jitsi
      try {
        const res = await fetch("https://api.daily.co/v1/rooms", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.meeting.dailyApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `onetalk-${opts.reference.toLowerCase()}`,
            privacy: "public",
            properties: {
              // Room opens 10 minutes early and self-destructs an hour
              // after the end — no orphaned rooms accruing on the account.
              nbf: Math.floor(opts.startsAt.getTime() / 1000) - 600,
              exp: Math.floor(opts.endsAt.getTime() / 1000) + 3600,
              max_participants: 2,
              enable_chat: true,
              enable_screenshare: true,
            },
          }),
        });

        if (res.ok) {
          const room = (await res.json()) as { url: string };
          return { url: room.url, provider: "daily" };
        }
        console.error("[meeting] Daily rejected room creation:", await res.text());
      } catch (err) {
        console.error("[meeting] Daily unreachable:", err);
      }
      break; // any failure falls through to the free provider
    }

    case "manual":
      if (config.meeting.manualUrl) {
        return { url: config.meeting.manualUrl, provider: "manual" };
      }
      break;
  }

  // Default and universal fallback. A booking must never end up without a
  // room just because a third party is having a bad day.
  const room = `OneTalk-${opts.reference}-${opts.accessToken.slice(0, 12)}`;
  return {
    url: `https://meet.jit.si/${room}`,
    provider: "jitsi",
  };
}
