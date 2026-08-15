// 登入狀態管理
export interface AuthUser {
  id: string
  email: string
  name?: string | null
  avatar?: string | null
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const loading = useState<boolean>('auth:loading', () => true)

  async function fetchMe() {
    try {
      const res = await $fetch<{ user: AuthUser | null }>('/api/auth/me')
      user.value = res.user
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    const res = await $fetch<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    user.value = res
    return res
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
    }
  }

  return { user, loading, fetchMe, login, logout }
}
