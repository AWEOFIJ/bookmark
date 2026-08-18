// 建立測試帳號（本機驗證用）
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../server/utils/prisma'

async function main() {
  const email = 'kgtest2@test.local'
  const hash = await bcrypt.hash('Test1234', 10)
  await prisma.user.upsert({ where: { email }, update: {}, create: { email, password: hash } })
  console.log('測試帳號就緒:', email)
}

main().finally(() => prisma.$disconnect())
