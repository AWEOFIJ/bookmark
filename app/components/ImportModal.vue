<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{ close: []; imported: [] }>()

const file = ref<File | null>(null)
const uploading = ref(false)
const error = ref('')
const result = ref<{ imported: number; skipped: number; total: number; collectionsCreated: number } | null>(null)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] || null
  result.value = null
  error.value = ''
}

async function upload() {
  if (!file.value) {
    error.value = '請選擇檔案'
    return
  }
  uploading.value = true
  error.value = ''
  try {
    const fd = new FormData()
    fd.append('file', file.value)
    result.value = await $fetch('/api/import/raindrop', { method: 'POST', body: fd })
    emit('imported')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || '匯入失敗'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @keydown.esc="emit('close')">
    <div class="animate-fade-in absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')" />

    <div class="animate-pop-in relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold text-zinc-900 dark:text-white">匯入書籤</h2>
        <button class="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" @click="emit('close')" aria-label="關閉">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <p class="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        支援 Raindrop.io / 瀏覽器匯出的 <code class="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">.html</code>
        （Netscape 格式）。收藏夾、標籤會一併匯入，重複網址自動跳過。
      </p>

      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:border-indigo-500 dark:hover:bg-indigo-500/10"
      >
        <span class="text-3xl">📥</span>
        <span class="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {{ file ? file.name : '點擊選擇 HTML 檔案' }}
        </span>
        <input type="file" accept=".html,.htm" class="hidden" @change="onFileChange" />
      </label>

      <p v-if="error" class="mt-3 text-sm text-red-500">{{ error }}</p>

      <div v-if="result" class="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        ✅ 匯入完成：新增 {{ result.imported }} 個書籤、{{ result.collectionsCreated }} 個收藏夾
        <span v-if="result.skipped">（跳過 {{ result.skipped }} 個重複）</span>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button
          class="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          @click="emit('close')"
        >
          關閉
        </button>
        <button
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          :disabled="!file || uploading"
          @click="upload"
        >
          {{ uploading ? '匯入中…' : '開始匯入' }}
        </button>
      </div>
    </div>
  </div>
</template>
