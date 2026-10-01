import React from 'react';
import {
  Calendar as CalendarIcon,
  Monitor,
  Sparkles,
  Download,
  Bell,
  BellOff,
  CheckCircle2,
  Share2,
  FileSpreadsheet,
} from 'lucide-react';
import { CalendarEvent } from '../types';
import { downloadIcsFile } from '../utils/calendarUtils';
import { exportEventsToExcel } from '../utils/excelUtils';

interface HeaderProps {
  isStreaming: boolean;
  isScanning: boolean;
  totalEvents: number;
  pendingCount: number;
  soundAlert: boolean;
  onToggleSound: () => void;
  autoApprove: boolean;
  onToggleAutoApprove: () => void;
  events: CalendarEvent[];
}

export const Header: React.FC<HeaderProps> = ({
  isStreaming,
  isScanning,
  totalEvents,
  pendingCount,
  soundAlert,
  onToggleSound,
  autoApprove,
  onToggleAutoApprove,
  events,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white font-black text-xl tracking-wider">
              <CalendarIcon className="w-5 h-5 text-white" />
              {isStreaming && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  ScreenCal AI
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  실시간 화면 감지
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                화면 속 회의·약속 AI 자동 추출 &amp; 캘린더 등록
              </p>
            </div>
          </div>

          {/* Live Indicator Mobile */}
          <div className="flex sm:hidden items-center gap-2">
            {isStreaming ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                모니터링 중
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                <Monitor className="w-3.5 h-3.5" />
                대기 중
              </span>
            )}
          </div>
        </div>

        {/* Center / Status */}
        <div className="hidden lg:flex items-center gap-3">
          {isStreaming ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-medium">실시간 화면 모니터링 활성</span>
              {isScanning && (
                <span className="ml-2 text-cyan-300 flex items-center gap-1 font-semibold animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI 분석 중...
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs">
              <Monitor className="w-3.5 h-3.5" />
              <span>화면을 공유하거나 샘플을 선택하여 일정을 추출하세요</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
          {/* Auto-approve Toggle */}
          <button
            onClick={onToggleAutoApprove}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              autoApprove
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-sm'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title="신뢰도 85% 이상 일정을 승인 절차 없이 캘린더에 자동 등록"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${autoApprove ? 'text-indigo-400' : 'text-slate-500'}`} />
            <span className="hidden md:inline">고신뢰도 자동등록:</span>
            <span>{autoApprove ? 'ON' : 'OFF'}</span>
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border transition-all ${
              soundAlert
                ? 'bg-slate-800 border-slate-700 text-amber-400'
                : 'bg-slate-800/50 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundAlert ? '새 일정 감지 효과음 켜짐' : '효과음 꺼짐'}
          >
            {soundAlert ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Export All Excel & ICS */}
          {events.length > 0 && (
            <>
              <button
                onClick={() => exportEventsToExcel(events)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/40 transition shadow-sm cursor-pointer"
                title="모든 일정을 Microsoft Excel (.xlsx) 파일로 다운로드"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>엑셀(.xlsx) 저장</span>
              </button>

              <button
                onClick={() => downloadIcsFile(events, 'screencal_all_events.ics')}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="전체 일정을 iCal(.ics) 파일로 다운로드 (Apple/Outlook/Google 캘린더용)"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>.ICS 백업</span>
              </button>
            </>
          )}

          {/* Event counters */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80 text-xs">
            <span className="text-slate-400">등록된 일정:</span>
            <span className="font-bold text-white bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
              {totalEvents}
            </span>
            {pendingCount > 0 && (
              <span className="font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded text-[11px] animate-pulse">
                대기 {pendingCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
