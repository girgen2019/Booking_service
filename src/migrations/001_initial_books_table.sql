-- Базовая миграция: создание таблицы books
-- Описывает текущую структуру таблицы

CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    author TEXT,
    title TEXT,
    year INTEGER
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_year ON books(year);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);

-- Добавляем комментарии к таблице и полям
COMMENT ON TABLE books IS 'Таблица для хранения информации о книгах';
COMMENT ON COLUMN books.id IS 'Уникальный идентификатор книги';
COMMENT ON COLUMN books.author IS 'Автор книги';
COMMENT ON COLUMN books.title IS 'Название книги';
COMMENT ON COLUMN books.year IS 'Год издания книги';

