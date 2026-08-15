# bookMark 🔖

自架書籤收藏管理（仿 Raindrop.io）— 收藏、分類、標籤、搜尋，一頁搞定。

> 個人使用的書籤管理工具，強調**可用性**：貼上網址自動抓取標題/描述/圖示，收藏夾分類，標籤篩選，全站搜尋，深色模式。

## ✨ 功能

- 🔖 **書籤 CRUD** — 貼上 URL 自動抓取標題、描述、favicon（og 標籤）
- 📁 **巢狀收藏夾** — 樹狀分類 + 未分類檢視
- 🏷️ **標籤系統** — 多標籤、點擊篩選、計數
- 🔍 **全域搜尋** — 標題/描述/網址即時搜尋（輸入即有結果）
- ⭐ **重要 / 未讀** — 快速標記與篩選
- 📥 **Raindrop / 瀏覽器匯入** — 支援 Netscape HTML 格式，收藏夾與標籤一併匯入、重複自動跳過
- 🌓 **深色模式** — 自動偵測 + 手動切換
- 📱 **RWD** — 手機、平板、桌面都順手
- 📤 **Web Share Target（PWA）** — 手機瀏覽網頁 → 分享 → bookMark → 自動帶入網址直接儲存（可加到主畫面變 App）
- 🚀 **Google 帳號登入** — 真正的 Google OAuth 一鍵登入（自動建立/綁定帳號）
- 📧 **Email + 密碼登入** — 輸入 Gmail 收取隨機密碼即可登入（地端個人模式，可與 Google 登入並存）

## 🛠️ 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Vue 3 + Nuxt 4 + Tailwind CSS 4 |
| 後端 | Nitro server API（Nux Server Routes） |
| 資料庫 | PostgreSQL + Prisma 7（adapter-pg） |
| 認證 | h3 session（簽章 cookie）+ bcrypt + Google OAuth 2.0 |
| 部署 | Vercel（serverless）/ PM2 + Nginx（自架） |

## 🚀 快速開始（本機）

```bash
# 1. 複製專案
git clone https://github.com/AWEOFIJ/bookMark.git
cd bookMark

# 2. 安裝
npm install

# 3. 設定環境變數（複製 .env.example 並填寫）
cp .env.example .env
# DATABASE_URL 指向你的 PostgreSQL

# 4. 建立資料庫 + 遷移 + 種子
npx prisma migrate dev --name init
npx tsx prisma/seed.ts   # 建立 admin 帳號

# 5. 啟動
npm run dev   # http://localhost:3000
```

## 🔐 Google 帳號登入設定

登入頁的「使用 Google 帳號登入」按鈕，需要先在 **Google Cloud Console** 建立 OAuth 憑證：

1. 前往 [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)（需先建立或選擇專案）
2. 點 **Create Credentials → OAuth client ID**
3. Application type 選 **Web application**
4. 在 **Authorized redirect URIs** 加入：
   - 本機：`http://localhost:3000/api/auth/google/callback`
   - 正式（Vercel）：`https://hackmad.net/api/auth/google/callback`（換成你的網域）
5. 建立後複製 **Client ID** 與 **Client Secret**，填入環境變數：
   ```bash
   GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="xxxx"
   ```
6. 重新啟動 / 重新部署即可 — 登入頁會自動出現 Google 按鈕

> 若使用者先用 Email+密碼建立帳號，之後再用同一個 Gmail 走 Google 登入，系統會自動**綁定**（合併成同一帳號，書籤不遺失）。

## ☁️ 部署到 Vercel

1. 建立 **Neon** PostgreSQL（Vercel Marketplace 整合）
2. 設定環境變數：`DATABASE_URL`、`NUXT_SESSION_PASSWORD`（啟用 Google 登入再加 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`）
3. 套用資料庫遷移：`npx prisma migrate deploy`
4. `vercel --prod`

> 註：未設定 `GOOGLE_CLIENT_ID` 時，Google 按鈕不會顯示，僅保留 Email+密碼登入。

## ⚠️ 安全說明

- **Google 登入**：使用 Google OAuth 2.0 Authorization Code flow + state 參數防 CSRF，安全性高，適合公開部署
- **Email+密碼模式**：任何知道 Gmail 的人即可登入該帳號 — 僅建議私人/家庭使用
- 用 Email+密碼建立的帳號若被 Google 登入綁定後，密碼仍可用（雙通道登入）
- `NUXT_SESSION_PASSWORD` 務必改為隨機長字串

## 📄 License

MIT
