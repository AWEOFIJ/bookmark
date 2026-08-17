import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body.email || '').trim().toLowerCase()

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: '請輸入 Email' })
  }
  // 只接受基本 email 格式
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Email 格式不正確' })
  }

  // 防信件轟炸：每 IP 每 10 分鐘最多 5 次；每 email 每小時最多 3 次
  rateLimit(`pwdreq:${clientIp(event)}`, 5, 10 * 60 * 1000)
  rateLimit(`pwdreq-mail:${email}`, 3, 60 * 60 * 1000)

  let user = await prisma.user.findUnique({ where: { email } })

  // 帳號不存在 → 自動建立（輸入 Gmail 即可使用）
  let isNewUser = false
  if (!user) {
    const password = generateRandomPassword()
    const hash = await bcrypt.hash(password, 10)
    user = await prisma.user.create({
      data: { email, password: hash },
    })
    isNewUser = true
  }

  // 產生新隨機密碼 → 覆寫（舊密碼立即失效）
  const password = generateRandomPassword()
  const hash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash },
  })

  const result = await sendPasswordEmail(email, password)

  return {
    ok: true,
    message: isNewUser ? '帳號已建立，密碼已寄出，請檢查信箱' : '密碼已寄出，請檢查信箱',
    // 測試模式（SMTP 未設定）回傳密碼方便開發驗證；正式環境不會有這欄
    ...(result.testPassword ? { testPassword: result.testPassword } : {}),
  }
})
