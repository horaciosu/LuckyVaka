import { Resend } from 'resend'

export const FROM_EMAIL = 'Lucky Vacations <noreply@luckyvaka.com>'

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
