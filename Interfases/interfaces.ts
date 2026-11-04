export interface DBConnection  {
    connect(): Promise<void>
    print(): void
}

export interface BookData {
  title: string;
  author: string;
  year: number;
  price?: number;
}

export interface DBBaseCRUD {
    create(bookData: BookData):Promise<BookData>;
    readByID(id:number): Promise<{ rows: BookData[] }>;
    readAll(): Promise<BookData[]>;
    update(id:number, newTitle: string): Promise< { updateBook: BookData | null }>;
    delete(id:number): Promise<{ deleteBook: BookData | null }>;
}

export type ReservationStatus = 'active' | 'cancelled';

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
}

export interface DBReservationCRUD {
    createReservation(data: ReservationData): Promise<Reservation>;
    readReservations(bookId?: number): Promise<Reservation[]>;
    readReservationByID(id: number): Promise<Reservation | null>;
    cancelReservation(id: number): Promise<Reservation | null>;
    findOverlapping(bookId: number, startDate: string, endDate: string): Promise<Reservation[]>;
}
