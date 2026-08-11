import type { BookmarkItem } from '~/composables/useBookmarks'

// Layout 與頁面共享的 UI 狀態（modal 開關）
export const useUI = () => {
  const showAdd = useState<boolean>('ui:showAdd', () => false)
  const showImport = useState<boolean>('ui:showImport', () => false)
  const editing = useState<BookmarkItem | null>('ui:editing', () => null)

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
  }

  return { showAdd, showImport, editing, openAdd, openEdit, openImport, closeAll }
}
