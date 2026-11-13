-- Миграция: add_issued_status
-- Выдача книги по брони: active -> issued.
-- Выданная книга по-прежнему занимает свои даты, поэтому защита от двойной брони
-- теперь учитывает и active, и issued.

ALTER TABLE reservations DROP CONSTRAINT reservations_status_check;
ALTER TABLE reservations
    ADD CONSTRAINT reservations_status_check CHECK (status IN ('active', 'issued', 'cancelled'));

ALTER TABLE reservations ADD COLUMN issued_at TIMESTAMP;

ALTER TABLE reservations DROP CONSTRAINT reservations_no_overlap;
ALTER TABLE reservations
    ADD CONSTRAINT reservations_no_overlap
    EXCLUDE USING gist (
        book_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    )
    WHERE (status IN ('active', 'issued'));

COMMENT ON COLUMN reservations.status IS 'active — действует, issued — книга выдана, cancelled — отменена';
COMMENT ON COLUMN reservations.issued_at IS 'Когда книгу выдали (status = issued)';
COMMENT ON CONSTRAINT reservations_no_overlap ON reservations
    IS 'Нет двух действующих (active/issued) броней одной книги с пересекающимися датами';
