import bcrypt from 'bcryptjs'

// 免密碼登入：輸入 Gmail → 自動建立/登入 → 直接進主頁
// ⚠️ 任何知道該 Gmail 的人都能登入該帳號 — 僅建議地端/私人使用
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body.email || '').trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: '請輸入正確的 Gmail' })
  }

  let user = await prisma.user.findUnique({ where: { email } })

  // 帳號不存在 → 自動建立（隨機密碼不可知，此模式不走密碼登入）
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        password: await bcrypt.hash(generateRandomPassword(20), 10),
      },
    })
  }

  // 直接建立 session
  const session = await getBmSession(event)
  await session.update({ userId: user.id, email: user.email })

  return { id: user.id, email: user.email }
})
