import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ScreenMonitor } from './components/ScreenMonitor';
import { DetectedEventsInbox } from './components/DetectedEventsInbox';
import { CalendarView } from './components/CalendarView';
import { EditEventModal } from './components/EditEventModal';
import { EventDetailModal } from './components/EventDetailModal';
import { CalendarEvent, ScanResult } from './types';
import { playChime } from './utils/calendarUtils';
import { Sparkles, Info, ShieldCheck, Zap } from 'lucide-react';

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'evt_sample_1',
    title: 'AI 스케줄러 기능 리뷰 미팅',
    startDate: new Date().toISOString().slice(0, 10),
    startTime: '16:00',
    endDate: new Date().toISOString().slice(0, 10),
    endTime: '17:00',
    isAllDay: false,
    locationOrLink: 'https://meet.google.com/abc-defg-hij',
    attendees: ['홍길동', '이수진'],
    description: '실시간 화면 인식 기반 일정 추출 정확도 및 캘린더 연동 테스트',
    category: 'meeting',
    confidence: 0.98,
    detectedFromSnippet: '오늘 16:00 구글 밋에서 뵙겠습니다',
    urgency: 'high',
    source: 'auto_screen',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  // State for confirmed calendar events
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem('screencal_events');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_EVENTS;
  });

  // State for pending detected events waiting for approval
  const [pendingEvents, setPendingEvents] = useState<CalendarEvent[]>([]);

  // Settings
  const [soundAlert, setSoundAlert] = useState<boolean>(true);
  const [autoApprove, setAutoApprove] = useState<boolean>(false);

  // Streaming & scanning states
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanSummary, setLastScanSummary] = useState<string | undefined>(
    '준비 완료: 화면 공유를 시작하거나 샘플 화면으로 일정을 추출해 보세요.'
  );
  const [lastScanContext, setLastScanContext] = useState<string | undefined>();

  // Modals
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Video & Stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Save confirmed events to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('screencal_events', JSON.stringify(events));
    } catch {
      // ignore
    }
  }, [events]);

  // Start Screen Capture
  const handleStartStream = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('이 브라우저는 화면 공유(getDisplayMedia)를 지원하지 않습니다.');
        return false;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 5, max: 15 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);

      // Handle stream end when user clicks "Stop Sharing" from browser native control
      stream.getVideoTracks()[0].onended = () => {
        handleStopStream();
      };

      return true;
    } catch (err: any) {
      console.warn('Screen share canceled or error:', err);
      setIsStreaming(false);
      return false;
    }
  };

  // Stop Screen Capture
  const handleStopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Process a captured frame with Gemini AI
  const handleScanFrame = useCallback(
    async (base64Image: string, screenSourceDescription?: string) => {
      if (isScanning) return;
      setIsScanning(true);

      try {
        const referenceDate = new Date().toISOString();

        const response = await fetch('/api/extract-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Image,
            referenceDate,
            additionalPrompt: screenSourceDescription
              ? `현재 소스: ${screenSourceDescription}`
              : undefined,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || '일정 추출에 실패했습니다.');
        }

        const scanData: ScanResult = result.data;
        setLastScanSummary(scanData.summary);
        setLastScanContext(scanData.screenContext);

        if (scanData.events && scanData.events.length > 0) {
          // Play chime if enabled
          if (soundAlert) {
            playChime();
          }

          // Deduplicate against existing events
          const newEvents: CalendarEvent[] = [];

          for (const rawEvt of scanData.events) {
            const isDuplicate = [...events, ...pendingEvents].some(
              (existing) =>
                existing.startDate === rawEvt.startDate &&
                (existing.title.toLowerCase() === rawEvt.title.toLowerCase() ||
                  existing.title.includes(rawEvt.title) ||
                  rawEvt.title.includes(existing.title))
            );

            if (!isDuplicate) {
              const fullEvt: CalendarEvent = {
                ...rawEvt,
                id: rawEvt.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                category: rawEvt.category || 'meeting',
                confidence: rawEvt.confidence ?? 0.9,
                status: 'pending',
                source: 'auto_screen',
                createdAt: new Date().toISOString(),
              };
              newEvents.push(fullEvt);
            }
          }

          if (newEvents.length > 0) {
            if (autoApprove) {
              // High confidence auto confirmed
              const autoApproved = newEvents.filter((e) => e.confidence >= 0.85);
              const remaining = newEvents.filter((e) => e.confidence < 0.85);

              if (autoApproved.length > 0) {
                setEvents((prev) => [
                  ...autoApproved.map((e) => ({ ...e, status: 'confirmed' as const })),
                  ...prev,
                ]);
              }
              if (remaining.length > 0) {
                setPendingEvents((prev) => [...remaining, ...prev]);
              }
            } else {
              setPendingEvents((prev) => [...newEvents, ...prev]);
            }
          }
        }
      } catch (err: any) {
        console.error('Scan error:', err);
        setLastScanSummary(`오류: ${err.message || '일정 추출 실패'}`);
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, soundAlert, autoApprove, events, pendingEvents]
  );

  // Confirm pending event
  const handleConfirmEvent = (event: CalendarEvent) => {
    setEvents((prev) => [{ ...event, status: 'confirmed' }, ...prev]);
    setPendingEvents((prev) => prev.filter((e) => e.id !== event.id));
  };

  // Confirm all pending events
  const handleConfirmAll = () => {
    setEvents((prev) => [
      ...pendingEvents.map((e) => ({ ...e, status: 'confirmed' as const })),
      ...prev,
    ]);
    setPendingEvents([]);
  };

  // Dismiss pending event
  const handleDismissEvent = (eventId: string) => {
    setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  // Delete confirmed event
  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  // Save edited event (either from pending or confirmed or new manual)
  const handleSaveEvent = (savedEvent: CalendarEvent) => {
    // If it was in pending, remove from pending and put in confirmed
    setPendingEvents((prev) => prev.filter((e) => e.id !== savedEvent.id));

    // Update in confirmed or add new
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === savedEvent.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedEvent;
        return copy;
      }
      return [savedEvent, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navigation & Controls */}
      <Header
        isStreaming={isStreaming}
        isScanning={isScanning}
        totalEvents={events.length}
        pendingCount={pendingEvents.length}
        soundAlert={soundAlert}
        onToggleSound={() => setSoundAlert(!soundAlert)}
        autoApprove={autoApprove}
        onToggleAutoApprove={() => setAutoApprove(!autoApprove)}
        events={events}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Hero Explanation Banner */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Gemini 3.8 Flash Vision 엔진
              </span>
              <span className="text-xs text-slate-400">
                실시간 화면 분석 · 1초 추출
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white">
              모니터 화면을 보면서 일정을 자동으로 등록하세요
            </h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              카카오톡, 슬랙 대화나 이메일 창을 띄워두면 AI가 날짜, 시간, 장소, 회의 링크를 자동으로 인식하여 캘린더에 추가합니다. Google Calendar 바로 등록 및 .ICS 파일 다운로드를 지원합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                프라이버시 보호
              </div>
              <p className="text-[11px] text-slate-500">
                화면 영상은 저장되지 않으며 AI 일정 분석용으로만 일회성 처리됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* Screen Monitor Section */}
        <ScreenMonitor
          isStreaming={isStreaming}
          isScanning={isScanning}
          onStartStream={handleStartStream}
          onStopStream={handleStopStream}
          onScanFrame={handleScanFrame}
          videoRef={videoRef}
          streamRef={streamRef}
          lastScanSummary={lastScanSummary}
          lastScanContext={lastScanContext}
        />

        {/* Pending Detected Events Inbox (Appears when AI extracts schedules) */}
        <DetectedEventsInbox
          pendingEvents={pendingEvents}
          onConfirmEvent={handleConfirmEvent}
          onDismissEvent={handleDismissEvent}
          onEditEvent={(evt) => setEditingEvent(evt)}
          onConfirmAll={handleConfirmAll}
        />

        {/* Full In-App Interactive Calendar */}
        <CalendarView
          events={events}
          onAddManualEvent={() => setEditingEvent({})}
          onEditEvent={(evt) => setEditingEvent(evt)}
          onDeleteEvent={handleDeleteEvent}
          onSelectEvent={(evt) => setSelectedEvent(evt)}
          onImportEvents={(newEvts) => setEvents((prev) => [...newEvts, ...prev])}
        />
      </main>

      {/* Edit / Create Event Modal */}
      <EditEventModal
        event={editingEvent}
        isOpen={Boolean(editingEvent)}
        onClose={() => setEditingEvent(null)}
        onSave={handleSaveEvent}
      />

      {/* Event Details Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        onEdit={(evt) => setEditingEvent(evt)}
        onDelete={handleDeleteEvent}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            ScreenCal AI &copy; 2026 · 실시간 데스크톱 화면 일정 자동 추출 및 스마트 캘린더 등록
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Google Calendar 연동 지원</span>
            <span>·</span>
            <span>iCal / Apple Calendar / Outlook 호환</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
