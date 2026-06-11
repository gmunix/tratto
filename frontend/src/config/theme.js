import { environment } from './environment'

const supportedColorSchemes = ['grime', 'cassete']
const colorSchemeStorageKey = 'tratto-theme'

export function getStoredColorScheme() {
  const storedScheme = String(window.localStorage.getItem(colorSchemeStorageKey) || '').toLowerCase()

  return supportedColorSchemes.includes(storedScheme) ? storedScheme : ''
}

export function getColorScheme() {
  const storedScheme = getStoredColorScheme()

  if (storedScheme) {
    return storedScheme
  }

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

export function setColorScheme(colorScheme) {
  document.documentElement.dataset.theme = colorScheme
  document.documentElement.style.colorScheme =
    colorScheme === 'cassete' ? 'light' : 'dark'
}

export function saveColorScheme(colorScheme) {
  window.localStorage.setItem(colorSchemeStorageKey, colorScheme)
  setColorScheme(colorScheme)
}

export function applyColorScheme() {
  setColorScheme(getColorScheme())
}
