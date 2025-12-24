-- Миграция: add_created_at_to_books
-- Дата создания: 2025-10-02T15:28:51.532Z

-- ВАЖНО: Всегда создавайте обратную миграцию!
-- Для отката используйте: node src/scripts/rollback.js

-- Ваш SQL код здесь
-- Пример:
-- ALTER TABLE books ADD COLUMN new_field VARCHAR(255);

-- Не забудьте добавить комментарии:
-- COMMENT ON COLUMN books.new_field IS 'Описание нового поля';
ALTER TABLE books ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);
COMMENT ON COLUMN books.created_at IS 'Дата и время создания записи о книге';