// 檢查重複 URL 書籤（本地 + 正式環境用）
// 用法: DATABASE_URL=xxx npx tsx scripts/check-dups.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  const dupRows: { url: string; cnt: bigint }[] =
    await prisma.$queryRaw`SELECT url, COUNT(*)::int8 as cnt FROM "Bookmark" GROUP BY url HAVING COUNT(*) > 1 ORDER BY cnt DESC`

  console.log(`總書籤數: ${await prisma.bookmark.count()}`)
  if (dupRows.length === 0) {
    console.log('✅ 無重複 URL')
  } else {
    console.log(`⚠️ 發現 ${dupRows.length} 組重複，共 ${dupRows.reduce((a, r) => a + Number(r.cnt), 0)} 筆`)
    for (const r of dupRows.slice(0, 20)) {
      console.log(`  ${r.url} → ${r.cnt} 筆`)
    }
    if (dupRows.length > 20) console.log(`  ... 還有 ${dupRows.length - 20} 組`)
  }
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
