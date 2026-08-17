// 簡單 in-memory rate limiter（個人規模 app 適用）
// 注意：Vercel serverless 多實例時為「近似」值（各實例獨立計數）— 已足夠防暴力破解與信件轟炸
const buckets = new Map<string, { count: number; resetAt: number }>()

/**
 * 檢查並累計請求次數；超過限制直接拋 429
 * @param key    計數鍵（建議含 IP + email）
 * @param limit  窗口內允許次數
 * @param windowMs 窗口毫秒
 */
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now()

  // 防止 Map 無界增長：超過 1 萬筆時清掉過期桶
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k)
    }
  }

  const b = buckets.get(key)
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  b.count++
  if (b.count > limit) {
    throw createError({ statusCode: 429, statusMessage: '嘗試次數過多，請稍後再試' })
  }
}

/** 取得使用者 IP（Vercel 走 x-forwarded-for，可能多層逗號分隔） */
export function clientIp(event: { headers: Headers }): string {
  const fwd = event.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return event.headers.get('x-real-ip') || 'unknown'
}
