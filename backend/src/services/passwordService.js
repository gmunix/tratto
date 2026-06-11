import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const keyLength = 64
const scryptCost = 16_384
const scryptBlockSize = 8
const scryptParallelization = 1

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scryptAsync(password, salt, keyLength, {
    cost: scryptCost,
    blockSize: scryptBlockSize,
    parallelization: scryptParallelization,
  })

  return [
    'scrypt',
    scryptCost,
    scryptBlockSize,
    scryptParallelization,
    salt,
    derivedKey.toString('hex'),
  ].join(':')
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, cost, blockSize, parallelization, salt, hash] =
    storedHash.split(':')

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false
  }

  const storedKey = Buffer.from(hash, 'hex')
  const derivedKey = await scryptAsync(password, salt, storedKey.length, {
    cost: Number(cost),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
  })

  return timingSafeEqual(storedKey, derivedKey)
}
