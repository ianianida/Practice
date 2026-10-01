import { CalendarEvent, EventCategory } from '../types';

/**
 * Format date and time into Google Calendar render URL format
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

  const cleanDate = (d: string) => d.replace(/-/g, '');
  const cleanTime = (t: string) => (t ? t.replace(/:/g, '') + '00' : '');

  let datesParam = '';
  if (event.isAllDay || !event.startTime) {
    const start = cleanDate(event.startDate);
    // End date for all-day in Google Calendar is exclusive (next day)
    let end = cleanDate(event.endDate || event.startDate);
    try {
      const d = new Date(event.endDate || event.startDate);
      d.setDate(d.getDate() + 1);
      end = d.toISOString().slice(0, 10).replace(/-/g, '');
    } catch {
      end = start;
    }
    datesParam = `${start}/${end}`;
  } else {
    const start = `${cleanDate(event.startDate)}T${cleanTime(event.startTime)}`;
    const end = `${cleanDate(event.endDate || event.startDate)}T${cleanTime(event.endTime || '23:59')}`;
    datesParam = `${start}/${end}`;
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: datesParam,
  });

  const detailsParts: string[] = [];
  if (event.description) detailsParts.push(event.description);
  if (event.detectedFromSnippet) detailsParts.push(`\n[화면 감지 단서]: ${event.detectedFromSnippet}`);
  if (event.attendees && event.attendees.length > 0) detailsParts.push(`\n[참석자]: ${event.attendees.join(', ')}`);
  detailsParts.push('\n— ScreenCal AI에서 자동 추출됨');

  params.set('details', detailsParts.join('\n'));

  if (event.locationOrLink) {
    params.set('location', event.locationOrLink);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate RFC 5545 compliant iCalendar (.ics) string
 */
export function generateIcsContent(events: CalendarEvent[]): string {
  const formatDateForIcs = (dateStr: string, timeStr?: string, isAllDay?: boolean) => {
    const d = dateStr.replace(/-/g, '');
    if (isAllDay || !timeStr) {
      return `;VALUE=DATE:${d}`;
    }
    const t = timeStr.replace(/:/g, '') + '00';
    return `:${d}T${t}`;
  };

  const escapeIcs = (str: string) =>
    (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ScreenCal AI//Schedule Extractor//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ScreenCal AI 일정',
  ];

  for (const event of events) {
    const uid = `${event.id}-${Date.now()}@screencal.ai`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`SUMMARY:${escapeIcs(event.title)}`);

    lines.push(`DTSTART${formatDateForIcs(event.startDate, event.startTime, event.isAllDay)}`);
    lines.push(`DTEND${formatDateForIcs(event.endDate || event.startDate, event.endTime || event.startTime, event.isAllDay)}`);

    let desc = event.description || '';
    if (event.detectedFromSnippet) {
      desc += `\\n[화면 감지 단서]: ${event.detectedFromSnippet}`;
    }
    lines.push(`DESCRIPTION:${escapeIcs(desc)}`);

    if (event.locationOrLink) {
      lines.push(`LOCATION:${escapeIcs(event.locationOrLink)}`);
    }

    if (event.category) {
      lines.push(`CATEGORIES:${escapeIcs(event.category.toUpperCase())}`);
    }

    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Trigger download of .ics file
 */
export function downloadIcsFile(events: CalendarEvent[], filename = 'screencal_events.ics') {
  const icsData = generateIcsContent(events);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Play a gentle harmonic chime using Web Audio API
 */
export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.05); // G5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25); // D6

    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.05);
    osc1.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);
  } catch {
    // Audio autoplay restrictions or unsupported
  }
}

export function getCategoryBadge(category: EventCategory): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (category) {
    case 'meeting':
      return {
        label: '회의·미팅',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/60',
      };
    case 'deadline':
      return {
        label: '마감·제출',
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/60',
      };
    case 'personal':
      return {
        label: '개인 약속',
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/60',
      };
    case 'travel':
      return {
        label: '교통·출장',
        bg: 'bg-sky-50 dark:bg-sky-950/40',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-200 dark:border-sky-800/60',
      };
    case 'webinar':
      return {
        label: '웨비나·행사',
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/60',
      };
    default:
      return {
        label: '일반 일정',
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
      };
  }
}

export function formatEventDateTime(event: CalendarEvent): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  try {
    const d = new Date(event.startDate + 'T00:00:00');
    const dayName = days[d.getDay()];
    const dateFormatted = `${d.getMonth() + 1}월 ${d.getDate()}일 (${dayName})`;

    if (event.isAllDay || !event.startTime) {
      return `${dateFormatted} · 종일`;
    }

    const timeFormatted = event.endTime
      ? `${event.startTime} ~ ${event.endTime}`
      : `${event.startTime}`;

    return `${dateFormatted} ${timeFormatted}`;
  } catch {
    return `${event.startDate} ${event.startTime || ''}`;
  }
}
