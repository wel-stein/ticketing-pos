/**
 * Set or reset a staff PIN.
 *
 *   node server/scripts/set-pin.js STF-004
 *
 * The PIN is prompted for interactively and never echoed, so it does not end
 * up in shell history, the process list, or any log. Only the bcrypt hash is
 * written to the database.
 */
import readline from 'node:readline'
import { Writable } from 'node:stream'
import { query, queryOne, getPool } from '../db.js'
import { hashPin, isValidPinFormat } from '../auth.js'

const staffCode = process.argv[2]

if (!staffCode) {
  console.error('Usage: node server/scripts/set-pin.js <STAFF_CODE>')
  console.error('Example: node server/scripts/set-pin.js STF-004')
  process.exit(1)
}

/** Prompt without echoing keystrokes. */
function promptHidden(question) {
  const muted = new Writable({
    write(chunk, encoding, callback) {
      if (!muted.muted) process.stdout.write(chunk, encoding)
      callback()
    },
  })
  const rl = readline.createInterface({ input: process.stdin, output: muted, terminal: true })
  return new Promise(resolve => {
    process.stdout.write(question)
    muted.muted = true
    rl.question('', answer => {
      muted.muted = false
      process.stdout.write('\n')
      rl.close()
      resolve(answer)
    })
  })
}

async function main() {
  const staff = await queryOne(
    'SELECT id, staff_code, name, status FROM dbo.staff WHERE staff_code = @staffCode',
    { staffCode }
  )
  if (!staff) {
    console.error(`No staff found with code ${staffCode}.`)
    process.exit(1)
  }

  console.log(`Setting PIN for ${staff.name} (${staff.staff_code}, ${staff.status}).`)

  const pin = await promptHidden('New PIN (4-12 digits): ')
  if (!isValidPinFormat(pin)) {
    console.error('PIN must be 4 to 12 digits.')
    process.exit(1)
  }
  const confirm = await promptHidden('Confirm PIN: ')
  if (pin !== confirm) {
    console.error('PINs did not match.')
    process.exit(1)
  }

  const pinHash = await hashPin(pin)
  await query(
    `UPDATE dbo.staff
        SET pin_hash = @pinHash, failed_attempts = 0, locked_until = NULL, updated_at = getdate()
      WHERE id = @id`,
    { pinHash, id: staff.id }
  )
  // Any existing sessions predate this PIN change, so end them.
  await query(
    `UPDATE dbo.sessions SET revoked_at = getdate()
      WHERE staff_id = @id AND revoked_at IS NULL`,
    { id: staff.id }
  )

  console.log(`PIN updated for ${staff.staff_code}. Existing sessions were signed out.`)
}

main()
  .then(async () => { (await getPool()).close(); process.exit(0) })
  .catch(async err => {
    console.error('Failed:', err.message)
    try { (await getPool()).close() } catch {}
    process.exit(1)
  })
