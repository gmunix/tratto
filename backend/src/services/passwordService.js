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
  if (typeof storedHash !== 'string') {
    return false
  }

  const parts = storedHash.split(':')
  const [algorithm, cost, blockSize, parallelization, salt, hash] = parts
  const params = {
    cost: Number(cost),
    blockSize: Number(blockSize),
    parallelization: Number(parallelization),
  }

  if (
    parts.length !== 6 ||
    algorithm !== 'scrypt' ||
    !isPositiveSafeInteger(params.cost) ||
    !isPowerOfTwo(params.cost) ||
    !isPositiveSafeInteger(params.blockSize) ||
    !isPositiveSafeInteger(params.parallelization) ||
    !isHex(salt) ||
    !isHex(hash) ||
    hash.length !== keyLength * 2
  ) {
    return false
  }

  try {
    const storedKey = Buffer.from(hash, 'hex')
    const derivedKey = await scryptAsync(password, salt, storedKey.length, params)

    return timingSafeEqual(storedKey, derivedKey)
  } catch {
    return false
  }
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0
}

function isPowerOfTwo(value) {
  return value > 1 && Number.isInteger(Math.log2(value))
}

function isHex(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length % 2 === 0 &&
    /^[0-9a-f]+$/i.test(value)
  )
}
