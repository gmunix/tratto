import { environment } from './environment'

const themeAliases = {
  print: 'screenshot',
}

const supportedColorSchemes = ['reference', 'screenshot']

export function getColorScheme() {
  const requestedScheme = String(environment.colorScheme || '').toLowerCase()
  const normalizedScheme = themeAliases[requestedScheme] ?? requestedScheme

  if (supportedColorSchemes.includes(normalizedScheme)) {
    return normalizedScheme
  }

  if (requestedScheme) {
    console.warn(
      `[Tratto] Unsupported VITE_COLOR_SCHEME "${requestedScheme}". Falling back to "reference".`,
    )
  }

  return 'reference'
}

export function applyColorScheme() {
  const colorScheme = getColorScheme()

  document.documentElement.dataset.theme = colorScheme
  document.documentElement.style.colorScheme =
    colorScheme === 'screenshot' ? 'light' : 'dark'
}
