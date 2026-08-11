import { useSession } from 'h3'
import type { H3Event } from 'h3'

// h3 內建 session — 簽章 cookie，無需外部 session store
export function getSessionConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  return {
    password: config.sessionPassword as string,
    cookieName: 'bm_session',
    maxAge: 60 * 60 * 24 * 30, // 30 天
    // 地端走 HTTP：Secure cookie 不會被瀏覽器儲存（https 部署時改 true）
    cookie: {
      secure: false,
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
