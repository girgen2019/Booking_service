-- Миграция: create_reservations_table
-- Бронирование книг: кто, какую книгу и на какие даты забронировал

CREATE TABLE IF NOT EXISTS reservations (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT reservations_status_check CHECK (status IN ('active', 'cancelled')),
    CONSTRAINT reservations_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

COMMENT ON TABLE reservations IS 'Бронирования книг';
COMMENT ON COLUMN reservations.book_id IS 'Забронированная книга (при удалении книги удаляются и её брони)';
COMMENT ON COLUMN reservations.customer_name IS 'Кто забронировал';
COMMENT ON COLUMN reservations.start_date IS 'Первый день брони (включительно)';
COMMENT ON COLUMN reservations.end_date IS 'Последний день брони (включительно)';
COMMENT ON COLUMN reservations.status IS 'active — действует, cancelled — отменена';
