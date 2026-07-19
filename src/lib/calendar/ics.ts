import type { Objective } from "@/types";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Format a Date as UTC iCalendar datetime: YYYYMMDDTHHMMSSZ */
export function toIcsUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join("\r\n");
}

/**
 * Build an iCalendar (.ics) document from scheduled objectives so users can
 * import into Google Calendar, Apple Calendar, Outlook, etc.
 */
export function buildObjectivesIcs(objectives: Objective[]): string {
  const now = toIcsUtc(new Date());
  const events = objectives
    .filter((o) => o.scheduledStart && o.status !== "recycled")
    .map((objective) => {
      const start = new Date(objective.scheduledStart!);
      const duration = Math.max(5, objective.scheduledDurationMinutes ?? 30);
      const end = new Date(start.getTime() + duration * 60_000);
      const summary = escapeIcsText(objective.title);
      const description = escapeIcsText(
        [objective.description, objective.subject ? `Subject: ${objective.subject}` : null]
          .filter(Boolean)
          .join("\n")
      );
      const uid = `${objective.id}@axon.app`;
      const lines = [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${toIcsUtc(start)}`,
        `DTEND:${toIcsUtc(end)}`,
        `SUMMARY:${summary}`,
      ];
      if (description) lines.push(`DESCRIPTION:${description}`);
      if (objective.recurrence === "daily") {
        lines.push("RRULE:FREQ=DAILY");
      } else if (objective.recurrence === "weekly") {
        lines.push("RRULE:FREQ=WEEKLY");
      }
      lines.push("END:VEVENT");
      return lines.map(foldLine).join("\r\n");
    });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Axon//Study Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Trigger a browser download of the .ics file. */
export function downloadObjectivesIcs(objectives: Objective[], filename = "axon-calendar.ics") {
  const ics = buildObjectivesIcs(objectives);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
