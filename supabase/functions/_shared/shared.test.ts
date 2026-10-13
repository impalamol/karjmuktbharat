// deno test --allow-env supabase/functions/_shared
import { assert, assertEquals, assertNotEquals, assertRejects } from 'jsr:@std/assert@1'

Deno.env.set('FIELD_ENCRYPTION_KEY', btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))))
const { encryptField, decryptField, safeEqual } = await import('./crypto.ts')
const { verhoeffValid, loanSubmission } = await import('./validation.ts')

Deno.test('AES-256-GCM round trip, random IV, AAD bound', async () => {
  const a = await encryptField('123456789012', 'loan:1')
  const b = await encryptField('123456789012', 'loan:1')
  assertNotEquals(a, b)
  assert(!a.includes('123456789012'))
  assertEquals(await decryptField(a, 'loan:1'), '123456789012')
  await assertRejects(() => decryptField(a, 'loan:2'))
})

Deno.test('tampered ciphertext is rejected', async () => {
  const a = await encryptField('9876543210', 'x')
  const [v, iv, ct] = a.split(':')
  const flipped = ct![0] === 'A' ? 'B' + ct!.slice(1) : 'A' + ct!.slice(1)
  await assertRejects(() => decryptField(`${v}:${iv}:${flipped}`, 'x'))
})

Deno.test('Verhoeff Aadhaar checksum', () => {
  assert(verhoeffValid('234123412346'))
  assert(!verhoeffValid('234123412345'))
})

Deno.test('loan submission validation strips markup and rejects unknown keys', () => {
  const ok = loanSubmission.parse({
    fullName: '  Asha   Patil ', aadhaar: '2341 2341 2346', loanType: 'education', bankName: 'SBI',
    ifsc: 'sbin0001234', loanAccount: '1234 5678 90', sanctionAmount: 1000000, outstanding: 900000,
    emi: 12668, interestRate: 9, isAuctionCase: false, consent: true,
  })
  assertEquals(ok.fullName, 'Asha Patil')
  assert(!loanSubmission.safeParse({ ...ok, aadhaar: '234123412346', fullName: '<script>alert(1)</script>' }).success)
  assertEquals(ok.ifsc, 'SBIN0001234')
  assertEquals(ok.loanAccount, '1234567890')
  assert(!loanSubmission.safeParse({ ...ok, aadhaar: '234123412346', role: 'admin' }).success)
})

Deno.test('safeEqual', () => {
  assert(safeEqual('abc', 'abc'))
  assert(!safeEqual('abc', 'abd'))
  assert(!safeEqual('abc', 'ab'))
})
