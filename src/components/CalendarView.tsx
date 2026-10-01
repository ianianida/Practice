import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  ExternalLink,
  Download,
  Trash2,
  Edit3,
  Filter,
  Search,
  CheckCircle,
  CalendarDays,
  ListFilter,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import { CalendarEvent, EventCategory } from '../types';
import {
  formatEventDateTime,
  getCategoryBadge,
  generateGoogleCalendarUrl,
  downloadIcsFile,
} from '../utils/calendarUtils';
import { exportEventsToExcel } from '../utils/excelUtils';
import { ExcelTableView } from './ExcelTableView';

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddManualEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onImportEvents?: (newEvents: CalendarEvent[]) => void;
}

type ViewMode = 'month' | 'agenda' | 'excel';

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onAddManualEvent,
  onEditEvent,
  onDeleteEvent,
  onSelectEvent,
  onImportEvents,
}) => {
  // Current view date (year and month)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDateFilter(null);
  };

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Category filter
      if (selectedCategory !== 'all' && evt.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchDesc = evt.description?.toLowerCase().includes(q);
        const matchLoc = evt.locationOrLink?.toLowerCase().includes(q);
        const matchAttendees = evt.attendees?.some((a) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchLoc && !matchAttendees) {
          return false;
        }
      }
      // Specific date filter
      if (selectedDateFilter && evt.startDate !== selectedDateFilter) {
        return false;
      }
      return true;
    });
  }, [events, selectedCategory, searchQuery, selectedDateFilter]);

  // Calendar matrix calculations
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayIndex = firstDay.getDay(); // 0 is Sunday
    const totalDays = lastDay.getDate();

    const days = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dayNum);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        isoString: iso,
        dayNumber: dayNum,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        date: d,
        isoString: iso,
        dayNumber: i,
        isCurrentMonth: true,
      });
    }

    // Next month filler days (fill up to 35 or 42 grid cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        isoString: iso,
        dayNumber: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Today ISO string
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h2>
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition flex items-center gap-1"
                >
                  <span>{selectedDateFilter} 필터 해제</span>
                  <span>×</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              화면에서 자동 등록된 일정과 사용자 일정 관리
            </p>
          </div>
        </div>

        {/* View Switcher & Month Nav & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Nav */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              오늘
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'month'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              월간 달력
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'agenda'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              목록(아젠다)
            </button>
            <button
              onClick={() => setViewMode('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'excel'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>엑셀 표(Spreadsheet)</span>
            </button>
          </div>

          {/* Excel Export Button */}
          <button
            onClick={() => exportEventsToExcel(events)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            title="현재 일정을 Microsoft Excel (.xlsx) 파일로 즉시 저장"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx) 저장</span>
          </button>

          {/* Add Manual Event Button */}
          <button
            onClick={onAddManualEvent}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>일정 추가</span>
          </button>
        </div>
      </div>

      {/* Filters Bar: Search & Category (for Month and Agenda modes) */}
      {viewMode !== 'excel' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="일정 검색 (제목, 장소, 참석자)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-500 transition placeholder:text-slate-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: '전체' },
            { id: 'meeting', label: '회의' },
            { id: 'deadline', label: '마감' },
            { id: 'personal', label: '개인' },
            { id: 'travel', label: '교통·출장' },
            { id: 'webinar', label: '웨비나' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* View: Month Grid */}
      {viewMode === 'month' && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-slate-800 text-center py-2.5 bg-slate-900/60 font-semibold text-xs text-slate-400">
            <span className="text-rose-400">일</span>
            <span>월</span>
            <span>화</span>
            <span>수</span>
            <span>목</span>
            <span>금</span>
            <span className="text-cyan-400">토</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/60">
            {calendarDays.map((day, idx) => {
              const dayEvents = events.filter((e) => e.startDate === day.isoString);
              const isToday = day.isoString === todayIso;
              const isSelected = selectedDateFilter === day.isoString;

              return (
                <div
                  key={idx}
                  onClick={() =>
                    setSelectedDateFilter(isSelected ? null : day.isoString)
                  }
                  className={`min-h-[96px] sm:min-h-[110px] p-1.5 flex flex-col justify-between transition cursor-pointer select-none group ${
                    !day.isCurrentMonth
                      ? 'bg-slate-950/40 text-slate-600'
                      : isSelected
                      ? 'bg-cyan-950/30 ring-1 ring-cyan-500/50'
                      : isToday
                      ? 'bg-slate-900/80'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  {/* Date Number Badge */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition ${
                        isToday
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                          : isSelected
                          ? 'bg-indigo-600 text-white'
                          : day.isCurrentMonth
                          ? 'text-slate-300 group-hover:text-white'
                          : 'text-slate-600'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-slate-500 group-hover:text-slate-300">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Chips List */}
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((evt) => {
                      const badge = getCategoryBadge(evt.category);
                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(evt);
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border transition cursor-pointer ${badge.bg} ${badge.text} ${badge.border} hover:brightness-110 flex items-center gap-1`}
                          title={`${evt.title} (${evt.startTime || '종일'})`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          <span className="truncate">{evt.title}</span>
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-slate-400 pl-1 font-semibold">
                        +{dayEvents.length - 3}건 더보기
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View: Agenda List */}
      {(viewMode === 'agenda' || selectedDateFilter) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <span>일정 상세 목록</span>
              <span className="text-xs text-slate-500">
                ({filteredEvents.length}개)
              </span>
            </h3>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-center py-10 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p>해당 조건에 일치하는 일정이 없습니다.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                화면을 스캔하거나 상단의 [일정 추가] 버튼을 눌러보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredEvents.map((event) => {
                const badge = getCategoryBadge(event.category);
                const gcalUrl = generateGoogleCalendarUrl(event);

                return (
                  <div
                    key={event.id}
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition shadow-sm group"
                  >
                    <div className="space-y-2">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => onEditEvent(event)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteEvent(event.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Date */}
                      <h4
                        onClick={() => onSelectEvent(event)}
                        className="font-bold text-sm text-white hover:text-cyan-300 transition cursor-pointer"
                      >
                        {event.title}
                      </h4>

                      <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatEventDateTime(event)}</span>
                      </div>

                      {/* Location or link */}
                      {event.locationOrLink && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          <span className="truncate">{event.locationOrLink}</span>
                        </div>
                      )}

                      {/* Description */}
                      {event.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Sync Links */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {event.source === 'auto_screen' ? '화면 AI 추출' : '직접 등록'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={gcalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                          title="Google 캘린더에 추가"
                        >
                          <span>Google 캘린더</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </a>

                        <button
                          onClick={() => downloadIcsFile([event], `${event.title}.ics`)}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                          title="iCal (.ics) 내보내기"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View: Excel Spreadsheet Table */}
      {viewMode === 'excel' && (
        <ExcelTableView
          events={events}
          onAddEvent={(evt) => onEditEvent(evt)}
          onUpdateEvent={(evt) => onEditEvent(evt)}
          onDeleteEvent={(id) => onDeleteEvent(id)}
          onImportEvents={(imported) => onImportEvents && onImportEvents(imported)}
        />
      )}
    </div>
  );
};
