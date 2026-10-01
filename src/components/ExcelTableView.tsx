import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  Search,
  ExternalLink,
} from 'lucide-react';
import { CalendarEvent, EventCategory } from '../types';
import { exportEventsToExcel, exportEventsToCsv, parseExcelOrCsvFile } from '../utils/excelUtils';
import { generateGoogleCalendarUrl, getCategoryBadge } from '../utils/calendarUtils';

interface ExcelTableViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onImportEvents: (newEvents: CalendarEvent[]) => void;
}

export const ExcelTableView: React.FC<ExcelTableViewProps> = ({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onImportEvents,
}) => {
  const [search, setSearch] = useState('');
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New inline row state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('meeting');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('15:00');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter events
  const displayEvents = events.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.locationOrLink?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  });

  const handleCreateRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEvt: CalendarEvent = {
      id: `evt_table_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      startDate: newStartDate,
      startTime: newStartTime,
      endDate: newStartDate,
      endTime: newEndTime,
      isAllDay: false,
      locationOrLink: newLocation.trim() || undefined,
      description: newDescription.trim() || undefined,
      confidence: 1.0,
      source: 'manual',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    onAddEvent(newEvt);
    // Reset form
    setNewTitle('');
    setNewLocation('');
    setNewDescription('');
    setIsAddingRow(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseExcelOrCsvFile(file);
      if (imported.length > 0) {
        onImportEvents(imported);
        alert(`엑셀 파일에서 ${imported.length}건의 일정을 성공적으로 불러왔습니다!`);
      } else {
        alert('파일에서 일정을 찾을 수 없습니다.');
      }
    } catch (err: any) {
      alert(`엑셀 파일 불러오기 실패: ${err.message || '파일 형식을 확인해 주세요.'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Excel Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>엑셀(Excel) 스프레드시트 모드</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                총 {events.length}행
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              웹에서 일정을 직접 입력하고 바로 Microsoft Excel (.xlsx / .csv)로 저장 및 다운로드하세요.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportEventsToExcel(events)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            title="현재 입력된 모든 일정을 .xlsx 파일로 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel (.xlsx) 다운로드</span>
          </button>

          <button
            onClick={() => exportEventsToCsv(events)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            title="UTF-8 CSV 파일로 내보내기"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>CSV 저장</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition cursor-pointer"
            title="기존 엑셀 파일(.xlsx, .csv) 불러오기"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>엑셀 파일 불러오기</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => setIsAddingRow(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 행(일정) 입력</span>
          </button>
        </div>
      </div>

      {/* Inline Quick Add Row Form */}
      {isAddingRow && (
        <form
          onSubmit={handleCreateRow}
          className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              스프레드시트에 새 일정 바로 입력 (엑셀 행 추가)
            </span>
            <button
              type="button"
              onClick={() => setIsAddingRow(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              닫기 ×
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2">
            <div className="md:col-span-2">
              <input
                type="text"
                required
                placeholder="일정 제목 (필수)*"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="meeting">회의·미팅</option>
                <option value="deadline">마감·제출</option>
                <option value="personal">개인 약속</option>
                <option value="travel">교통·출장</option>
                <option value="webinar">웨비나</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                required
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <input
                type="text"
                placeholder="장소 또는 온라인 회의 링크"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="상세 설명 / 회의 안건 메모"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>행 등록</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Spreadsheet Table Grid */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 text-[11px] select-none">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-800">#</th>
                <th className="py-2.5 px-3 min-w-[180px] border-r border-slate-800">일정명</th>
                <th className="py-2.5 px-3 min-w-[90px] border-r border-slate-800">카테고리</th>
                <th className="py-2.5 px-3 min-w-[100px] border-r border-slate-800">시작일</th>
                <th className="py-2.5 px-3 min-w-[80px] border-r border-slate-800">시간</th>
                <th className="py-2.5 px-3 min-w-[160px] border-r border-slate-800">장소 / 화상링크</th>
                <th className="py-2.5 px-3 min-w-[200px] border-r border-slate-800">상세 메모</th>
                <th className="py-2.5 px-3 min-w-[100px] border-r border-slate-800">출처</th>
                <th className="py-2.5 px-3 w-24 text-center">동작</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {displayEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    입력된 일정이 없습니다. 상단의 [새 행 입력] 버튼을 눌러 추가하세요.
                  </td>
                </tr>
              ) : (
                displayEvents.map((evt, idx) => {
                  const badge = getCategoryBadge(evt.category);
                  const isEditing = editingId === evt.id;

                  return (
                    <tr
                      key={evt.id}
                      className="hover:bg-slate-900/60 transition group"
                    >
                      {/* Row Number */}
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono border-r border-slate-800/60">
                        {idx + 1}
                      </td>

                      {/* Title */}
                      <td className="py-2.5 px-3 font-semibold text-white border-r border-slate-800/60">
                        {isEditing ? (
                          <input
                            type="text"
                            value={evt.title}
                            onChange={(e) =>
                              onUpdateEvent({ ...evt, title: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-cyan-500 rounded px-2 py-1 text-xs text-white"
                          />
                        ) : (
                          <span className="group-hover:text-cyan-300 transition">
                            {evt.title}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-3 border-r border-slate-800/60">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="py-2.5 px-3 font-mono text-slate-300 border-r border-slate-800/60">
                        {evt.startDate}
                      </td>

                      {/* Time */}
                      <td className="py-2.5 px-3 font-mono text-cyan-400 border-r border-slate-800/60">
                        {evt.isAllDay ? '종일' : evt.startTime || '-'}
                      </td>

                      {/* Location / Link */}
                      <td className="py-2.5 px-3 text-slate-400 border-r border-slate-800/60 max-w-[200px] truncate">
                        {evt.locationOrLink ? (
                          evt.locationOrLink.startsWith('http') ? (
                            <a
                              href={evt.locationOrLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline flex items-center gap-1 truncate"
                            >
                              <span className="truncate">{evt.locationOrLink}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="truncate">{evt.locationOrLink}</span>
                          )
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-2.5 px-3 text-slate-400 border-r border-slate-800/60 max-w-[250px] truncate">
                        {evt.description || <span className="text-slate-600">-</span>}
                      </td>

                      {/* Source */}
                      <td className="py-2.5 px-3 text-[11px] text-slate-400 border-r border-slate-800/60 font-mono">
                        {evt.source === 'auto_screen' ? (
                          <span className="text-cyan-400">화면 AI추출</span>
                        ) : (
                          <span className="text-slate-500">웹 직접입력</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingId(isEditing ? null : evt.id)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                            title={isEditing ? '완료' : '인라인 수정'}
                          >
                            {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit2 className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => onDeleteEvent(evt.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="행 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
