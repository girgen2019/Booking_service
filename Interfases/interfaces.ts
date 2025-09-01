export interface DBConnection  {
    connect(): Promise<void>,
    print()
}

export interface BookData {
  title: string;
  author: string;
  year: number;
}

export interface DBBaseCRUD {
    create(bookData: BookData),
    readByID(id:number),
    readAll(),
    update(),
    delete(id:number),
}