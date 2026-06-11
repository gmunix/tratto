import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

import multer from 'multer'

import { environment } from '../config/environment.js'

const allowedImageMimes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
const allowedFileMimes = new Set([
  ...allowedImageMimes,
  'application/pdf',
  'text/plain',
  'application/zip',
])

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
    const ext = path.extname(file.originalname).slice(0, 16).toLowerCase()
    cb(null, `${randomUUID()}${ext}`)
  },
})

function fileFilter(request, file, cb) {
  const type = request.body?.type ?? request.query?.type
  const allowed = type === 'image' ? allowedImageMimes : allowedFileMimes

  if (!allowed.has(file.mimetype)) {
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
