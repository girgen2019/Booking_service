-- Миграция: prevent_double_booking
-- Одну книгу нельзя забронировать дважды на пересекающиеся даты.
-- Проверку делает сама база: даже два одновременных запроса не создадут две брони на одни даты.
-- Отменённые брони (status = 'cancelled') не мешают: их даты снова свободны.

-- btree_gist позволяет в одном ограничении сравнить book_id (=) и диапазон дат (&&)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservations
    ADD CONSTRAINT reservations_no_overlap
    EXCLUDE USING gist (
        book_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
    )
    WHERE (status = 'active');

COMMENT ON CONSTRAINT reservations_no_overlap ON reservations
    IS 'Нет двух активных броней одной книги с пересекающимися датами (даты включительно)';
