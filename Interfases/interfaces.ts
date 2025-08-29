export interface DBConnection  {
    connect(): Promise<void>,
    print()
}

export interface DBBaseCRUD {
    create(title:string, autor:string, year:number),
    read(),
    readAll(),
    update(),
    delete(),
}