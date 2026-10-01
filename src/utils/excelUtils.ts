import * as XLSX from 'xlsx';
import { CalendarEvent, EventCategory } from '../types';

/**
 * Korean column mapping for Excel export
 */
export function formatEventsForExcel(events: CalendarEvent[]) {
  const categoryNames: Record<EventCategory, string> = {
    meeting: '회의·미팅',
    deadline: '마감·제출',
    personal: '개인 약속',
    travel: '교통·출장',
    webinar: '웨비나·행사',
    other: '기타 일정',
  };

  return events.map((event, index) => ({
    번호: index + 1,
    일정명: event.title,
    카테고리: categoryNames[event.category] || event.category,
    시작일: event.startDate,
    시작시간: event.isAllDay ? '종일' : event.startTime || '-',
    종료일: event.endDate || event.startDate,
    종료시간: event.isAllDay ? '종일' : event.endTime || '-',
    종일여부: event.isAllDay ? 'Y' : 'N',
    '장소 / 화상회의 링크': event.locationOrLink || '-',
    참석자: event.attendees && event.attendees.length > 0 ? event.attendees.join(', ') : '-',
    '상세 메모': event.description || '-',
    '화면 감지 단서': event.detectedFromSnippet || '-',
    'AI 확신도': `${Math.round((event.confidence || 1) * 100)}%`,
    등록출처: event.source === 'auto_screen' ? '화면 AI 자동 추출' : '웹 직접 입력',
    생성일시: event.createdAt ? new Date(event.createdAt).toLocaleString('ko-KR') : '-',
  }));
}

/**
 * Export calendar events to a Microsoft Excel (.xlsx) file
 */
export function exportEventsToExcel(events: CalendarEvent[], filename = 'ScreenCal_일정목록.xlsx') {
  if (events.length === 0) {
    alert('엑셀로 저장할 일정이 없습니다.');
    return;
  }

  const rows = formatEventsForExcel(events);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set nice column widths for Excel
  worksheet['!cols'] = [
    { wch: 6 },  // 번호
    { wch: 25 }, // 일정명
    { wch: 12 }, // 카테고리
    { wch: 12 }, // 시작일
    { wch: 10 }, // 시작시간
    { wch: 12 }, // 종료일
    { wch: 10 }, // 종료시간
    { wch: 8 },  // 종일여부
    { wch: 28 }, // 장소 / 링크
    { wch: 20 }, // 참석자
    { wch: 35 }, // 상세 메모
    { wch: 30 }, // 화면 감지 단서
    { wch: 10 }, // AI 확신도
    { wch: 16 }, // 등록출처
    { wch: 20 }, // 생성일시
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ScreenCal 일정');

  XLSX.writeFile(workbook, filename);
}

/**
 * Export calendar events to UTF-8 CSV with BOM for perfect Korean Excel compatibility
 */
export function exportEventsToCsv(events: CalendarEvent[], filename = 'ScreenCal_일정목록.csv') {
  if (events.length === 0) {
    alert('CSV로 저장할 일정이 없습니다.');
    return;
  }

  const rows = formatEventsForExcel(events);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Add UTF-8 BOM so Excel opens Korean without broken characters
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse uploaded Excel (.xlsx) or CSV file back into CalendarEvent[]
 */
export async function parseExcelOrCsvFile(file: File): Promise<CalendarEvent[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows = XLSX.utils.sheet_to_json<any>(worksheet);

  const categoryMap: Record<string, EventCategory> = {
    '회의·미팅': 'meeting',
    '회의': 'meeting',
    '마감·제출': 'deadline',
    '마감': 'deadline',
    '개인 약속': 'personal',
    '개인': 'personal',
    '교통·출장': 'travel',
    '출장': 'travel',
    '웨비나·행사': 'webinar',
    '웨비나': 'webinar',
  };

  const parsedEvents: CalendarEvent[] = [];

  for (let i = 0; i < jsonRows.length; i++) {
    const row = jsonRows[i];
    const title = row['일정명'] || row['제목'] || row['Title'] || `일정 ${i + 1}`;
    const rawCategory = row['카테고리'] || row['Category'] || 'meeting';
    const category = categoryMap[rawCategory] || 'other';

    const startDate = row['시작일'] || row['StartDate'] || new Date().toISOString().slice(0, 10);
    const rawStartTime = row['시작시간'] || row['StartTime'] || '09:00';
    const isAllDay = row['종일여부'] === 'Y' || rawStartTime === '종일';
    const startTime = isAllDay ? '' : String(rawStartTime);

    const endDate = row['종료일'] || row['EndDate'] || startDate;
    const endTime = isAllDay ? '' : String(row['종료시간'] || row['EndTime'] || '10:00');

    const locationOrLink = row['장소 / 화상회의 링크'] || row['장소'] || row['Location'] || undefined;
    const attendeesStr = row['참석자'] || row['Attendees'];
    const attendees = attendeesStr && attendeesStr !== '-' ? String(attendeesStr).split(',').map((s) => s.trim()) : undefined;
    const description = row['상세 메모'] || row['설명'] || row['Description'] || undefined;

    parsedEvents.push({
      id: `evt_excel_${Date.now()}_${i}`,
      title: String(title),
      category,
      startDate: String(startDate),
      startTime,
      endDate: String(endDate),
      endTime,
      isAllDay,
      locationOrLink: locationOrLink && locationOrLink !== '-' ? String(locationOrLink) : undefined,
      attendees,
      description: description && description !== '-' ? String(description) : undefined,
      confidence: 1.0,
      source: 'manual',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });
  }

  return parsedEvents;
}
