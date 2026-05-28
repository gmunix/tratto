export function notFoundHandler(request, response) {
  return response.status(404).json({
    message: `Route ${request.method} ${request.originalUrl} not found`,
  })
}
