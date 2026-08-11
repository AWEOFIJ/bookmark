<script setup lang="ts">
definePageMeta({ layout: false })

const { login, fetchMe } = useAuth()
const theme = useTheme()

type Step = 'email' | 'password'

const step = ref<Step>('email')
const email = ref('')
const password = ref('')
const error = ref('')
const info = ref('')
const testPassword = ref('')
const loading = ref(false)
const route = useRoute()

onMounted(() => {
  theme.init()
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
    const returnTo = typeof route.query.returnTo === 'string' ? route.query.returnTo : '/'
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
