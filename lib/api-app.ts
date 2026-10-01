import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });
const app = express();

// Support large screen captures in base64
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));
// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Schedule extraction endpoint
app.post('/api/extract-schedule', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', referenceDate, additionalPrompt } = req.body || {};

    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return res.status(400).json({ error: '이미지 데이터(imageBase64)가 필요합니다.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. Vercel 환경 변수에 API 키를 추가해 주세요.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Clean base64 string if it contains data URI header
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const currentRef = referenceDate || new Date().toISOString();

    const systemInstruction = `
당신은 데스크톱 화면에서 일정, 회의, 약속, 마감 기한, 항공/교통편, 티켓 예약을 정밀하게 인식하고 추출하는 최고 수준의 AI 스케줄 어시스턴트입니다.
사용자의 화면 스크린샷(카카오톡, 슬랙, 디스코드, 이메일(Gmail/Outlook), 캘린더 초대, 줌/미트 링크, 노션, 메모, 메신저 대화, 웹사이트 등)을 분석합니다.

[중요 지침]
1. 기준 시점(현재 날짜 및 시간): ${currentRef}
   - '내일', '모레', '다음 주 화요일', '이번 주 금요일 3시', '오후 2시' 등의 상대적 표현은 반드시 기준 시점을 바탕으로 정확한 YYYY-MM-DD 날짜를 계산해야 합니다.
   - 시간이 명시되지 않은 경우 종일 일정(isAllDay: true)으로 처리하거나 합리적 기본값(오전 09:00 또는 오후 14:00)을 제안하세요.
   - 종료 시간이 없으면 시작 시간 기준 1시간 후로 자동 설정하세요.
2. 식별 대상:
   - 회의 및 미팅 (온라인/오프라인)
   - 화상 통화 (Zoom, Google Meet, Teams 링크 포함)
   - 업무 마감일 (Deadline, 과제 제출, 릴리즈)
   - 개인 약속 (식사, 병원, 생일, 스터디)
   - 교통/예약 (항공편, 기차, 호텔 체크인)
3. 화면에 명확한 일정이 없는 경우:
   - events 목록을 빈 배열 []로 반환하고, summary에 "화면에서 감지된 일정이 없습니다."와 간단한 안내를 남기세요.
4. 신뢰도(confidence):
   - 0.0 ~ 1.0 (명확한 날짜/시간/내용이 있으면 0.9 이상, 유추된 것은 0.6~0.8)
5. 언어: 한국어로 제목 및 설명을 친절하고 명확하게 작성하세요.
`;

    const promptText = `
현재 화면 캡처 이미지를 철저히 분석하여 일정 정보를 추출해 주세요.
${additionalPrompt ? `추가 요청 사항: ${additionalPrompt}` : ''}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: '화면에서 감지된 상황 및 추출 결과 요약 (예: "슬랙 채널에서 내일 오후 3시 디자인 리뷰 일정 1건을 감지했습니다")',
            },
            screenContext: {
              type: Type.STRING,
              description: '화면의 성격 (예: "카카오톡 대화방", "슬랙 메신저", "Gmail 웹메일", "웹 브라우저", "문서")',
            },
            events: {
              type: Type.ARRAY,
              description: '추출된 일정 목록',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: {
                    type: Type.STRING,
                    description: '고유 식별자 임의 생성 (예: evt_1)',
                  },
                  title: {
                    type: Type.STRING,
                    description: '일정 제목 (예: "마케팅 주간 싱크", "치과 정기 검진")',
                  },
                  startDate: {
                    type: Type.STRING,
                    description: '시작 날짜 (YYYY-MM-DD)',
                  },
                  startTime: {
                    type: Type.STRING,
                    description: '시작 시간 (HH:mm, 24시간 형식) 또는 종일인 경우 빈 문자열',
                  },
                  endDate: {
                    type: Type.STRING,
                    description: '종료 날짜 (YYYY-MM-DD)',
                  },
                  endTime: {
                    type: Type.STRING,
                    description: '종료 시간 (HH:mm, 24시간 형식) 또는 종일인 경우 빈 문자열',
                  },
                  isAllDay: {
                    type: Type.BOOLEAN,
                    description: '종일 일정 여부',
                  },
                  locationOrLink: {
                    type: Type.STRING,
                    description: '장소 또는 Zoom/Meet 온라인 화상 링크',
                  },
                  attendees: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '언급된 참석자 또는 상대방 이름/이메일',
                  },
                  description: {
                    type: Type.STRING,
                    description: '일정 상세 설명 및 회의 안건',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'meeting | deadline | personal | travel | webinar | other',
                  },
                  confidence: {
                    type: Type.NUMBER,
                    description: '0.0 ~ 1.0 확신도',
                  },
                  detectedFromSnippet: {
                    type: Type.STRING,
                    description: '화면에서 이 일정을 유추하게 된 텍스트 또는 단서 문장',
                  },
                  urgency: {
                    type: Type.STRING,
                    description: 'high | medium | low',
                  },
                },
                required: ['title', 'startDate', 'category', 'confidence'],
              },
            },
          },
          required: ['summary', 'events'],
        },
      },
    });

    const responseText = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      return res.status(500).json({
        error: 'AI 응답 파싱 실패',
        raw: responseText,
      });
    }

    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('Extract schedule error:', error);
    return res.status(500).json({
      error: error?.message || '일정 추출 중 오류가 발생했습니다.',
    });
  }
});


export default app;
