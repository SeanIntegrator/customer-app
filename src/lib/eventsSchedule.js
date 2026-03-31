/** Client-side event scheduling against ISO `startsAt` on mock / catalog events. */

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Event start is strictly before the start of today (local). */
export function isEventPast(event) {
  const raw = event?.startsAt;
  if (!raw) return false;
  const t = new Date(raw);
  if (Number.isNaN(t.getTime())) return false;
  return t < startOfToday();
}

export function isEventUpcoming(event) {
  return !isEventPast(event);
}

export function filterRegisteredUpcoming(events) {
  return (events || []).filter((e) => e.registered && isEventUpcoming(e));
}

export function filterAttended(events) {
  return (events || []).filter((e) => e.registered && isEventPast(e));
}

export function filterUpcomingBrowse(events) {
  return (events || []).filter((e) => isEventUpcoming(e));
}
