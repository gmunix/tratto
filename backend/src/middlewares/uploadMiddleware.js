import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

import multer from 'multer'

import { environment } from '../config/environment.js'

export const allowedImageMimes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
export const allowedFileMimes = new Set([
  ...allowedImageMimes,
  'application/pdf',
  'text/plain',
  'application/zip',
])

const mimeExtensions = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp'],
  ['application/pdf', '.pdf'],
  ['text/plain', '.txt'],
  ['application/zip', '.zip'],
])

export function extensionForMime(mime) {
  return mimeExtensions.get(mime) ?? '.bin'
}

function resolveUploadDir() {
  const dir = path.resolve(environment.uploadDir)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

const storage = multer.diskStorage({
  destination: (request, file, cb) => {
    try {
      cb(null, resolveUploadDir())
    } catch (error) {
      cb(error)
    }
  },
  filename: (request, file, cb) => {
    cb(null, `${randomUUID()}${extensionForMime(file.mimetype)}`)
  },
})

function fileFilter(request, file, cb) {
  if (!allowedFileMimes.has(file.mimetype)) {
    cb(new MulterTypeError(`Unsupported mime type: ${file.mimetype}`))
    return
  }

  cb(null, true)
}

class MulterTypeError extends Error {
  constructor(message) {
    super(message)
    this.code = 'UNSUPPORTED_MIME_TYPE'
  }
}

export const evidenceUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: environment.uploadMaxBytes },
})

export function uploadErrorTranslator(error, request, response, next) {
  if (error instanceof multer.MulterError) {
    return response.status(400).json({
      message: error.message,
      code: 'UPLOAD_ERROR',
      fields: { file: error.code === 'LIMIT_FILE_SIZE' ? 'too_large' : 'invalid' },
    })
  }

  if (error?.code === 'UNSUPPORTED_MIME_TYPE') {
    return response.status(400).json({
      message: error.message,
      code: 'UPLOAD_ERROR',
      fields: { file: 'unsupported_type' },
    })
  }

  return next(error)
}
