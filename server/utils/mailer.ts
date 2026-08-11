import { randomBytes } from 'node:crypto'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import nodemailer from 'nodemailer'

// 隨機密碼字元集（排除易混淆的 0/O/1/l/I）
const CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateRandomPassword(len = 10): string {
  const bytes = randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) {
    out += CHARS[bytes[i] % CHARS.length]
  }
  return out
}

export interface MailResult {
  delivered: boolean
  /** 僅測試模式（SMTP 未設定）會回傳密碼，供開發體驗 */
  testPassword?: string
}

/**
 * 寄送密碼信。
 * - 有設定 SMTP_* → 真實寄信
 * - 未設定 → 測試模式：密碼寫入 系統暫存目錄 並回傳，方便開發驗證
 */
export async function sendPasswordEmail(to: string, password: string): Promise<MailResult> {
  const smtpHost = process.env.SMTP_HOST
  if (!smtpHost) {
    // 測試模式
    const dir = join(tmpdir(), 'bookmark-mail')
    await mkdir(dir, { recursive: true })
    const file = join(dir, `${Date.now()}-${to.replace(/[^a-zA-Z0-9]/g, '_')}.txt`)
    await writeFile(
      file,
      `To: ${to}\nSubject: bookMark 登入密碼\n\n你的 bookMark 登入密碼是：${password}\n（測試模式信件）\n`,
      'utf-8',
    )
    console.log(`[mailer:test] 密碼信已寫入 ${file}`)
    return { delivered: false, testPassword: password }
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: '【bookMark】你的登入密碼',
    text: `你的 bookMark 登入密碼是：${password}\n\n請用這組密碼登入。\n`,
  })

  return { delivered: true }
}
