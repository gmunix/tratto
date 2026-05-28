export function getHealth(_request, response) {
  return response.status(200).json({
    status: 'ok',
    service: 'tratto-api',
  })
}
