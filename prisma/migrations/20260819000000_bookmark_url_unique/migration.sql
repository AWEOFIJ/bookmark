-- 方案 C：書籤 URL 唯一約束
-- 1) 先移除重複 URL 的書籤（保留最早建立的一筆）
--    FK ON DELETE CASCADE 會一併清掉重複書籤的 BookmarkTag / KnowledgeNode / Edge
DELETE FROM "Bookmark"
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY url ORDER BY "createdAt" ASC, id ASC) AS rn
    FROM "Bookmark"
  ) t
  WHERE rn > 1
);

-- 2) 加上 url 唯一約束
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_url_key" UNIQUE ("url");
