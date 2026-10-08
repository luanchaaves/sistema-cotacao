/**
 * Google Calendar iCal (.ics) Parser and Availability Sync Engine
 * Supports multiple calendar feeds (e.g. roboledpartner@gmail.com, luanchaves1011@gmail.com, etc.)
 */

export interface GoogleCalendarEvent {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string | null; // HH:mm
  endTime?: string | null; // HH:mm
  isFullDay: boolean;
  calendarSource: string;
  description?: string;
  location?: string;
}

// In-memory cache for calendar events (cache TTL: 1 minute for fast updates)
let cachedEvents: GoogleCalendarEvent[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

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
  let isCancelled = false;
  let description = '';
  let location = '';
  let uid = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle multiline wrapped lines in ICS (lines starting with space or tab)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      line += lines[i + 1].slice(1);
      i++;
    }

    const trimmed = line.trim();

    if (trimmed.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      summary = 'Evento Agendado';
      dtStartRaw = '';
      dtEndRaw = '';
      isFullDay = false;
      isCancelled = false;
      description = '';
      location = '';
      uid = '';
    } else if (trimmed.startsWith('END:VEVENT')) {
      if (inEvent && dtStartRaw && !isCancelled) {
        const parsed = parseIcsDateTime(dtStartRaw, dtEndRaw);
        if (parsed) {
          events.push({
            id: uid || Math.random().toString(),
            title: summary,
            date: parsed.date,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            isFullDay: parsed.isFullDay || isFullDay,
            calendarSource: sourceName,
            description,
            location,
          });
        }
      }
      inEvent = false;
    } else if (inEvent) {
      if (trimmed.startsWith('STATUS:CANCELLED')) {
        isCancelled = true;
      } else if (trimmed.startsWith('UID:')) {
        uid = trimmed.slice(4).trim();
      } else if (trimmed.startsWith('SUMMARY:')) {
        summary = trimmed.slice(8).trim() || 'Evento Agendado';
      } else if (trimmed.startsWith('LOCATION:')) {
        location = trimmed.slice(9).trim();
      } else if (trimmed.startsWith('DESCRIPTION:')) {
        description = trimmed.slice(12).trim();
      } else if (trimmed.startsWith('DTSTART')) {
        dtStartRaw = trimmed;
        if (trimmed.includes('VALUE=DATE')) {
          isFullDay = true;
        }
      } else if (trimmed.startsWith('DTEND')) {
        dtEndRaw = trimmed;
      }
    }
  }

  return events;
}

/**
 * Parse ICS DTSTART/DTEND string with timezone awareness
 */
function parseIcsDateTime(
  startLine: string,
  endLine: string
): { date: string; startTime: string | null; endTime: string | null; isFullDay: boolean } | null {
  try {
    const colonIndex = startLine.indexOf(':');
    if (colonIndex === -1) return null;

    const startValue = startLine.slice(colonIndex + 1).trim();
    if (!startValue) return null;

    // 1. Full day format: YYYYMMDD (length 8, no 'T')
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

    // 2. Timestamp format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
    if (startValue.includes('T')) {
      const isUtc = startValue.endsWith('Z');
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

      let isoDate: string;
      let spTimeStr: string;

      if (isUtc) {
        // Converted from UTC to America/Sao_Paulo (UTC-3)
        const dateObj = new Date(Date.UTC(year, month, day, hour, min, sec));
        const spDateStr = dateObj.toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }); // DD/MM/YYYY
        spTimeStr = dateObj.toLocaleTimeString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }); // HH:mm

        const [d, m, y] = spDateStr.split('/');
        isoDate = `${y}-${m}-${d}`;
      } else {
        // Floating / Local timezone (e.g. TZID=America/Sao_Paulo): already in local time
        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        isoDate = `${year}-${mStr}-${dStr}`;
        const hStr = String(hour).padStart(2, '0');
        const minStr = String(min).padStart(2, '0');
        spTimeStr = `${hStr}:${minStr}`;
      }

      let endTimeStr: string | null = null;
      if (endLine && endLine.includes(':')) {
        const endColon = endLine.indexOf(':');
        const endValue = endLine.slice(endColon + 1).trim();
        if (endValue && endValue.includes('T')) {
          const isEndUtc = endValue.endsWith('Z');
          const cleanEnd = endValue.replace('Z', '');
          const endParts = cleanEnd.split('T');
          const endHour = parseInt((endParts[1] || '000000').slice(0, 2), 10);
          const endMin = parseInt((endParts[1] || '000000').slice(2, 4), 10);

          if (isEndUtc) {
            const ey = parseInt(endParts[0].slice(0, 4), 10);
            const em = parseInt(endParts[0].slice(4, 6), 10) - 1;
            const ed = parseInt(endParts[0].slice(6, 8), 10);
            const endDateObj = new Date(Date.UTC(ey, em, ed, endHour, endMin, 0));
            endTimeStr = endDateObj.toLocaleTimeString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
          } else {
            const ehStr = String(endHour).padStart(2, '0');
            const eminStr = String(endMin).padStart(2, '0');
            endTimeStr = `${ehStr}:${eminStr}`;
          }
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

  // Sanitize URLs: Convert webcal:// to https:// and trim
  const validUrls = urls
    .map((item) => {
      let cleanUrl = (item.url || '').trim();
      if (cleanUrl.startsWith('webcal://')) {
        cleanUrl = 'https://' + cleanUrl.slice(9);
      }
      return { url: cleanUrl, label: item.label };
    })
    .filter((item) => item.url && (item.url.startsWith('https://') || item.url.startsWith('http://')));

  if (validUrls.length === 0) {
    return [];
  }

  const allEvents: GoogleCalendarEvent[] = [];

  for (const { url, label } of validUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/calendar, text/plain, */*',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const icsText = await res.text();
        const parsed = parseICalFeed(icsText, label);
        allEvents.push(...parsed);
      } else {
        console.warn(`[GCalendar Sync] Failed to fetch feed (${label}): HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error(`[GCalendar Sync] Error fetching feed (${label}):`, err.message || err);
    }
  }

  // Sort events by date and time
  allEvents.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
  });

  cachedEvents = allEvents;
  lastFetchTime = now;
  return allEvents;
}
