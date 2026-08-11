import type { BookmarkItem } from '~/composables/useBookmarks'

// Layout 與頁面共享的 UI 狀態（modal 開關 + 分享草稿）
export const useUI = () => {
  const showAdd = useState<boolean>('ui:showAdd', () => false)
  const showImport = useState<boolean>('ui:showImport', () => false)
  const editing = useState<BookmarkItem | null>('ui:editing', () => null)
  const shareDraft = useState<{ url: string; title: string } | null>('ui:shareDraft', () => null)

  function openAdd() {
    editing.value = null
    showAdd.value = true
  }

  function openEdit(b: BookmarkItem) {
    editing.value = b
    showAdd.value = true
  }

  function openImport() {
    showImport.value = true
  }

  function closeAll() {
    showAdd.value = false
    showImport.value = false
    editing.value = null
    shareDraft.value = null
  }

  function setShareDraft(d: { url: string; title: string }) {
    shareDraft.value = d
    openAdd()
  }

  function clearShareDraft() {
    shareDraft.value = null
  }

  return { showAdd, showImport, editing, shareDraft, openAdd, openEdit, openImport, closeAll, setShareDraft, clearShareDraft }
}
