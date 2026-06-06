import nodemailer from 'nodemailer'
import logger from './logger'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  requireTLS: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
  connectionTimeout: 5_000,
  socketTimeout: 10_000,
  greetingTimeout: 5_000,
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const from = process.env.SMTP_FROM ?? 'shop@example.com'
  try {
    const info = await transporter.sendMail({ from, to, subject, html })
    logger.info({ messageId: info.messageId, to }, 'E-Mail gesendet')
    return { success: true as const, messageId: info.messageId }
  } catch (error) {
    logger.error({ error, to }, 'E-Mail Versand fehlgeschlagen')
    return { success: false as const, error }
  }
}
