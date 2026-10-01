import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  Play,
  Square,
  Sparkles,
  Camera,
  Upload,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Clipboard,
} from 'lucide-react';
import { SAMPLE_SCREENS, SampleScreenItem } from '../utils/sampleScreens';

interface ScreenMonitorProps {
  isStreaming: boolean;
  isScanning: boolean;
  onStartStream: () => Promise<boolean>;
  onStopStream: () => void;
  onScanFrame: (base64Image: string, screenSourceDescription?: string) => Promise<void>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  lastScanSummary?: string;
  lastScanContext?: string;
}

export const ScreenMonitor: React.FC<ScreenMonitorProps> = ({
  isStreaming,
  isScanning,
  onStartStream,
  onStopStream,
  onScanFrame,
  videoRef,
  streamRef,
  lastScanSummary,
  lastScanContext,
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'sample' | 'upload'>('stream');
  const [autoScanInterval, setAutoScanInterval] = useState<number>(20); // 20s default
  const [countdown, setCountdown] = useState<number>(20);
  const [selectedSample, setSelectedSample] = useState<string>('kakaotalk-meeting');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Capture current video frame to base64
  const captureVideoFrame = useCallback((): string | null => {
    if (!videoRef.current || !streamRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement('canvas');
    // Scale down slightly for performance and token efficiency while maintaining sharp text
    const maxDimension = 1600;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setPreviewImage(dataUrl);
    return dataUrl;
  }, [videoRef, streamRef]);

  // Handle manual scan button click
  const handleManualScan = async () => {
    if (activeTab === 'stream') {
      const frame = captureVideoFrame();
      if (frame) {
        await onScanFrame(frame, '실시간 화면 공유 캡처');
      } else {
        setStreamError('화면 프레임을 캡처할 수 없습니다. 화면 공유가 활성화되어 있는지 확인하세요.');
      }
    } else if (activeTab === 'sample') {
      runSampleScan(selectedSample);
    }
  };

  // Run scan for a selected sample screen
  const runSampleScan = async (sampleId: string) => {
    const sample = SAMPLE_SCREENS.find((s) => s.id === sampleId);
    if (!sample) return;

    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    sample.render(ctx, 900, 420);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewImage(dataUrl);

    await onScanFrame(dataUrl, `샘플 화면: ${sample.name} (${sample.appName})`);
  };

  // Render sample preview whenever selectedSample changes
  useEffect(() => {
    const sample = SAMPLE_SCREENS.find((s) => s.id === selectedSample);
    if (sample && sampleCanvasRef.current) {
      const canvas = sampleCanvasRef.current;
      canvas.width = 750;
      canvas.height = 350;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        sample.render(ctx, 750, 350);
      }
    }
  }, [selectedSample, activeTab]);

  // Auto-scan countdown loop
  useEffect(() => {
    if (!isStreaming || autoScanInterval <= 0 || isScanning) {
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const frame = captureVideoFrame();
          if (frame) {
            onScanFrame(frame, '실시간 자동 주기 스캔');
          }
          return autoScanInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStreaming, autoScanInterval, isScanning, captureVideoFrame, onScanFrame]);

  // Reset countdown when interval changes
  useEffect(() => {
    setCountdown(autoScanInterval);
  }, [autoScanInterval]);

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPreviewImage(dataUrl);
        await onScanFrame(dataUrl, `업로드된 스크린샷: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste listener (Cmd+V / Ctrl+V screenshot)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                setPreviewImage(dataUrl);
                setActiveTab('upload');
                await onScanFrame(dataUrl, '클립보드 붙여넣기 스크린샷');
              }
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onScanFrame]);

  const startStreamHandler = async () => {
    setStreamError(null);
    const success = await onStartStream();
    if (!success) {
      setStreamError('화면 공유 권한이 취소되었거나 지원되지 않습니다. 샘플 화면 탭을 통해 즉시 테스트해볼 수 있습니다.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
      {/* Top Tabs & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('stream')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'stream'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>실시간 화면 공유</span>
            {isStreaming && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('sample')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'sample'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>체험용 샘플 화면 (4종)</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'upload'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>스크린샷 업로드</span>
          </button>
        </div>

        {/* Auto Scan Timer Config */}
        {activeTab === 'stream' && isStreaming && (
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>주기 스캔:</span>
            <select
              value={autoScanInterval}
              onChange={(e) => setAutoScanInterval(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 font-medium rounded px-2 py-0.5 border border-slate-700 text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value={10}>10초마다</option>
              <option value={20}>20초마다 (권장)</option>
              <option value={30}>30초마다</option>
              <option value={60}>1분마다</option>
              <option value={0}>수동 스캔만</option>
            </select>

            {autoScanInterval > 0 && !isScanning && (
              <span className="text-[11px] text-cyan-400 font-mono ml-1 font-bold">
                {countdown}s 후
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Display Area */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center group shadow-inner">
        {/* Tab 1: Live Stream */}
        {activeTab === 'stream' && (
          <>
            <video
              ref={videoRef as any}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain ${isStreaming ? 'block' : 'hidden'}`}
            />

            {!isStreaming && (
              <div className="text-center p-6 max-w-md flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-1">
                  <Monitor className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">
                  화면을 공유하여 일정을 실시간 감지하세요
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  메신저(카카오톡, 슬랙), 이메일, 웹사이트 창을 띄워두면 AI가 일정, 회의 시간, Zoom 링크를 감지하여 캘린더에 바로 등록해 드립니다.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  <button
                    onClick={startStreamHandler}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    화면 공유 시작
                  </button>
                  <button
                    onClick={() => setActiveTab('sample')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    샘플로 먼저 테스트
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Sample Screens */}
        {activeTab === 'sample' && (
          <div className="w-full h-full flex flex-col items-center justify-center relative p-3">
            <canvas
              ref={sampleCanvasRef}
              className="max-h-full max-w-full object-contain rounded-lg shadow-md border border-slate-700/60"
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">
                  {SAMPLE_SCREENS.find((s) => s.id === selectedSample)?.name}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  — {SAMPLE_SCREENS.find((s) => s.id === selectedSample)?.description}
                </span>
              </div>
              <button
                onClick={() => runSampleScan(selectedSample)}
                disabled={isScanning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                이 화면 분석하기
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Upload Image */}
        {activeTab === 'upload' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {previewImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={previewImage}
                  alt="업로드된 스크린샷"
                  className="max-h-full max-w-full object-contain rounded-lg border border-slate-800"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs border border-slate-700 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다른 이미지 선택
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer p-6 transition"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-200">
                    스크린샷 이미지 업로드 또는 붙여넣기 (Ctrl + V)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    화면 캡처 파일(PNG, JPG, WebP)을 드래그하거나 클릭하여 업로드하세요
                  </p>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium">
                  파일 선택
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Laser Scanning Animation Overlay */}
        {isScanning && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center z-20 pointer-events-none">
            {/* Animated Laser Sweep Line */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse" />
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Gemini 3.8 Flash가 화면을 정밀 분석 중...</span>
                </p>
                <p className="text-[11px] text-cyan-300">
                  메신저 대화, 시간, 날짜, 회의 링크, 참석자 추출 중
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stream Status Overlay (Top Left) */}
        {isStreaming && activeTab === 'stream' && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-emerald-300">LIVE SCREEN</span>
          </div>
        )}
      </div>

      {/* Stream Error Alert if any */}
      {streamError && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">{streamError}</span>
          </div>
        </div>
      )}

      {/* Sample Selector Buttons Bar (when in Sample tab) */}
      {activeTab === 'sample' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {SAMPLE_SCREENS.map((sample) => {
            const isSelected = selectedSample === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => setSelectedSample(sample.id)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 truncate">
                    {sample.name}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${sample.badgeColor}`}>
                    {sample.appName}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">
                  {sample.description}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isStreaming ? (
            <button
              onClick={onStopStream}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow-md w-full sm:w-auto cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              화면 공유 중지
            </button>
          ) : (
            activeTab === 'stream' && (
              <button
                onClick={startStreamHandler}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md w-full sm:w-auto cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                화면 공유 시작
              </button>
            )
          )}

          {/* Trigger Scan Button */}
          <button
            onClick={handleManualScan}
            disabled={isScanning || (activeTab === 'stream' && !isStreaming)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-xs transition shadow-md w-full sm:w-auto cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>지금 화면 스캔</span>
          </button>
        </div>

        {/* Scan Status Snippet */}
        {lastScanSummary && (
          <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 w-full sm:w-auto overflow-hidden">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{lastScanSummary}</span>
          </div>
        )}
      </div>
    </div>
  );
};
