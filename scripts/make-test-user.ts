// 建立測試帳號（本機驗證用）
// 憑證從環境變數讀取，避免在 repo 中硬編碼（與 prisma/seed.ts 一致）
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../server/utils/prisma'

async function main() {
  const email = process.env.SEED_EMAIL || 'dev@bookmark.local'
  const password = process.env.SEED_PASSWORD || 'dev-only-change-me'
  const hash = await bcrypt.hash(password, 10)
  await prisma.user.upsert({ where: { email }, update: {}, create: { email, password: hash } })
  console.log('測試帳號就緒:', email)
}

main().finally(() => prisma.$disconnect())
