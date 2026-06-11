export function validationError(message, fields = {}) {
  return httpError(400, message, 'VALIDATION_ERROR', fields)
}

export function authError(message = 'Authentication required') {
  return httpError(401, message, 'AUTHENTICATION_REQUIRED')
}

export function conflictError(message, fields = {}) {
  return httpError(409, message, 'CONFLICT', fields)
}

export function httpError(status, message, code, fields) {
  const error = new Error(message)
  error.status = status
  error.code = code
  error.fields = fields
  return error
}
