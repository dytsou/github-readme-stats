# GitHub Readme Stats

在 README 中動態產生 GitHub 統計卡片。

![Powered by Cloudflare Workers](https://img.shields.io/badge/Powered%20by-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)

[English](README.md) · [繁體中文](README-zh.md)

## 目錄

- [快速開始](#快速開始)
- [GitHub 統計卡片](#github-統計卡片)
- [常用語言卡片](#常用語言卡片)
- [儲存庫卡片](#儲存庫卡片)
- [Gist 卡片](#gist-卡片)
- [WakaTime 卡片](#wakatime-卡片)
- [部署](#部署)
- [設定](#設定)
- [API 文件](#api-文件)
- [支援](#支援)
- [貢獻](#貢獻)
- [重要說明](#重要說明)

## 快速開始

1. **部署你的執行個體** — 依 [部署](#部署) 完成 Cloudflare Workers 部署，並在瀏覽器驗證：

  `https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME`
2. **貼到 README**（將預留位置換成你的 Workers 網域與 GitHub 使用者名稱）：

```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME)
```

## GitHub 統計卡片

顯示 Stars、Commits、Pull Requests 等 GitHub 統計資料。

![範例 GitHub 統計卡片](docs/assets/readme/stats-sample.svg)

### 基本用法

```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME)
```

### 範例

**使用主題：**

```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&theme=radical)
```

**自訂顏色：**

```markdown
![GitHub Stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&bg_color=151515&title_color=fff&text_color=9f9f9f)
```

### 響應式主題

搭配 GitHub 深淺色模式標籤自動切換：

```markdown
[![GitHub Stats Dark](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&theme=dark#gh-dark-mode-only)](https://github.com/YOUR_USERNAME)
[![GitHub Stats Light](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME&theme=default#gh-light-mode-only)](https://github.com/YOUR_USERNAME)
```

完整主題列表見 [themes/README.md](themes/README.md)。全部參數：[API.md — Stats Card](API.md#1-stats-card)。

## 常用語言卡片

顯示最常使用的程式語言。

![範例常用語言卡片](docs/assets/readme/top-langs-sample.svg)

### 基本用法

```markdown
![Top Languages](https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME)
```

### 範例

**精簡版面：**

```markdown
![Top Languages](https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME&layout=compact)
```

**環狀圖：**

```markdown
![Top Languages](https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME&layout=donut)
```

全部參數：[API.md — Top Languages Card](API.md#2-top-languages-card)。

## 儲存庫卡片

突破 GitHub 個人頁 6 個釘選儲存庫的限制，額外顯示儲存庫。

![範例儲存庫卡片](docs/assets/readme/pin-sample.svg)

### 基本用法

```markdown
![Repository Card](https://YOUR-INSTANCE.WORKERS.DEV/api/pin?username=YOUR_USERNAME&repo=REPO_NAME)
```

### 範例

```markdown
![Repository Card](https://YOUR-INSTANCE.WORKERS.DEV/api/pin?username=YOUR_USERNAME&repo=github-readme-stats&show_owner=true)
```

全部參數：[API.md — Repository Card](API.md#3-repository-card)。

## Gist 卡片

在 README 中顯示 GitHub Gist。

![範例 Gist 卡片](docs/assets/readme/gist-sample.svg)

### 基本用法

```markdown
![Gist Card](https://YOUR-INSTANCE.WORKERS.DEV/api/gist?id=GIST_ID)
```

### 範例

```markdown
![Gist Card](https://YOUR-INSTANCE.WORKERS.DEV/api/gist?id=bbfce31e0217a3689c8d961a356cb10d&show_owner=true)
```

全部參數：[API.md — Gist Card](API.md#4-gist-card)。

## WakaTime 卡片

顯示 WakaTime 程式撰寫統計。

![範例 WakaTime 卡片](docs/assets/readme/wakatime-sample.svg)

> [!WARNING]
> WakaTime 個人檔案須設為公開。請在 WakaTime 設定中開啟「Display code time publicly」以及「Display languages, editors, os, categories publicly」。

### 基本用法

```markdown
![WakaTime Stats](https://YOUR-INSTANCE.WORKERS.DEV/api/wakatime?username=YOUR_WAKATIME_USERNAME)
```

### 範例

```markdown
![WakaTime Stats](https://YOUR-INSTANCE.WORKERS.DEV/api/wakatime?username=YOUR_WAKATIME_USERNAME&layout=compact)
```

全部參數：[API.md — WakaTime Card](API.md#5-waka-time-card)。

## 部署

### 必要條件

1. **Node.js 22+**（與本儲存庫 `engines` 欄位一致）
2. **GitHub Personal Access Token (PAT)** — **必填。** 以 Worker secret 設定 `GITHUB_PAT`。請至 [GitHub 權杖設定](https://github.com/settings/tokens) 依用途授權：公開統計需 `read:user`；私人儲存庫統計需 `repo` + `read:user`（見 [重要說明](#重要說明)）。

### 部署至 Cloudflare Workers

1. **Fork 本儲存庫**
2. **安裝相依套件：** `pnpm install`（若尚未安裝 pnpm：`npm install -g pnpm`）
3. **設定：** `node scripts/generate-wrangler-config.js`，正式環境請執行 `pnpm wrangler secret put GITHUB_PAT`
4. **部署：** `pnpm run deploy` — **Workers Builds** 的 deploy 指令請用 `pnpm run deploy`（勿直接使用 `wrangler`）。設定 `GITHUB_PAT`；可選的 GitHub Actions secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
5. **在 README 嵌入 URL 中使用** `https://YOUR-INSTANCE.WORKERS.DEV`

### 環境變數


| 變數              | 說明                                       |
| --------------- | ---------------------------------------- |
| `GITHUB_PAT`    | GitHub PAT（必填）；可新增 `GITHUB_PAT_2` 等以提高配額 |
| `WHITELIST`     | 允許的使用者名稱，以逗號分隔                           |
| `CACHE_SECONDS` | 預設快取秒數（`0` 表示關閉）                         |


完整列表：[API.md — Environment Variables](API.md#environment-variables)。

> [!WARNING]
> 修改環境變數後須重新部署。

> [!IMPORTANT]
> 對外開放的執行個體請設定 `WHITELIST`。未設定時，任意使用者名稱都可能消耗你的 GitHub 配額。若公開 `/api/gist`，請設定 `GIST_WHITELIST` 限制 Gist ID。

使用 [Sync Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork) 同步上游；同步後請重新部署並檢查 secrets。

## 設定

### 並排顯示多張卡片

```markdown
[![YOUR_USERNAME's GitHub stats](https://YOUR-INSTANCE.WORKERS.DEV/api?username=YOUR_USERNAME)](https://github.com/YOUR_USERNAME)
[![YOUR_USERNAME's top languages](https://YOUR-INSTANCE.WORKERS.DEV/api/top-langs?username=YOUR_USERNAME&layout=compact)](https://github.com/YOUR_USERNAME)
```

### 語系

在卡片 URL 上設定 `locale=`（例如 `&locale=es`）。支援的語系代碼：[API.md — Supported Locales](API.md#supported-locales)。

### 快取

各卡片類型有預設快取時間，`cache_seconds` 有 per-card 上下限；可用 `CACHE_SECONDS` 全域覆寫。詳情：[API.md — Cache Durations](API.md#cache-durations)。

## API 文件

完整端點、參數與錯誤說明：[API.md](API.md)、[線上文件](https://github-readme-stats-api-docs.pages.dev/) 或 [openapi.yaml](openapi.yaml)。

## 支援

若遇到問題：

- 確認 Workers URL 可在瀏覽器開啟（見 [快速開始](#快速開始)）
- 檢查 PAT 權限與私人儲存庫說明（見 [重要說明](#重要說明) 與 [部署](#部署)）
- WakaTime 卡片請確認 [WakaTime 卡片](#wakatime-卡片) 中的可見性設定
- 至 [Issues](https://github.com/dytsou/github-readme-stats/issues) 回報問題並附上失敗的 URL（請勿外洩 secrets）

### 常見錯誤

多數失敗會回傳 **錯誤 SVG**（非 JSON）：


| 現象                      | 可能原因                                                     |
| ----------------------- | -------------------------------------------------------- |
| 缺少 username / 參數錯誤      | URL 中未帶 `username`（或 `repo`、`id`）                        |
| User not found          | GitHub 使用者名稱拼錯，或誤用組織名稱作為 `username`                      |
| 速率限制 / 服務不可用            | GitHub API 配額用盡 — 新增 `GITHUB_PAT_2`、收緊 `WHITELIST` 或稍候再試 |
| No tokens / PAT 相關提示    | Worker 未設定 `GITHUB_PAT` secret                           |
| WakaTime user not found | WakaTime 個人檔案或可見性設定（見 [WakaTime 卡片](#wakatime-卡片)）       |


完整錯誤格式：[API.md — Error Handling](API.md#error-handling)。

## 貢獻

歡迎貢獻 — 為儲存庫按 Star、[提交 Issue](https://github.com/dytsou/github-readme-stats/issues) 或送出 PR。

## 重要說明

> [!IMPORTANT]
> **本 Fork 僅支援自行託管** — 請自行部署 Cloudflare Workers 執行個體；本儲存庫不提供公開示範 URL。GitHub API 每個 PAT 每小時 5000 次請求。快取可減少相同卡片 URL 的重複請求，但**無法**在大量使用者名稱、快取過期或 `CACHE_SECONDS` 為 `0` 時保證不超限。請用 `WHITELIST` 限制可服務的使用者名稱；需要更高配額可新增 `GITHUB_PAT_2` 等。

> [!WARNING]
> 預設僅統計**公開儲存庫**。若要包含私人儲存庫資料，須以與 `username` **同一使用者**的 PAT 部署自有執行個體。私人儲存庫彙總仍透過**公開卡片 URL** 提供 — 請視為有意公開，以 `WHITELIST` 限制執行個體，勿在需保密的場合嵌入該 URL。組織或 SSO 限制的私人儲存庫即使有 PAT 也可能無法顯示。

