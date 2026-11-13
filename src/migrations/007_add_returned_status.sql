-- Миграция: add_returned_status
-- Возврат книги: issued -> returned. Вернувшаяся книга освобождает даты
-- (защита от двойной брони по-прежнему учитывает только active и issued).

ALTER TABLE reservations DROP CONSTRAINT reservations_status_check;
ALTER TABLE reservations
    ADD CONSTRAINT reservations_status_check CHECK (status IN ('active', 'issued', 'returned', 'cancelled'));

ALTER TABLE reservations ADD COLUMN returned_at TIMESTAMP;

COMMENT ON COLUMN reservations.status IS 'active — действует, issued — книга выдана, returned — книга возвращена, cancelled — отменена';
COMMENT ON COLUMN reservations.returned_at IS 'Когда книгу вернули (status = returned)';
