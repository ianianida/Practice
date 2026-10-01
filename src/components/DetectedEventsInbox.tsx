import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Check,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  Download,
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

interface DetectedEventsInboxProps {
  pendingEvents: CalendarEvent[];
  onConfirmEvent: (event: CalendarEvent) => void;
  onDismissEvent: (eventId: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onConfirmAll: () => void;
}

export const DetectedEventsInbox: React.FC<DetectedEventsInboxProps> = ({
  pendingEvents,
  onConfirmEvent,
  onDismissEvent,
  onEditEvent,
  onConfirmAll,
}) => {
  if (pendingEvents.length === 0) {
    return null;
  }

  return (
    <section className="bg-slate-900 border-2 border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-cyan-950/20 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <span>화면에서 감지된 새 일정</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                {pendingEvents.length}건
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              AI가 화면 텍스트를 바탕으로 일정을 정리했습니다. 확인 후 캘린더에 등록하세요.
            </p>
          </div>
        </div>

        {pendingEvents.length > 1 && (
          <button
            onClick={onConfirmAll}
            className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>모두 캘린더에 일괄 등록 ({pendingEvents.length})</span>
          </button>
        )}
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4">
        {pendingEvents.map((event) => {
          const badge = getCategoryBadge(event.category);
          const gcalUrl = generateGoogleCalendarUrl(event);
          const confidencePct = Math.round(event.confidence * 100);

          return (
            <div
              key={event.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 flex flex-col justify-between gap-3.5 transition group shadow-md"
            >
              {/* Top Row: Category + Confidence + Actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {badge.label}
                  </span>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      confidencePct >= 90
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : confidencePct >= 70
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    AI 확신도 {confidencePct}%
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditEvent(event)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="일정 상세 수정"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDismissEvent(event.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="무시하기"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Time */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-base text-white group-hover:text-cyan-300 transition leading-snug">
                  {event.title}
                </h4>

                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatEventDateTime(event)}</span>
                </div>

                {/* Location or Online link */}
                {event.locationOrLink && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    {event.locationOrLink.startsWith('http') ? (
                      <LinkIcon className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    )}
                    <span className="truncate">{event.locationOrLink}</span>
                  </div>
                )}

                {/* Attendees */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{event.attendees.join(', ')}</span>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pt-1">
                    {event.description}
                  </p>
                )}

                {/* Screen Clue Snippet */}
                {event.detectedFromSnippet && (
                  <div className="text-[11px] text-slate-400 bg-slate-900/90 rounded-lg p-2 border border-slate-800/80 italic font-mono flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-cyan-400 mt-0.5" />
                    <span className="line-clamp-2">"{event.detectedFromSnippet}"</span>
                  </div>
                )}
              </div>

              {/* Bottom Registration Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onConfirmEvent(event)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>캘린더에 바로 등록</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={gcalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                    title="Google 캘린더 새 창에서 즉시 추가"
                  >
                    <span>Google 캘린더</span>
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                  </a>

                  <button
                    onClick={() => downloadIcsFile([event], `${event.title}.ics`)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700"
                    title="iCal (.ics) 파일 다운로드"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
