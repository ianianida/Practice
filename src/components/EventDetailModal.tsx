import React from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  FileText,
  ExternalLink,
  Download,
  Trash2,
  Edit2,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { CalendarEvent } from '../types';
import {
  formatEventDateTime,
  getCategoryBadge,
  generateGoogleCalendarUrl,
  downloadIcsFile,
} from '../utils/calendarUtils';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !event) return null;

  const badge = getCategoryBadge(event.category);
  const gcalUrl = generateGoogleCalendarUrl(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
            >
              {badge.label}
            </span>
            {event.source === 'auto_screen' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                화면 AI 추출
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                onEdit(event);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="수정"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                onDelete(event.id);
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-white leading-snug">
              {event.title}
            </h2>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-cyan-300 font-medium">
            <Clock className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>{formatEventDateTime(event)}</span>
          </div>

          {/* Location / Link */}
          {event.locationOrLink && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              {event.locationOrLink.startsWith('http') ? (
                <>
                  <LinkIcon className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                  <a
                    href={event.locationOrLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline break-all"
                  >
                    {event.locationOrLink}
                  </a>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="break-all">{event.locationOrLink}</span>
                </>
              )}
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-2.5 text-xs text-slate-300">
              <Users className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-400">참석자: </span>
                <span>{event.attendees.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400">상세 설명</span>
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}

          {/* AI Trigger Snippet */}
          {event.detectedFromSnippet && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-cyan-400" />
                화면 감지 단서
              </span>
              <p className="text-[11px] text-slate-400 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 font-mono italic">
                "{event.detectedFromSnippet}"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 p-4 bg-slate-950 border-t border-slate-800">
          <button
            onClick={() => downloadIcsFile([event], `${event.title}.ics`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>.ICS 파일 다운로드</span>
          </button>

          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition"
          >
            <span>Google 캘린더에 바로 등록</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
