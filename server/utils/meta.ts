import * as cheerio from 'cheerio'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const MAX_REDIRECTS = 4
const MAX_RESPONSE_SIZE = 2 * 1024 * 1024 // HTML 讀取上限 2MB

// ── oEmbed 輕量抓取 ─────────────────────────────────────────
// YouTube/Vimeo 頁面 HTML 極大（YouTube ~1.3MB），走 oEmbed JSON API
// 又快又穩（也避免被 4 秒 timeout 中斷）
async function fetchOEmbed(url: URL): Promise<UrlMeta | null> {
  const host = url.hostname.toLowerCase()
  const isYouTube =
    host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com' || host === 'youtu.be' || host.endsWith('.youtube.com')
  const isVimeo = host === 'vimeo.com' || host === 'www.vimeo.com'
  if (!isYouTube && !isVimeo) return null

  const apiUrl = isYouTube
    ? `https://www.youtube.com/oembed?url=${encodeURIComponent(url.toString())}&format=json`
    : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url.toString())}`

  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: 'application/json', 'User-Agent': UA },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { title?: string; thumbnail_url?: string }
    const title = String(data.title || '').trim()
    if (!title) return null
    const favicon = data.thumbnail_url || `https://www.google.com/s2/favicons?domain=${host}&sz=64`
    return { title, description: '', favicon, hostname: host }
  } catch {
    return null
  }
}

export interface UrlMeta {
  title: string
  description: string
  favicon: string
  hostname: string
}

// ── SSRF 防護 ─────────────────────────────────────────────
// 封鎖私有 / 保留 IP 段，防止伺服器被指使存取內網或雲端 metadata（169.254.169.254）

function isPrivateV4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true
  const [a, b] = parts
  return (
    a === 0 || // 0.0.0.0/8
    a === 10 || // 10.0.0.0/8
    a === 127 || // 127.0.0.0/8（本機）
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10（CGNAT）
    (a === 169 && b === 254) || // 169.254.0.0/16（link-local / 雲端 metadata）
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) || // 192.168.0.0/16
    (a === 192 && b === 0) || // 192.0.0.0/24
    (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15
    a >= 224 // 224.0.0.0/4（multicast）+ 240.0.0.0/4（保留）
  )
}

function isBlockedIp(ip: string): boolean {
  // 純 IPv4 → 直接查私有段
  if (isIP(ip) === 4) return isPrivateV4(ip)
  if (ip.startsWith('::ffff:')) return isPrivateV4(ip.slice(7)) // IPv4-mapped
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // fc00::/7 ULA
  if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true // fe80::/10 link-local
  return false
}

// 驗證 URL 解析後全部為公開 IP（每次 redirect 都重新檢查 → 防 DNS rebinding）
async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw createError({ statusCode: 400, statusMessage: '只支援 http/https 網址' })
  }
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw createError({ statusCode: 400, statusMessage: '不允許存取內網網址' })
  }
  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) throw createError({ statusCode: 400, statusMessage: '不允許存取內網網址' })
    return
  }
  let addrs: string[] = []
  try {
    addrs = (await lookup(hostname, { all: true, verbatim: true })).map((x) => x.address)
  } catch {
    throw createError({ statusCode: 400, statusMessage: '無法解析網址' })
  }
  if (addrs.length === 0 || addrs.some(isBlockedIp)) {
    throw createError({ statusCode: 400, statusMessage: '不允許存取內網網址' })
  }
}

// 抓取網址的標題 / 描述 / favicon（用 og 標籤優先）
export async function fetchUrlMeta(rawUrl: string): Promise<UrlMeta> {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw createError({ statusCode: 400, statusMessage: '無效的網址' })
  }

  // 手動控制 redirect（上限 4 次，每次重新驗證目標）
  let current = url
  let redirects = 0
  let res: Response | null = null
  try {
    for (;;) {
      await assertPublicUrl(current)
      res = await fetch(current.toString(), {
        redirect: 'manual',
        // 4 秒上限：儲存書籤時不能讓使用者等太久（慢站直接跳過 meta 補抓）
        signal: AbortSignal.timeout(4000),
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        },
      })
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location')
        if (!loc) break
        if (++redirects > MAX_REDIRECTS) throw createError({ statusCode: 400, statusMessage: '重新導向過多' })
        current = new URL(loc, current)
        continue
      }
      break
    }
  } catch (e: any) {
    if (e?.statusCode) throw e
    res = null
  }

  if (!res || !res.ok) {
    // 抓不到頁面時至少回傳 hostname
    return {
      title: url.hostname,
      description: '',
      favicon: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`,
      hostname: url.hostname,
    }
  }

  // oEmbed 優先（YouTube/Vimeo）：輕量 JSON，避免下載巨型 HTML
  const oembedMeta = await fetchOEmbed(current)
  if (oembedMeta) return oembedMeta

  // 串流讀取 body，最多 MAX_RESPONSE_SIZE bytes — 大頁面不用等完整下載
  let html = ''
  const reader = res.body?.getReader()
  if (reader) {
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        html += Buffer.from(value).toString('utf-8')
        if (html.length >= MAX_RESPONSE_SIZE) break
      }
    } finally {
      reader.cancel().catch(() => {})
    }
  } else {
    html = (await res.text()).slice(0, MAX_RESPONSE_SIZE)
  }

  const $ = cheerio.load(html)

  const ogTitle = $('meta[property="og:title"]').attr('content')
  const title = ogTitle?.trim() || $('title').first().text().trim() || url.hostname

  const ogDesc = $('meta[property="og:description"]').attr('content')
  const metaDesc = $('meta[name="description"]').attr('content')
  const description = (ogDesc || metaDesc || '').trim().slice(0, 500)

  let favicon =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel="apple-touch-icon"]').attr('href') ||
    ''

  if (favicon) {
    try {
      favicon = new URL(favicon, url.origin).toString()
    } catch {
      favicon = ''
    }
  }
  if (!favicon) {
    favicon = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`
  }

  return { title, description, favicon, hostname: url.hostname }
}
