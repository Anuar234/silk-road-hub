import { describe, expect, it } from 'vitest'
import {
  registerUser,
  authenticateRegisteredUser,
  getUserById,
  updateUserVerification,
  addUserCompanyDoc,
  updateUserProfile,
  getAllUsers,
} from '../../pages/api/_lib/authServer'

describe('registration and verification', () => {
  it('registers a new buyer and authenticates', () => {
    const result = registerUser({
      email: 'newbuyer@test.com',
      password: 'pass123',
      displayName: 'New Buyer',
      role: 'buyer',
      phone: '+77001234567',
    })

    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.id).toMatch(/^user-/)
    expect(result.role).toBe('buyer')
    expect(result.verified).toBe(false)
    expect(result.verificationStatus).toBe('pending')
    expect(result.phone).toBe('+77001234567')

    const auth = authenticateRegisteredUser('newbuyer@test.com', 'pass123')
    expect(auth).not.toBeNull()
    expect(auth?.id).toBe(result.id)

    const wrongPass = authenticateRegisteredUser('newbuyer@test.com', 'wrongpass')
    expect(wrongPass).toBeNull()
  })

  it('registers a seller with company data', () => {
    const result = registerUser({
      email: 'seller@company.kz',
      password: 'secure456',
      displayName: 'ТОО TestCompany',
      role: 'seller',
      companyName: 'TestCompany LLP',
      bin: '123456789012',
      position: 'Director',
    })

    expect('error' in result).toBe(false)
    if ('error' in result) return

    expect(result.role).toBe('seller')
    expect(result.companyName).toBe('TestCompany LLP')
    expect(result.bin).toBe('123456789012')
    expect(result.position).toBe('Director')
  })

  it('rejects duplicate email registration', () => {
    registerUser({
      email: 'duplicate@test.com',
      password: 'pass',
      displayName: 'First',
      role: 'buyer',
    })

    const result = registerUser({
      email: 'duplicate@test.com',
      password: 'pass2',
      displayName: 'Second',
      role: 'buyer',
    })

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toBe('EMAIL_TAKEN')
    }
  })

  it('rejects registration with demo email', () => {
    const result = registerUser({
      email: 'Test',
      password: 'anything',
      displayName: 'Impersonator',
      role: 'buyer',
    })

    expect('error' in result).toBe(true)
  })

  it('verifies a user and updates status', () => {
    const user = registerUser({
      email: 'verify-me@test.com',
      password: 'pass',
      displayName: 'VerifyMe',
      role: 'seller',
    })

    if ('error' in user) throw new Error('Registration failed')

    expect(user.verified).toBe(false)

    const verified = updateUserVerification(user.id, 'verified')
    expect(verified?.verified).toBe(true)
    expect(verified?.verificationStatus).toBe('verified')

    const fromStore = getUserById(user.id)
    expect(fromStore?.verified).toBe(true)
  })

  it('adds company documents to user', () => {
    const user = registerUser({
      email: 'docs-user@test.com',
      password: 'pass',
      displayName: 'DocsUser',
      role: 'seller',
    })

    if ('error' in user) throw new Error('Registration failed')

    const added = addUserCompanyDoc(user.id, 'file-001')
    expect(added).toBe(true)

    const fromStore = getUserById(user.id)
    expect(fromStore?.companyDocs).toContain('file-001')
  })

  it('updates user profile', () => {
    const user = registerUser({
      email: 'profile-edit@test.com',
      password: 'pass',
      displayName: 'OldName',
      role: 'seller',
    })

    if ('error' in user) throw new Error('Registration failed')

    const updated = updateUserProfile(user.id, {
      displayName: 'NewName',
      companyName: 'Updated Company',
      phone: '+77009999999',
    })

    expect(updated?.displayName).toBe('NewName')
    expect(updated?.companyName).toBe('Updated Company')
    expect(updated?.phone).toBe('+77009999999')
  })

  it('getAllUsers includes demo and registered users', () => {
    const all = getAllUsers()
    expect(all.length).toBeGreaterThanOrEqual(5) // at least 5 demo users
    expect(all.some((u) => u.id === 'buyer-test')).toBe(true)
  })
})
