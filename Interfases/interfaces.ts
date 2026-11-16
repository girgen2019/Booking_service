export interface BookData {
  title: string;
  author: string;
  year: number;
  price?: number;
}

// Книга из базы
export interface Book extends BookData {
  id: number;
  created_at: string;
}

export type ReservationStatus = 'active' | 'issued' | 'returned' | 'cancelled';

export interface ReservationData {
  bookId: number;
  customerName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD, включительно
}

export interface Reservation {
  id: number;
  book_id: number;
  customer_name: string;
  start_date: string;
  end_date: string;
  status: ReservationStatus;
  created_at: string;
  issued_at: string | null;
  returned_at: string | null;
}

// Выданная книга, которую не вернули к end_date
export interface OverdueReservation extends Reservation {
  days_overdue: number;
}
