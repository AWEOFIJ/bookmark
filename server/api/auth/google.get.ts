// 導向 Google 授權頁（OAuth 2.0 Authorization Code flow）
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.googleClientId) {
    throw createError({ statusCode: 500, statusMessage: 'Google 登入未設定（缺少 GOOGLE_CLIENT_ID）' })
  }

  const origin = getRequestURL(event).origin
  const query = getQuery(event)
  const returnTo = typeof query.returnTo === 'string' && query.returnTo.startsWith('/') ? query.returnTo : '/'

  const params = new URLSearchParams({
    client_id: config.googleClientId as string,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    // 每次都會重新選擇帳號，避免多帳號使用者選錯
    prompt: 'select_account',
    // 避免 CSRF：隨機 state 存在 session 中，callback 時比對
    state: crypto.randomUUID(),
  })

  // 存 state + returnTo 到 session 供 callback 使用
  const session = await getBmSession(event)
  await session.update({ oauthState: params.get('state'), returnTo })

  return sendRedirect(event, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})
