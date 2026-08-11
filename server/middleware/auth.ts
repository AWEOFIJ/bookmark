// 保護所有 /api/**（除 /api/auth/** 外）— 需要登入 session
export default defineEventHandler(async (event) => {
  const url = event.path || ''
  if (!url.startsWith('/api/')) return
  if (url.startsWith('/api/auth/')) return

  const session = await getBmSession(event)
  if (!session.data?.userId) {
    throw createError({ statusCode: 401, statusMessage: '未登入' })
  }
})
