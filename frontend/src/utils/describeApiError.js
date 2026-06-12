export function describeApiError(apiError, fallback = 'Não foi possível carregar dados da API.') {
  if (!apiError) {
    return ''
  }

  if (apiError.response?.data?.message) {
    return apiError.response.data.message
  }

  if (apiError.code === 'ERR_NETWORK') {
    return 'A API está inacessível no momento. Tente novamente em instantes.'
  }

  return fallback
}
