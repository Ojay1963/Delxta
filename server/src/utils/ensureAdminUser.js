const User = require('../models/User')

const ensureAdminUser = async () => {
  const adminName = process.env.ADMIN_NAME || 'Delxta Admin'
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const normalizedAdminEmail = (adminEmail || '').toLowerCase()

  if (!adminEmail || !adminPassword) {
    console.log('Admin bootstrap skipped (ADMIN_EMAIL or ADMIN_PASSWORD missing).')
    return
  }

  const existing = await User.findOne({ email: normalizedAdminEmail })

  if (!existing) {
    await User.create({
      name: adminName,
      email: normalizedAdminEmail,
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true,
    })
    console.log(`Admin user created: ${adminEmail}`)
    return
  }

  let changed = false
  if (existing.role !== 'admin') {
    existing.role = 'admin'
    changed = true
  }
  if (!existing.isEmailVerified) {
    existing.isEmailVerified = true
    changed = true
  }
  if (changed) {
    await existing.save()
    console.log(`Existing user promoted to admin: ${adminEmail}`)
  } else {
    console.log(`Admin user already configured: ${adminEmail}`)
  }

  const demoted = await User.updateMany(
    { role: 'admin', email: { $ne: normalizedAdminEmail } },
    { $set: { role: 'user' } }
  )
  if (demoted.modifiedCount > 0) {
    console.log(`Demoted ${demoted.modifiedCount} extra admin account(s).`)
  }
}

module.exports = ensureAdminUser
