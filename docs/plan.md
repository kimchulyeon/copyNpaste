# SI Sync — 프로젝트 폴더 동기화 도구

## 1. 개요

SI 환경에서 회사 프로젝트 폴더와 고객사 프로젝트 폴더 간 파일 동기화를 안전하고 빠르게 수행하기 위한 데스크탑 앱.

### 해결하려는 문제

- 회사와 고객사의 Git 저장소가 분리되어 있어 수작업으로 파일을 옮겨야 함
- 전체 덮어쓰기 시 Dockerfile, deploy.yml 등 인프라 파일까지 덮어써지는 사고 발생
- 하나씩 옮기면 누락이 생기고 시간이 오래 걸림

### 핵심 가치

**"변경된 파일만 보고, 골라서, 안전하게 덮어쓰기"**

---

## 2. 기술 스택

| 구분 | 기술 | 이유 |
|------|------|------|
| 프레임워크 | Electron | 크로스 플랫폼 데스크탑 앱, 웹 기술 활용 가능 |
| 프론트엔드 | React + TypeScript | 프론트엔드 개발자에게 익숙한 스택 |
| 스타일링 | Tailwind CSS 또는 CSS Modules | 빠른 UI 개발 (선택) |
| Git 연동 | simple-git | Node.js 기반 Git 명령어 래퍼 |
| 파일 비교 | Node.js fs/crypto 모듈 | 파일 해시(MD5) 비교로 변경 감지 |
| 빌드/번들 | electron-builder | 설치 파일(.dmg, .exe) 생성 |

---

## 3. 화면 구성

앱은 총 2개 화면으로 구성된다.

### 화면 1: 폴더 선택

앱 실행 시 첫 화면. 두 개의 폴더 경로를 지정한다.

```
┌─────────────────────────────────────────┐
│  SI Sync                                │
│                                         │
│  출발지 (회사 프로젝트)                    │
│  ┌──────────────────────────┐ [찾아보기] │
│  │ /Users/dev/company/app   │           │
│  └──────────────────────────┘           │
│                  ↓                      │
│  목적지 (고객사 프로젝트)                  │
│  ┌──────────────────────────┐ [찾아보기] │
│  │ /Users/dev/client/app    │           │
│  └──────────────────────────┘           │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │         차이점 스캔              │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**동작 상세:**

- "찾아보기" 버튼 → Electron의 `dialog.showOpenDialog`로 폴더 선택
- 경로 직접 입력도 가능
- 두 경로 모두 입력되어야 "차이점 스캔" 버튼 활성화
- 스캔 버튼 클릭 → 두 폴더의 파일을 비교하여 차이가 있는 파일 목록 추출 → 화면 2로 이동

### 화면 2: 파일 비교 및 동기화

좌우 2패널 레이아웃.

```
┌──────────────────────────┬────────────────────────────────┐
│ [← 폴더 다시 선택]       │                                │
│ 출발: /company/app       │  src/components/Header.tsx     │
│ 목적: /client/app        │  MODIFIED                      │
│──────────────────────────│  출발: 4.2KB · 2026-03-14      │
│ [✓] 전체선택  9개 변경    │  목적: 3.8KB · 2026-03-10      │
│──────────────────────────│                                │
│ [✓] src/components/      │  ⚠ 인프라 파일 경고 (해당 시)    │
│     Header.tsx           │                                │
│     김민수 · Header 반응… │  ── Git 이력 (출발지) ──────── │
│                          │                                │
│ [✓] src/pages/           │  ● a3f1c2d                     │
│     Dashboard.tsx        │    Header 반응형 브레이크포인트 수정│
│     박서준 · 대시보드 차…  │    김민수 · 2026-03-14 09:23   │
│                          │    │                           │
│ [ ] ⚠ Dockerfile         │  ○ e7b4a1f                     │
│     박서준 · Node 버전…   │    Header 네비게이션 메뉴 추가   │
│                          │    김민수 · 2026-03-13 17:45   │
│ [ ] ⚠ .github/workflows/ │    │                           │
│     deploy.yml           │  ○ 1d9f3e2                     │
│     박서준 · 배포 스크…    │    Header 로고 이미지 교체      │
│                          │    이지은 · 2026-03-12 11:30   │
│──────────────────────────│                                │
│ [  5개 파일 덮어쓰기   ]  │                                │
└──────────────────────────┴────────────────────────────────┘
```

#### 좌측 패널 — 파일 목록

- 출발지와 목적지 간 차이가 있는 파일 목록 표시
- 각 파일에 체크박스 제공
- 파일 상태 표시: `MODIFIED` (변경), `NEW` (출발지에만 존재), `DELETED` (목적지에만 존재)
- 인프라/배포 파일은 ⚠ 아이콘으로 시각적 경고
- 전체 선택/해제 기능
- 하단에 "N개 파일 덮어쓰기" 버튼

#### 우측 패널 — 파일 상세

좌측에서 파일을 클릭하면 우측에 해당 파일의 상세 정보 표시.

- 파일명, 상태 배지
- 출발지/목적지 파일 크기 및 최종 수정일
- 인프라 파일인 경우 경고 메시지 표시
- 해당 파일의 **출발지 Git 커밋 이력** (타임라인 형태)
  - 커밋 해시, 작성자, 날짜, 커밋 메시지

---

## 4. 핵심 기능 명세

### 4-1. 폴더 비교 (파일 diff 감지)

두 폴더를 재귀적으로 탐색하여 차이가 있는 파일을 추출한다.

**비교 방식:** 파일 내용의 MD5 해시 비교

**비교 결과 분류:**

| 상태 | 조건 |
|------|------|
| MODIFIED | 양쪽에 존재하지만 해시가 다른 파일 |
| NEW | 출발지에만 존재하는 파일 |
| DELETED | 목적지에만 존재하는 파일 |

**기본 제외 대상 (비교에서 자동 제외):**

- `node_modules/`
- `.git/`
- `dist/`, `build/`
- `.DS_Store`

**설정 가능한 제외 대상:**

프로젝트 루트에 `.syncignore` 파일을 두면 추가로 제외할 수 있다 (`.gitignore` 문법과 동일).

```
# .syncignore 예시
.env
.env.local
```

### 4-2. Git 이력 조회

선택한 파일의 출발지 Git 커밋 이력을 조회한다.

- `simple-git` 라이브러리의 `log` 메서드 사용
- 파일 단위 이력 조회: `git log --follow -- <파일경로>`
- 표시 항목: 커밋 해시(단축), 작성자, 날짜, 커밋 메시지
- 최근 10개 커밋까지 표시

### 4-3. 선택적 파일 덮어쓰기

체크된 파일만 출발지 → 목적지로 복사한다.

**동작 흐름:**

1. 사용자가 파일 체크박스 선택
2. "덮어쓰기" 버튼 클릭
3. 인프라 파일이 포함된 경우 → 확인 다이얼로그 표시 (파일 목록 나열)
4. 확인 시 파일 복사 실행
5. 완료 메시지 표시

**안전장치:**

- 인프라/배포 파일 체크 시 경고 다이얼로그 필수 표시
- 덮어쓰기 전 목적지 파일의 백업은 별도로 하지 않음 (고객사 폴더도 Git 관리 중이므로 `git checkout`으로 복원 가능)

### 4-4. 인프라 파일 경고 시스템

아래 패턴에 해당하는 파일은 "인프라 파일"로 분류하여 시각적 경고를 표시한다.

**기본 경고 대상:**

```
Dockerfile
docker-compose.yml
docker-compose.*.yml
.github/workflows/*
deploy.yml
deploy.*.yml
k8s/
.env
.env.*
Jenkinsfile
nginx.conf
```

이 목록도 `.syncignore`와 별도로 `.syncwarn` 파일에서 프로젝트별로 커스터마이징 가능하게 한다.

---

## 5. Electron IPC 구조

프론트(Renderer)와 백엔드(Main Process) 간 통신 구조.

```
[Renderer - React]              [Main Process - Node.js]
      │                                │
      ├── select-folder ──────────────→ dialog.showOpenDialog()
      │                                │
      ├── scan-diff ──────────────────→ 폴더 재귀 탐색 + 해시 비교
      │← diff-result ─────────────────┤
      │                                │
      ├── get-git-log ────────────────→ simple-git log
      │← git-log-result ─────────────┤
      │                                │
      ├── sync-files ─────────────────→ fs.copyFileSync
      │← sync-complete ──────────────┤
```

**IPC 채널 목록:**

| 채널명 | 방향 | 설명 |
|--------|------|------|
| `select-folder` | Renderer → Main | 폴더 선택 다이얼로그 열기 |
| `scan-diff` | Renderer → Main | 두 폴더 비교 시작 |
| `diff-result` | Main → Renderer | 비교 결과 반환 |
| `get-git-log` | Renderer → Main | 특정 파일의 Git 이력 요청 |
| `git-log-result` | Main → Renderer | Git 이력 반환 |
| `sync-files` | Renderer → Main | 선택된 파일 덮어쓰기 실행 |
| `sync-complete` | Main → Renderer | 동기화 완료 결과 반환 |

---

## 6. 주요 데이터 타입

```typescript
// 파일 비교 결과
interface DiffFile {
  path: string;            // 상대 경로 (예: "src/components/Header.tsx")
  status: "modified" | "new" | "deleted";
  sourceSize: number;      // 바이트
  destSize: number | null; // NEW인 경우 null
  sourceModified: string;  // ISO datetime
  destModified: string | null;
  isDanger: boolean;       // 인프라 파일 여부
}

// Git 커밋 이력
interface GitLogEntry {
  hash: string;       // 단축 해시 (7자)
  author: string;
  date: string;       // ISO datetime
  message: string;
}

// 동기화 요청
interface SyncRequest {
  sourcePath: string;
  destPath: string;
  files: string[];    // 동기화할 파일의 상대 경로 배열
}

// 동기화 결과
interface SyncResult {
  success: boolean;
  syncedFiles: string[];
  failedFiles: { path: string; error: string }[];
}
```

---

## 7. 프로젝트 폴더 구조

```
si-sync/
├── electron/
│   ├── main.ts              # Electron 메인 프로세스
│   ├── preload.ts           # IPC 브릿지
│   └── services/
│       ├── diffService.ts   # 폴더 비교 로직
│       ├── gitService.ts    # Git 이력 조회 로직
│       └── syncService.ts   # 파일 복사 로직
├── src/
│   ├── App.tsx
│   ├── pages/
│   │   ├── FolderSelect.tsx # 화면 1
│   │   └── DiffView.tsx     # 화면 2
│   ├── components/
│   │   ├── FileList.tsx     # 파일 목록 (좌측 패널)
│   │   ├── FileDetail.tsx   # 파일 상세 (우측 패널)
│   │   ├── GitTimeline.tsx  # Git 이력 타임라인
│   │   └── StatusBadge.tsx  # 상태 배지
│   └── types/
│       └── index.ts         # 위 데이터 타입 정의
├── .syncignore.default      # 기본 제외 목록 템플릿
├── .syncwarn.default        # 기본 경고 목록 템플릿
├── package.json
├── tsconfig.json
└── electron-builder.yml
```

---

## 8. 구현 우선순위

Phase 1부터 순서대로 구현하되, Phase 1만으로도 충분히 사용 가능하도록 한다.

### Phase 1 — MVP (핵심 기능)

1. Electron + React + TypeScript 프로젝트 세팅
2. 화면 1: 폴더 선택 UI + `dialog.showOpenDialog`
3. 폴더 비교 서비스 (`diffService.ts`)
4. 화면 2: 파일 목록 + 체크박스 + 상태 표시
5. 파일 복사 서비스 (`syncService.ts`)
6. 인프라 파일 경고 시스템

### Phase 2 — Git 연동

7. Git 이력 조회 서비스 (`gitService.ts`)
8. 화면 2 우측 패널: Git 타임라인 UI

### Phase 3 — 편의 기능

9. `.syncignore` / `.syncwarn` 파일 지원
10. 최근 사용 폴더 경로 기억 (electron-store)
11. 동기화 완료 후 결과 리포트 표시

---

## 9. 디자인 방향

- GitHub Desktop / VS Code 스타일의 다크 테마
- 화려한 디자인 불필요, 기능 중심의 깔끔한 UI
- 모노스페이스 폰트 기반
- 색상 최소화: 배경은 어둡게, 상태 표시만 컬러로 구분
  - Modified → 노란색
  - New → 초록색
  - Deleted → 빨간색
  - 인프라 경고 → 주황/노란색