import { ref } from 'vue'

// Module-level shared state so every component (sidebar toggle, Settings page)
// reflects the same theme and stays in sync.
const isDarkMode = ref(false)

function apply(dark: boolean) {
  isDarkMode.value = dark
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('darkMode', dark ? 'true' : 'false')
}

export function useTheme() {
  function initTheme() {
    apply(localStorage.getItem('darkMode') === 'true')
  }
  function toggleDarkMode() {
    apply(!isDarkMode.value)
  }
  function setDarkMode(dark: boolean) {
    apply(dark)
  }
  return { isDarkMode, initTheme, toggleDarkMode, setDarkMode }
}
