/**
 * Google Calendar iCal (.ics) Parser and Availability Sync
 * Supports multiple calendar feeds (e.g. roboledpartner@gmail.com & luanchaves1011@gmail.com)
 */

export interface GoogleCalendarEvent {
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string | null; // HH:mm
  endTime?: string | null; // HH:mm
  isFullDay: boolean;
  calendarSource: string;
}

// In-memory cache for calendar events (cache TTL: 3 minutes)
let cachedEvents: GoogleCalendarEvent[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Parse an iCalendar (.ics) string format into structured events
 */
export function parseICalFeed(icsData: string, sourceName: string): GoogleCalendarEvent[] {
  const events: GoogleCalendarEvent[] = [];
  const lines = icsData.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let inEvent = false;
  let summary = 'Evento Agendado (Google Calendar)';
  let dtStartRaw = '';
  let dtEndRaw = '';
  let isFullDay = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle multiline wrapped lines in ICS (lines starting with space or tab)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      line += lines[i + 1].slice(1);
      i++;
    }

    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      summary = 'Evento Agendado';
      dtStartRaw = '';
      dtEndRaw = '';
      isFullDay = false;
    } else if (line.startsWith('END:VEVENT')) {
      if (inEvent && dtStartRaw) {
        const parsed = parseIcsDateTime(dtStartRaw, dtEndRaw);
        if (parsed) {
          events.push({
            title: summary,
            date: parsed.date,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            isFullDay: parsed.isFullDay || isFullDay,
            calendarSource: sourceName,
          });
        }
      }
      inEvent = false;
    } else if (inEvent) {
      if (line.startsWith('SUMMARY:')) {
        summary = line.slice(8).trim() || 'Evento Agendado';
      } else if (line.startsWith('DTSTART')) {
        dtStartRaw = line;
        if (line.includes('VALUE=DATE:')) {
          isFullDay = true;
        }
      } else if (line.startsWith('DTEND')) {
        dtEndRaw = line;
      }
    }
  }

  return events;
}

/**
 * Parse ICS DTSTART/DTEND string with timezone conversion to São Paulo (UTC-3)
 */
function parseIcsDateTime(
  startLine: string,
  endLine: string
): { date: string; startTime: string | null; endTime: string | null; isFullDay: boolean } | null {
  try {
    const startValue = startLine.split(':')[1]?.trim();
    if (!startValue) return null;

    // Full day format: YYYYMMDD
    if (startValue.length === 8 && !startValue.includes('T')) {
      const year = startValue.slice(0, 4);
      const month = startValue.slice(4, 6);
      const day = startValue.slice(6, 8);
      return {
        date: `${year}-${month}-${day}`,
        startTime: null,
        endTime: null,
        isFullDay: true,
      };
    }

    // Timestamp format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
    if (startValue.includes('T')) {
      let isUtc = startValue.endsWith('Z');
      const cleanVal = startValue.replace('Z', '');
      const parts = cleanVal.split('T');
      const datePart = parts[0];
      const timePart = parts[1] || '000000';

      const year = parseInt(datePart.slice(0, 4), 10);
      const month = parseInt(datePart.slice(4, 6), 10) - 1;
      const day = parseInt(datePart.slice(6, 8), 10);
      const hour = parseInt(timePart.slice(0, 2), 10);
      const min = parseInt(timePart.slice(2, 4), 10);
      const sec = parseInt(timePart.slice(4, 6), 10) || 0;

      let dateObj: Date;
      if (isUtc) {
        dateObj = new Date(Date.UTC(year, month, day, hour, min, sec));
      } else {
        dateObj = new Date(year, month, day, hour, min, sec);
      }

      // Format in Brazil local time (America/Sao_Paulo)
      const spDateStr = dateObj.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }); // DD/MM/YYYY
      const spTimeStr = dateObj.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }); // HH:mm

      const [d, m, y] = spDateStr.split('/');
      const isoDate = `${y}-${m}-${d}`;

      let endTimeStr: string | null = null;
      if (endLine && endLine.includes(':')) {
        const endValue = endLine.split(':')[1]?.trim();
        if (endValue && endValue.includes('T')) {
          const isEndUtc = endValue.endsWith('Z');
          const cleanEnd = endValue.replace('Z', '');
          const endParts = cleanEnd.split('T');
          const endDateP = endParts[0];
          const endTimeP = endParts[1] || '000000';
          const ey = parseInt(endDateP.slice(0, 4), 10);
          const em = parseInt(endDateP.slice(4, 6), 10) - 1;
          const ed = parseInt(endDateP.slice(6, 8), 10);
          const eh = parseInt(endTimeP.slice(0, 2), 10);
          const emin = parseInt(endTimeP.slice(2, 4), 10);

          const endDateObj = isEndUtc
            ? new Date(Date.UTC(ey, em, ed, eh, emin, 0))
            : new Date(ey, em, ed, eh, emin, 0);

          endTimeStr = endDateObj.toLocaleTimeString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        }
      }

      return {
        date: isoDate,
        startTime: spTimeStr,
        endTime: endTimeStr,
        isFullDay: false,
      };
    }

    return null;
  } catch (err) {
    console.error('Error parsing ICS date:', err);
    return null;
  }
}

/**
 * Fetch and aggregate events from all configured Google Calendar iCal feeds
 */
export async function fetchGoogleCalendarEvents(
  urls: { url: string; label: string }[],
  forceRefresh = false
): Promise<GoogleCalendarEvent[]> {
  const now = Date.now();
  if (!forceRefresh && cachedEvents.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedEvents;
  }

  const validUrls = urls.filter((item) => item.url && item.url.startsWith('http'));
  if (validUrls.length === 0) {
    return [];
  }

  const allEvents: GoogleCalendarEvent[] = [];

  for (const { url, label } of validUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RoboLedQuoteSync/1.0)',
        },
        next: { revalidate: 180 },
      });

      if (res.ok) {
        const icsText = await res.text();
        const parsed = parseICalFeed(icsText, label);
        allEvents.push(...parsed);
      } else {
        console.warn(`Failed to fetch iCal feed for ${label}: HTTP ${res.status}`);
      }
    } catch (err) {
      console.error(`Error fetching Google Calendar feed (${label}):`, err);
    }
  }

  cachedEvents = allEvents;
  lastFetchTime = now;
  return allEvents;
}
