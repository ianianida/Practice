# ScreenCal AI

Vite · React · TypeScript로 만든 화면 기반 일정 추출 앱입니다.

## 로컬 실행

Node.js 22.12 이상(22.x)과 npm을 사용합니다.

```sh
npm ci
```

`.env.example`을 `.env`로 복사하고 `GEMINI_API_KEY`를 설정한 뒤 실행합니다.

```sh
npm run dev
```

기본 주소는 `http://localhost:3000`입니다. API 키가 없어도 화면과 수동 일정 관리는 사용할 수 있습니다. AI 추출은 키가 필요합니다.

## 빌드 및 확인

```sh
npm run lint
npm run build
```

`npm run preview`는 `dist`의 프런트엔드만 확인합니다. API를 포함한 로컬 프로덕션 확인은 빌드 후 `NODE_ENV=production npm start`로 실행합니다(PowerShell: `$env:NODE_ENV='production'; npm start`).

## Vercel 배포

- Git 저장소: `ianianida/Practice`
- Framework Preset: **Vite**
- Production Branch: **main**
- Node.js: **22.x**
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

Vercel 프로젝트를 GitHub 저장소에 연결하면 `main` 푸시는 Production을, 다른 브랜치 푸시는 Preview를 배포합니다. 빌드 명령은 `vercel.json`에 유지합니다.

`/api/health`와 `/api/extract-schedule`은 Vercel Functions로 실행됩니다. API 키는 Vercel의 **Settings → Environment Variables → GEMINI_API_KEY**에 Production 및 필요한 Preview 환경용으로 저장하고 재배포합니다. `VITE_` 접두사를 붙이지 않습니다. 키는 브라우저 번들에 포함되지 않습니다.

Vercel Functions의 요청 본문 제한은 4.5 MB입니다. Base64 변환 후 이 크기를 넘는 스크린샷은 축소해야 합니다. AI 모델 설정은 기존 앱의 `gemini-3.8-flash`를 유지하며, 실제 사용에는 해당 모델 접근이 가능한 키가 필요합니다.

`.env`, `.vercel`, `node_modules`, `dist`는 Git에 올리지 않습니다.
