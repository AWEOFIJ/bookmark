<script setup lang="ts">
definePageMeta({ layout: false })

const { login, fetchMe } = useAuth()
const theme = useTheme()
const config = useRuntimeConfig()

type Step = 'email' | 'password'

const step = ref<Step>('email')
const email = ref('')
const password = ref('')
const error = ref('')
const info = ref('')
const testPassword = ref('')
const loading = ref(false)
const googleLoading = ref(false)
const route = useRoute()

onMounted(() => {
  theme.init()
  // Google callback 拒絕授權時帶的 error
  if (typeof route.query.error === 'string' && route.query.error) {
    error.value = 'Google 登入已取消或失敗，請重試'
  }
  // 已登入直接進主頁
  fetchMe().then(() => {
    const { user } = useAuth()
    if (user.value) navigateTo('/')
  })
})

async function requestPassword() {
  if (!email.value.trim()) {
    error.value = '請輸入 Email'
    return
  }
  loading.value = true
  error.value = ''
  info.value = ''
  testPassword.value = ''
  try {
    const res = await $fetch<{ message: string; testPassword?: string }>('/api/auth/request-password', {
      method: 'POST',
      body: { email: email.value.trim() },
    })
    info.value = res.message
    if (res.testPassword) {
      testPassword.value = res.testPassword
      password.value = res.testPassword
    }
    step.value = 'password'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '寄送失敗'
  } finally {
    loading.value = false
  }
}

async function submitLogin() {
  if (!password.value) {
    error.value = '請輸入收到的密碼'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await login(email.value.trim(), password.value)
    const returnTo = typeof route.query.returnTo === 'string' && route.query.returnTo.startsWith('/') ? route.query.returnTo : '/'
    await navigateTo(returnTo)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '登入失敗'
  } finally {
    loading.value = false
  }
}

function goDirectLogin() {
  if (!email.value.trim()) {
    error.value = '請先輸入 Email'
    return
  }
  error.value = ''
  step.value = 'password'
}

async function loginWithGoogle() {
  googleLoading.value = true
  error.value = ''
  try {
    const returnTo = typeof route.query.returnTo === 'string' && route.query.returnTo.startsWith('/') ? route.query.returnTo : '/'
    // 跳轉 Google 授權頁（redirect_uri 固定帶回 callback）
    window.location.href = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`
  } catch {
    googleLoading.value = false
    error.value = '無法開啟 Google 登入，請重試'
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
    <div class="w-full max-w-sm">
      <div class="mb-8 flex flex-col items-center gap-3">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
          <svg class="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">bookMark</h1>
          <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">輸入 Email 收取登入密碼</p>
        </div>
      </div>

      <form
        class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        @submit.prevent="step === 'email' ? requestPassword() : submitLogin()"
      >
        <!-- Google 登入（有設定才顯示） -->
        <template v-if="step === 'email' && config.public.googleLoginEnabled">
          <button
            type="button"
            class="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            :disabled="googleLoading"
            @click="loginWithGoogle"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
              <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            {{ googleLoading ? '開啟 Google…' : '使用 Google 帳號登入' }}
          </button>

          <div class="mb-4 flex items-center gap-3">
            <div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
            <span class="text-xs text-zinc-400">或</span>
            <div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
          </div>
          <p class="mb-4 text-center text-xs text-zinc-400">
            💡 若跳出 Google 密碼輸入，代表此瀏覽器未登入 Google。<br />
            請用平常登入 Gmail 的瀏覽器開啟（App 內開啟請按「在瀏覽器中開啟」），即可直接選帳號登入
          </p>
        </template>

        <!-- Step 1: Email -->
        <template v-if="step === 'email'">
          <label class="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">Email</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="you@gmail.com"
            class="mb-4 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />

          <p v-if="error" class="mb-3 text-sm text-red-500">{{ error }}</p>

          <button
            type="submit"
            class="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            :disabled="loading"
          >
            {{ loading ? '寄送中…' : '寄送登入密碼' }}
          </button>

          <button
            type="button"
            class="mt-3 w-full rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            @click="goDirectLogin"
          >
            我知道密碼，直接登入
          </button>

          <p class="mt-4 text-center text-xs text-zinc-400">沒有帳號也會自動建立</p>
        </template>

        <!-- Step 2: Password -->
        <template v-else>
          <div class="mb-3 flex items-center justify-between">
            <label class="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              密碼（{{ email }}）
            </label>
            <button type="button" class="text-xs text-indigo-500 hover:underline" @click="step = 'email'">
              更換 Email
            </button>
          </div>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="請輸入信箱收到的密碼"
            class="mb-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />

          <!-- 測試模式提示（SMTP 未設定） -->
          <div
            v-if="testPassword"
            class="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
          >
            ⚠️ 測試模式（SMTP 未設定）：你的登入密碼是 <code class="font-mono font-bold">{{ testPassword }}</code>
          </div>
          <p v-else-if="info" class="mb-3 text-sm text-emerald-600 dark:text-emerald-400">{{ info }}</p>

          <p v-if="error" class="mb-3 text-sm text-red-500">{{ error }}</p>

          <button
            type="submit"
            class="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            :disabled="loading"
          >
            {{ loading ? '登入中…' : '登入' }}
          </button>

          <button
            type="button"
            class="mt-3 w-full text-center text-xs text-zinc-400 hover:text-indigo-500"
            :disabled="loading"
            @click="requestPassword"
          >
            重新寄送密碼
          </button>
        </template>
      </form>

      <p class="mt-4 text-center text-xs text-zinc-400">自架書籤管理 · 開源 · 你的資料你的控制</p>
    </div>
  </div>
</template>
