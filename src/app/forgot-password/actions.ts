'use server'

import { requestPasswordResetForEmail } from '@/lib/passwordResetRequest'

export type ForgotPasswordState = {
  ok?: boolean
  error?: string
  message?: string
}

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get('email') ?? '')
  const result = await requestPasswordResetForEmail(email)
  if (!result.ok) {
    return { ok: false, error: result.error, message: undefined }
  }
  return { ok: true, message: result.message, error: undefined }
}
