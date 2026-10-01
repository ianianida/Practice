export type EventCategory =
  | 'meeting'
  | 'deadline'
  | 'personal'
  | 'travel'
  | 'webinar'
  | 'other';

export type EventUrgency = 'high' | 'medium' | 'low';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  isAllDay: boolean;
  locationOrLink?: string;
  attendees?: string[];
  description?: string;
  category: EventCategory;
  confidence: number; // 0.0 - 1.0
  detectedFromSnippet?: string;
  urgency?: EventUrgency;
  source?: 'auto_screen' | 'manual' | 'sample_screen';
  status: 'pending' | 'confirmed' | 'dismissed';
  createdAt: string;
  snapshotUrl?: string;
}

export interface ScanResult {
  summary: string;
  screenContext: string;
  events: CalendarEvent[];
  timestamp: string;
  snapshotBase64?: string;
}

export interface CaptureSettings {
  autoScanInterval: number; // in seconds, 0 = off, 10, 20, 30, 60
  soundAlert: boolean;
  autoApproveHighConfidence: boolean; // confidence >= 0.9 auto adds to calendar
  captureQuality: 'high' | 'medium';
}

export interface SampleScreen {
  id: string;
  name: string;
  category: string;
  description: string;
  previewPrompt: string;
  renderToCanvas: (canvas: HTMLCanvasElement) => void;
}
