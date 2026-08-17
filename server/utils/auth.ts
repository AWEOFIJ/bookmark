import { useSession } from 'h3'
import type { H3Event } from 'h3'

// h3 內建 session — 簽章 cookie，無需外部 session store
export function getSessionConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  const isHttps = getRequestURL(event).protocol === 'https:'
  return {
    password: config.sessionPassword as string,
    cookieName: 'bm_session',
    maxAge: 60 * 60 * 24 * 30, // 30 天
    cookie: {
      // 正式環境（HTTPS）開 Secure；本機 HTTP 開發時自動關閉
      secure: isHttps,
      // 明確設定 SameSite=Lax 防 CSRF（不讓跨站請求帶 session）
      sameSite: 'lax',
      // session cookie 不給 JS 讀取
      httpOnly: true,
    },
  }
}

export async function getBmSession(event: H3Event) {
  return useSession(event, getSessionConfig(event))
}

export async function getUserId(event: H3Event): Promise<string | null> {
  const session = await getBmSession(event)
  return (session.data?.userId as string) || null
}

// 需要登入的 handler 直接呼叫
export async function requireUser(event: H3Event): Promise<string> {
  const userId = await getUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: '請先登入' })
  }
  return userId
}
