export function errorHandler(error, _request, response, _next) {
  if (error.status) {
    const body = {
      message: error.message,
      code: error.code,
    }

    if (error.fields && Object.keys(error.fields).length > 0) {
      body.fields = error.fields
    }

    return response.status(error.status).json(body)
  }

  console.error(error)

  return response.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  })
}
