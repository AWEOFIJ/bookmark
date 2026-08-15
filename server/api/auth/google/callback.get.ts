// Google OAuth callback — 換 token、找/建使用者、設 session、redirect 回前端
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code : ''
  const state = typeof query.state === 'string' ? query.state : ''
  const error = typeof query.error === 'string' ? query.error : ''

  const origin = getRequestURL(event).origin

  // Google 拒絕授權 → 回登入頁
  if (error) {
    return sendRedirect(event, `${origin}/login?error=${encodeURIComponent(error)}`)
  }
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: '缺少授權碼' })
  }

  // CSRF 防護：驗證 state
  const session = await getBmSession(event)
  if (!state || state !== session.data?.oauthState) {
    throw createError({ statusCode: 400, statusMessage: '授權狀態不符，請重試' })
  }
  await session.update({ oauthState: null })

  const returnTo = typeof session.data?.returnTo === 'string' && session.data.returnTo.startsWith('/') ? session.data.returnTo : '/'
  const homeUrl = `${origin}${returnTo}`

  if (!config.googleClientId || !config.googleClientSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Google 登入未設定（缺少 GOOGLE_CLIENT_ID / SECRET）' })
  }

  // 用 authorization code 換 access token
  const tokenRes = await $fetch<{
    access_token: string
    id_token?: string
    error?: string
    error_description?: string
  }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId as string,
      client_secret: config.googleClientSecret as string,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!tokenRes.access_token) {
    throw createError({ statusCode: 500, statusMessage: 'Google 授權失敗：' + (tokenRes.error_description || tokenRes.error || '無法取得 token') })
  }

  // 取使用者基本資料
  const profile = await $fetch<{
    id?: string
    email?: string
    name?: string
    picture?: string
  }>('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenRes.access_token}` },
  })
  const googleId = profile.id
  const email = (profile.email || '').trim().toLowerCase()

  if (!googleId || !email) {
    throw createError({ statusCode: 500, statusMessage: '無法取得 Google 帳號資訊' })
  }

  // 找/建使用者：
  // 1) 有 googleId 的帳號 → 直接登入
  // 2) 同 email 但沒 googleId（之前用密碼建立）→ 綁定 googleId
  // 3) 全新 → 建立（無密碼，只能 Google 登入）
  let user = await prisma.user.findUnique({ where: { googleId } })
  if (!user) {
    user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, name: profile.name ?? user.name, avatar: profile.picture ?? user.avatar },
      })
    } else {
      user = await prisma.user.create({
        data: { googleId, email, name: profile.name, avatar: profile.picture },
      })
    }
  }

  await session.update({ userId: user.id, email: user.email })
  return sendRedirect(event, homeUrl)
})
