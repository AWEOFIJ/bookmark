import type { Bookmark, Collection, BookmarkTag, Tag } from '@prisma/client'

export interface BookmarkWithRelations extends Bookmark {
  collection: Pick<Collection, 'id' | 'name' | 'icon' | 'color'> | null
  tags: (BookmarkTag & { tag: Pick<Tag, 'id' | 'name'> })[]
}

// 轉成前端 API 形狀
export function serializeBookmark(b: BookmarkWithRelations) {
  return {
    id: b.id,
    url: b.url,
    title: b.title,
    description: b.description,
    favicon: b.favicon,
    note: b.note,
    important: b.important,
    unread: b.unread,
    collectionId: b.collectionId,
    collection: b.collection
      ? { id: b.collection.id, name: b.collection.name, icon: b.collection.icon, color: b.collection.color }
      : null,
    tags: b.tags.map((bt) => bt.tag.name),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }
}
