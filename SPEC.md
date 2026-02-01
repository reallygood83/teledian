# Obsidian Telegram Sidebar Plugin - Spec Document

## 1. Overview

| 항목 | 내용 |
|------|------|
| **플러그인 이름** | Telegram Sidebar |
| **ID** | `obsidian-telegram-sidebar` |
| **목적** | Obsidian 사이드바에서 Telegram Web 채팅을 바로 사용 |
| **배포** | GitHub → BRAT → 추후 Community Plugin 등록 |
| **라이선스** | MIT |

### 사용 시나리오
- Telegram 봇(예: OpenClaw/moltbot 등)을 Obsidian 안에서 바로 사용
- AI 봇과 대화하면서 동시에 노트 작성
- 특정 채팅/채널/그룹을 사이드바에 고정

---

## 2. 핵심 기능

### 2.1 Telegram Web 사이드바 임베드
- Obsidian 우측 사이드바에 Telegram Web을 `webview` 태그로 렌더링
- Electron의 `<webview>` 태그 사용 (iframe은 CSP 차단 가능성)
- 세션 유지: 최초 1회 로그인 후 지속

### 2.2 설정 (Settings Tab)

| 설정 항목 | 타입 | 기본값 | 설명 |
|-----------|------|--------|------|
| `telegramUsername` | string | `""` | 열고 싶은 봇/유저/채널 username (예: `moltbot`) |
| `webVersion` | dropdown | `"k"` | Telegram Web 버전 (`k` = 경량, `a` = React) |
| `panelSide` | dropdown | `"right"` | 사이드바 위치 (`left` / `right`) |
| `autoOpen` | toggle | `false` | Obsidian 시작 시 자동 열기 |

### 2.3 Commands (Command Palette)

| Command ID | 이름 | 동작 |
|------------|------|------|
| `open-telegram-sidebar` | Open Telegram Sidebar | 사이드바 패널 열기/토글 |
| `reload-telegram` | Reload Telegram | webview 새로고침 |
| `go-to-chat` | Go to Chat | 설정된 username 채팅방으로 이동 |

### 2.4 리본 아이콘
- 왼쪽 리본에 Telegram 아이콘(종이비행기) 추가
- 클릭 시 사이드바 토글

---

## 3. 기술 구조

### 3.1 파일 구조

```
obsidian-telegram-sidebar/
├── src/
│   ├── main.ts              # 플러그인 엔트리포인트
│   ├── TelegramView.ts      # ItemView 구현 (webview 렌더링)
│   ├── settings.ts          # PluginSettingTab 구현
│   └── constants.ts         # VIEW_TYPE, URL 템플릿 등
├── styles.css               # webview 스타일링
├── manifest.json            # Obsidian 플러그인 매니페스트
├── package.json
├── tsconfig.json
├── esbuild.config.mjs       # 빌드 설정
├── .gitignore
├── README.md
└── LICENSE
```

### 3.2 핵심 클래스

#### `TelegramSidebarPlugin` (main.ts)
```typescript
export default class TelegramSidebarPlugin extends Plugin {
  settings: TelegramSidebarSettings;

  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_TELEGRAM, (leaf) => new TelegramView(leaf, this));
    this.addRibbonIcon("send", "Open Telegram", () => this.activateView());
    this.addSettingTab(new TelegramSidebarSettingTab(this.app, this));
    this.addCommand({ id: "open-telegram-sidebar", name: "Open Telegram Sidebar", callback: () => this.activateView() });
    this.addCommand({ id: "reload-telegram", name: "Reload Telegram", callback: () => this.reloadView() });

    if (this.settings.autoOpen) this.activateView();
  }

  async activateView() {
    const side = this.settings.panelSide === "left" ? "left" : "right";
    // detach existing → getLeaf(side) → setViewState → reveal
  }
}
```

#### `TelegramView` (TelegramView.ts)
```typescript
export class TelegramView extends ItemView {
  private webviewEl: HTMLElement; // Electron webview

  getViewType(): string { return VIEW_TYPE_TELEGRAM; }
  getDisplayText(): string { return "Telegram"; }
  getIcon(): string { return "send"; }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    // webview 생성
    this.webviewEl = container.createEl("webview" as any, {
      attr: {
        src: this.buildUrl(),
        style: "width:100%; height:100%; border:none;",
        allowpopups: "",
        partition: "persist:telegram", // 세션 유지 핵심
      }
    });
  }

  buildUrl(): string {
    const base = this.plugin.settings.webVersion === "a"
      ? "https://web.telegram.org/a/"
      : "https://web.telegram.org/k/";
    const username = this.plugin.settings.telegramUsername;
    return username ? `${base}#@${username}` : base;
  }

  reload() { (this.webviewEl as any).reload(); }
}
```

#### `TelegramSidebarSettingTab` (settings.ts)
```typescript
export class TelegramSidebarSettingTab extends PluginSettingTab {
  display() {
    // Text: telegramUsername
    // Dropdown: webVersion (k / a)
    // Dropdown: panelSide (left / right)
    // Toggle: autoOpen
  }
}
```

### 3.3 Settings 인터페이스

```typescript
export interface TelegramSidebarSettings {
  telegramUsername: string;  // 봇/유저 username (@ 제외)
  webVersion: "k" | "a";
  panelSide: "left" | "right";
  autoOpen: boolean;
}

export const DEFAULT_SETTINGS: TelegramSidebarSettings = {
  telegramUsername: "",
  webVersion: "k",
  panelSide: "right",
  autoOpen: false,
};
```

### 3.4 상수

```typescript
export const VIEW_TYPE_TELEGRAM = "telegram-sidebar-view";
export const TELEGRAM_WEB_K = "https://web.telegram.org/k/";
export const TELEGRAM_WEB_A = "https://web.telegram.org/a/";
```

---

## 4. 핵심 기술 포인트

### 4.1 webview vs iframe
- **반드시 `<webview>` 사용** (Electron 전용)
- `<iframe>`은 Telegram Web의 CSP(`X-Frame-Options`)로 차단됨
- `<webview>`는 별도 프로세스로 동작하므로 CSP 우회

### 4.2 세션 유지
- `partition="persist:telegram"` 속성 필수
- 이 속성이 있어야 Obsidian 재시작 후에도 로그인 상태 유지
- 없으면 매번 재로그인 필요

### 4.3 모바일 미지원
- `<webview>`는 Electron 전용 → Obsidian 모바일에서는 동작하지 않음
- `manifest.json`에 `"isDesktopOnly": true` 설정

### 4.4 보안
- `allowpopups` 속성으로 Telegram 인증 팝업 허용
- 사용자 credential은 webview 내부에서만 관리 (플러그인이 접근 불가)
- 플러그인은 URL만 제어

---

## 5. 빌드 & 배포

### 5.1 빌드
```bash
npm install
npm run build    # esbuild → main.js 생성
```

### 5.2 GitHub 릴리즈 파일
배포 시 아래 3개 파일만 Release에 첨부:
- `main.js`
- `manifest.json`
- `styles.css`

### 5.3 BRAT 설치 방법 (사용자용)
1. Obsidian → Community Plugins → BRAT 설치
2. BRAT Settings → "Add Beta Plugin"
3. GitHub URL 입력: `https://github.com/{owner}/obsidian-telegram-sidebar`
4. 설치 완료 → Settings에서 Telegram Username 입력
5. 사이드바 아이콘 클릭 또는 Command Palette → "Open Telegram Sidebar"

### 5.4 manifest.json

```json
{
  "id": "obsidian-telegram-sidebar",
  "name": "Telegram Sidebar",
  "version": "1.0.0",
  "minAppVersion": "1.0.0",
  "description": "Embed Telegram Web in Obsidian sidebar. Chat with bots and contacts without leaving your vault.",
  "author": "Your Name",
  "authorUrl": "https://github.com/{owner}",
  "isDesktopOnly": true
}
```

### 5.5 versions.json
```json
{
  "1.0.0": "1.0.0"
}
```

---

## 6. 개발 순서 (구현 체크리스트)

- [ ] 1단계: 프로젝트 초기화 (`package.json`, `tsconfig.json`, `esbuild.config.mjs`)
- [ ] 2단계: `constants.ts` — VIEW_TYPE, URL 상수 정의
- [ ] 3단계: `settings.ts` — Settings 인터페이스 + SettingTab UI
- [ ] 4단계: `TelegramView.ts` — webview 기반 ItemView 구현
- [ ] 5단계: `main.ts` — Plugin 클래스, 커맨드, 리본 아이콘
- [ ] 6단계: `styles.css` — webview 풀사이즈 스타일링
- [ ] 7단계: 로컬 테스트 (vault에서 직접 로드)
- [ ] 8단계: `manifest.json`, `versions.json` 최종 확인
- [ ] 9단계: GitHub 리포 생성 + Release 태그
- [ ] 10단계: BRAT으로 설치 테스트
- [ ] 11단계: README.md 작성 (스크린샷 포함)

---

## 7. 향후 확장 가능성 (v2+)

| 기능 | 설명 |
|------|------|
| 멀티 채팅 탭 | 여러 봇/채팅을 탭으로 관리 |
| 단축키 지원 | 사이드바 토글 핫키 |
| 다크모드 동기화 | Obsidian 테마에 맞춰 Telegram Web 테마 자동 전환 |
| 메시지 → 노트 | webview에서 메시지 선택 → Obsidian 노트로 저장 |
| 커스텀 CSS 주입 | Telegram Web UI를 Obsidian 스타일에 맞게 커스터마이징 |
