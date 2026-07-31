/** Booking lifecycle. SQLite has no enums, so this is the source of truth. */
export const BOOKING_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
} as const;

export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

/** Statuses that occupy a slot on the calendar. */
export const BLOCKING_STATUSES: BookingStatus[] = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.COMPLETED,
];

/** How long a slot is held while someone is inside Stripe Checkout. */
export const HOLD_MINUTES = 15;

/** Slot grid resolution, in minutes. */
export const SLOT_GRANULARITY_MIN = 30;

export const TOPICS = [
  { id: "system", label: "The System" },
  { id: "virality", label: "Virality" },
  { id: "money", label: "Money" },
  { id: "mind", label: "The Mind" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];
