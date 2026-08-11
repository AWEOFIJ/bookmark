<script setup lang="ts">
definePageMeta({ layout: false })

const { user, fetchMe } = useAuth()
const theme = useTheme()

const email = ref('')
const error = ref('')
const loading = ref(false)

onMounted(() => {
  theme.init()
  // 已登入直接進主頁
  fetchMe().then(() => {
    if (user.value) navigateTo('/')
  })
})

async function enter() {
  const value = email.value.trim()
  if (!value) {
    error.value = '請輸入 Gmail'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/gmail-login', { method: 'POST', body: { email: value } })
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '登入失敗'
  } finally {
    loading.value = false
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
          <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">輸入 Gmail 即可使用</p>
        </div>
      </div>

      <form
        class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        @submit.prevent="enter"
      >
        <label class="mb-1 block text-xs font-semibold text-zinc-500 dark:text-zinc-400">Gmail</label>
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
          {{ loading ? '進入中…' : '進入 bookMark →' }}
        </button>

        <p class="mt-4 text-center text-xs text-zinc-400">
          沒有帳號也會自動建立 · 個人使用建議
        </p>
      </form>
    </div>
  </div>
</template>
