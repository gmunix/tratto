import { environment } from './environment'

const supportedColorSchemes = ['grime', 'cassete']

export function getColorScheme() {
  const requestedScheme = String(environment.colorScheme || '').toLowerCase()

  if (supportedColorSchemes.includes(requestedScheme)) {
    return requestedScheme
  }

  if (requestedScheme) {
    console.warn(
      `[Tratto] Unsupported VITE_COLOR_SCHEME "${requestedScheme}". Falling back to "grime".`,
    )
  }

  return 'grime'
}

export function applyColorScheme() {
  const colorScheme = getColorScheme()

  document.documentElement.dataset.theme = colorScheme
  document.documentElement.style.colorScheme =
    colorScheme === 'cassete' ? 'light' : 'dark'
}
