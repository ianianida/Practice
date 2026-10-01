export interface SampleScreenItem {
  id: string;
  name: string;
  category: string;
  appName: string;
  badgeColor: string;
  description: string;
  render: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export const SAMPLE_SCREENS: SampleScreenItem[] = [
  {
    id: 'kakaotalk-meeting',
    name: '카카오톡 대화방',
    category: '메신저 회의 약속',
    appName: 'KakaoTalk',
    badgeColor: 'bg-yellow-400 text-yellow-950',
    description: '팀장님과의 판교 사옥 킥오프 미팅 일정 약속',
    render: (ctx, w, h) => {
      // Background Kakao chat room (#b2c7da)
      ctx.fillStyle = '#b2c7da';
      ctx.fillRect(0, 0, w, h);

      // Kakao Top Bar
      ctx.fillStyle = '#a1b5c8';
      ctx.fillRect(0, 0, w, 60);

      ctx.fillStyle = '#1e1e1e';
      ctx.font = 'bold 18px "Pretendard", "Apple SD Gothic Neo", sans-serif';
      ctx.fillText('AI 에이전트 TF팀 (4)', 24, 38);

      // Date Pill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.roundRect(w / 2 - 90, 80, 180, 28, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('2026년 9월 30일 수요일', w / 2, 98);
      ctx.textAlign = 'left';

      // Other Person Avatar & Name
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(36, 150, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('팀장', 25, 155);

      ctx.fillStyle = '#333333';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('김민우 팀장', 65, 140);

      // Bubble 1 (Left)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(65, 150, 420, 110, 10);
      ctx.fill();

      ctx.fillStyle = '#1e1e1e';
      ctx.font = '14px sans-serif';
      ctx.fillText('여러분, 내일(10월 1일) 오후 3시에', 80, 180);
      ctx.fillText('판교 카카오 사옥 7층 대회의실에서', 80, 204);
      ctx.fillText('신규 AI 프로젝트 킥오프 회의 진행하겠습니다!', 80, 228);
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.fillText('참석 대상: 김민우, 이지은, 박서준', 80, 248);

      // My Reply (Right)
      ctx.fillStyle = '#fee500';
      ctx.beginPath();
      ctx.roundRect(w - 320, 285, 296, 75, 10);
      ctx.fill();

      ctx.fillStyle = '#1e1e1e';
      ctx.font = '14px sans-serif';
      ctx.fillText('네 팀장님 확인했습니다!', w - 305, 312);
      ctx.fillText('내일 15:00에 발표 자료 준비해서', w - 305, 332);
      ctx.fillText('회의실로 참석하겠습니다.', w - 305, 350);

      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.fillText('오후 9:02 · 1', w - 370, 350);
    },
  },
  {
    id: 'slack-zoom-sync',
    name: '슬랙 원격 데모 미팅',
    category: '화상 회의 링크',
    appName: 'Slack & Zoom',
    badgeColor: 'bg-purple-500 text-white',
    description: '고객사 대상 제품 라이브 데모 및 Zoom 링크',
    render: (ctx, w, h) => {
      // Dark Slack workspace background
      ctx.fillStyle = '#1a1d21';
      ctx.fillRect(0, 0, w, h);

      // Slack Header
      ctx.fillStyle = '#222529';
      ctx.fillRect(0, 0, w, 52);
      ctx.fillStyle = '#e0e0e0';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('# product-demo-sync', 24, 32);

      // Message Card
      ctx.fillStyle = '#2c3136';
      ctx.beginPath();
      ctx.roundRect(24, 75, w - 48, 280, 12);
      ctx.fill();

      // Avatar
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(56, 110, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('SC', 47, 115);

      // User & time
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Sarah Chen (Product Lead)', 90, 106);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px sans-serif';
      ctx.fillText('오전 10:15', 290, 106);

      // Text
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '15px sans-serif';
      ctx.fillText('@channel 다음 주 화요일(2026-10-06) 오전 10:00 ~ 11:30', 90, 142);
      ctx.fillText('글로벌 엔터프라이즈 고객사 라이브 데모 미팅이 확정되었습니다.', 90, 168);

      // Zoom Box
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(90, 190, w - 140, 85, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('📹 Zoom Meeting: https://zoom.us/j/9876543210', 108, 220);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.fillText('Passcode: 882910 | 의제: 실시간 AI 연동 및 엔터프라이즈 보안 데모', 108, 246);

      // Reactions
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(90, 290, 80, 30, 15);
      ctx.roundRect(180, 290, 80, 30, 15);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px sans-serif';
      ctx.fillText('🙌 8', 115, 310);
      ctx.fillText('🔥 5', 205, 310);
    },
  },
  {
    id: 'flight-booking',
    name: '항공권 출장 확정 메일',
    category: '출장 및 교통',
    appName: 'Gmail',
    badgeColor: 'bg-sky-500 text-white',
    description: '김포 → 제주 출장 항공권 발권 및 탑승 안내',
    render: (ctx, w, h) => {
      // Light Mail client
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Mail Header
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, 70);
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('대한항공 (KOREAN AIR)', 24, 42);

      // Ticket Box
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(24, 95, w - 48, 260, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText('[전자항공권 발권 확인서] 서울(김포) ✈ 제주', 48, 135);

      ctx.fillStyle = '#64748b';
      ctx.font = '13px sans-serif';
      ctx.fillText('예약번호: KE-2026-X9810 | 편명: KE1205', 48, 162);

      // Route
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('GMP 09:30', 48, 210);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText('2026년 10월 15일 (목)', 48, 235);
      ctx.fillText('김포공항 국내선 터미널', 48, 255);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('➔  1시간 10분  ➔', 220, 210);

      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('CJU 10:40', 410, 210);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText('2026년 10월 15일 (목)', 410, 235);
      ctx.fillText('제주국제공항 도착', 410, 255);

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(48, 280, w - 96, 45);
      ctx.fillStyle = '#334155';
      ctx.font = '13px sans-serif';
      ctx.fillText('※ 출발 30분 전까지 탑승구에 도착해 주시기 바랍니다.', 64, 308);
    },
  },
  {
    id: 'kanban-deadline',
    name: '프로젝트 배포 마감',
    category: '마감 기한',
    appName: 'Jira / GitHub',
    badgeColor: 'bg-rose-500 text-white',
    description: 'v2.0 프로덕션 릴리즈 및 서비스 점검 마감',
    render: (ctx, w, h) => {
      // Board Dark
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Top nav
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, 56);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Sprint 42 Board · Core Services', 24, 34);

      // Task Card
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(24, 85, w - 48, 260, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('🔴 CRITICAL DEADLINE', 48, 120);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText('결제 시스템 v2.4 프로덕션 릴리즈 배포 마감', 48, 154);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('마감 기한: 2026년 10월 09일 (금) 18:00 KST', 48, 190);
      ctx.fillText('담당: DevOps & 결제 코어 개발팀', 48, 215);

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(48, 235, w - 96, 60, 8);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px sans-serif';
      ctx.fillText('체크리스트: DB 마이그레이션 사전 검증 완료, 롤백 플랜 수립, 모니터링 알림 연동', 64, 270);
    },
  },
];
