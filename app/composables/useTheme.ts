// 深色模式（class 切換 + localStorage 持久化）
export const useTheme = () => {
  const isDark = useState<boolean>('theme:dark', () => false)

  function apply() {
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', isDark.value)
      localStorage.setItem('bm-theme', isDark.value ? 'dark' : 'light')
    }
  }

  function init() {
    if (!import.meta.client) return
    const saved = localStorage.getItem('bm-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = saved ? saved === 'dark' : prefersDark
    apply()
  }

  function toggle() {
    isDark.value = !isDark.value
    apply()
  }

  return { isDark, init, toggle }
}
