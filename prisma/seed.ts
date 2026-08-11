import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = process.env.SEED_EMAIL || 'admin@bookmark.local'
  const password = process.env.SEED_PASSWORD || '12345678'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing) {
    const hash = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: { email, password: hash },
    })
    console.log(`✅ 已建立使用者: ${email}`)
  } else {
    console.log(`ℹ️  使用者已存在: ${email}`)
  }

  // 預設收藏夾
  const inbox = await prisma.collection.findFirst({ where: { name: '收件匣' } })
  if (!inbox) {
    await prisma.collection.create({ data: { name: '收件匣', icon: '📥' } })
    await prisma.collection.create({ data: { name: '閱讀清單', icon: '📖' } })
    await prisma.collection.create({ data: { name: '開發', icon: '💻' } })
    console.log('✅ 已建立預設收藏夾')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
