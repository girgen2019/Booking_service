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