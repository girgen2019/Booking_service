ALTER TABLE books ADD COLUMN price INTEGER;
CREATE INDEX IF NOT EXISTS idx_books_price ON books(price);

