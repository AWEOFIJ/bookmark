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
- 🚀 **一鍵登入** — 輸入 Gmail 即自動建立帳號並登入（地端個人使用模式）

## 🛠️ 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Vue 3 + Nuxt 4 + Tailwind CSS 4 |
| 後端 | Nitro server API（Nux Server Routes） |
| 資料庫 | PostgreSQL + Prisma 7（adapter-pg） |
| 認證 | h3 session（簽章 cookie）+ bcrypt |
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

## ☁️ 部署到 Vercel

1. 建立 **Neon** PostgreSQL（Vercel Marketplace 整合）
2. 設定環境變數：`DATABASE_URL`、`NUXT_SESSION_PASSWORD`
3. `vercel --prod`

> 註：本專案預設為「輸入 Gmail 即登入」的地端個人模式；公開部署建議加上 OAuth/密碼驗證（見下方安全章節）。

## ⚠️ 安全說明

- **免密碼登入**：任何知道 Gmail 的人即可登入該帳號 — 僅建議私人/家庭使用
- 公開部署前請加入 Gmail OAuth 或密碼驗證
- `NUXT_SESSION_PASSWORD` 務必改為隨機長字串

## 📄 License

MIT
