import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, Users, FileText, Check } from 'lucide-react';
import { CalendarEvent, EventCategory } from '../types';

interface EditEventModalProps {
  event: Partial<CalendarEvent> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !event) return null;

  const [title, setTitle] = useState(event.title || '');
  const [category, setCategory] = useState<EventCategory>(event.category || 'meeting');
  const [startDate, setStartDate] = useState(
    event.startDate || new Date().toISOString().slice(0, 10)
  );
  const [startTime, setStartTime] = useState(event.startTime || '14:00');
  const [endDate, setEndDate] = useState(
    event.endDate || event.startDate || new Date().toISOString().slice(0, 10)
  );
  const [endTime, setEndTime] = useState(event.endTime || '15:00');
  const [isAllDay, setIsAllDay] = useState(Boolean(event.isAllDay));
  const [locationOrLink, setLocationOrLink] = useState(event.locationOrLink || '');
  const [attendeesStr, setAttendeesStr] = useState(event.attendees ? event.attendees.join(', ') : '');
  const [description, setDescription] = useState(event.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const attendees = attendeesStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedEvent: CalendarEvent = {
      id: event.id || `evt_${Date.now()}`,
      title: title.trim(),
      category,
      startDate,
      startTime: isAllDay ? '' : startTime,
      endDate: endDate || startDate,
      endTime: isAllDay ? '' : endTime,
      isAllDay,
      locationOrLink: locationOrLink.trim() || undefined,
      attendees: attendees.length > 0 ? attendees : undefined,
      description: description.trim() || undefined,
      confidence: event.confidence ?? 1.0,
      detectedFromSnippet: event.detectedFromSnippet,
      urgency: event.urgency || 'medium',
      source: event.source || 'manual',
      status: 'confirmed',
      createdAt: event.createdAt || new Date().toISOString(),
    };

    onSave(updatedEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-white">
              {event.id ? '일정 정보 수정' : '새 일정 직접 추가'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              일정 제목 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 마케팅 전략 주간 회의"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              카테고리
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'meeting', label: '회의·미팅' },
                { id: 'deadline', label: '마감·제출' },
                { id: 'personal', label: '개인 약속' },
                { id: 'travel', label: '교통·출장' },
                { id: 'webinar', label: '웨비나' },
                { id: 'other', label: '기타' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as EventCategory)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                    category === c.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-300">종일 일정</span>
            <button
              type="button"
              onClick={() => setIsAllDay(!isAllDay)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                isAllDay ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                시작 날짜
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {!isAllDay && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  시작 시간
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                종료 날짜
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {!isAllDay && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  종료 시간
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>

          {/* Location or Link */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>장소 또는 온라인 화상 링크 (Zoom / Meet)</span>
            </label>
            <input
              type="text"
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              placeholder="예: 판교 사옥 7층 회의실 또는 https://zoom.us/j/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>

          {/* Attendees */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>참석자 (쉼표로 구분)</span>
            </label>
            <input
              type="text"
              value={attendeesStr}
              onChange={(e) => setAttendeesStr(e.target.value)}
              placeholder="예: 김민우, 이지은, sarah@company.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>상세 메모 및 안건</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="회의 안건, 준비 사항, 메모 등"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              <Check className="w-4 h-4" />
              <span>저장 및 캘린더 등록</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
