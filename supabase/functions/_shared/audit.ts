import { admin } from './auth.ts'
import { clientIp } from './http.ts'

/** Append-only audit trail. Never put secrets or full account / Aadhaar numbers in metadata. */
export async function audit(req: Request, userId: string | null, action: string, metadata: Record<string, unknown> = {}) {
  const { error } = await admin.from('audit_logs').insert({
    user_id: userId,
    action,
    ip: clientIp(req),
    metadata: { ...metadata, ua: req.headers.get('user-agent')?.slice(0, 200) ?? null },
  })
  if (error) {
    // Failing to audit a sensitive action must fail the action.
    console.error('audit insert failed', error)
    throw new Error('audit_failed')
  }
}
