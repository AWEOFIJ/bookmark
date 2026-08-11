import * as cheerio from 'cheerio'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

export interface UrlMeta {
  title: string
  description: string
  favicon: string
  hostname: string
}

// 抓取網址的標題 / 描述 / favicon（用 og 標籤優先）
export async function fetchUrlMeta(rawUrl: string): Promise<UrlMeta> {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw createError({ statusCode: 400, statusMessage: '無效的網址' })
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw createError({ statusCode: 400, statusMessage: '只支援 http/https 網址' })
  }

  let html = ''
  try {
    const res = await fetch(url.toString(), {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch {
    // 抓不到頁面時至少回傳 hostname
    return {
      title: url.hostname,
      description: '',
      favicon: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`,
      hostname: url.hostname,
    }
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
