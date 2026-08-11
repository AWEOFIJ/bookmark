import * as cheerio from 'cheerio'

export interface ParsedBookmark {
  title: string
  url: string
  description: string
  tags: string[]
  collectionPath: string // '/' 表示無收藏夾
}

export interface ParsedCollection {
  name: string
  parentPath: string // '/' 表示根層級
}

// 解析 Netscape bookmark HTML 格式（Raindrop.io 匯出 / 瀏覽器匯出通用）
export function parseNetscapeHtml(html: string): {
  bookmarks: ParsedBookmark[]
  collections: ParsedCollection[]
} {
  const $ = cheerio.load(html)
  const bookmarks: ParsedBookmark[] = []
  const collections: ParsedCollection[] = []

  function walkDL($dl: cheerio.Cheerio<any>, parentPath: string[]) {
    $dl.children('dt').each((_, dtEl) => {
      const $dt = $(dtEl)
      const h3 = $dt.children('h3').first()
      if (h3.length) {
        // 資料夾
        const name = h3.text().trim() || '未命名收藏夾'
        const path = [...parentPath, name]
        collections.push({ name, parentPath: parentPath.join('/') || '/' })
        const nested = $dt.children('dl').first()
        if (nested.length) walkDL(nested, path)
      } else {
        const a = $dt.children('a').first()
        if (a.length) {
          const url = a.attr('href')?.trim() || ''
          const title = a.text().trim() || url
          const tags = (a.attr('tags') || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
          const dd = $dt.children('dd').first()
          const description = dd.length ? dd.text().trim().slice(0, 500) : ''
          bookmarks.push({
            title,
            url,
            description,
            tags,
            collectionPath: parentPath.join('/') || '/',
          })
        }
      }
    })
  }

  const rootDl = $('dl').first()
  if (rootDl.length) walkDL(rootDl, [])

  return { bookmarks, collections }
}
