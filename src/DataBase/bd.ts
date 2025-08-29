/** @format */

import { Pool, PoolConfig } from 'pg';
import { DBBaseCRUD, DBConnection } from '../../Interfases/interfaces';
import logger from '../../utils/logger';
import chalk from 'chalk';

export class PostgresDB implements DBConnection, DBBaseCRUD {
  private pool: Pool;
  constructor(
    private user = process.env.DB_USER,
    private host = process.env.DB_HOST,
    private database = process.env.DB_NAME,
    private password = process.env.DB_PASSWORD,
    private port = parseInt(process.env.DB_PORT || '5432')
  ) {
    const dbConfig: PoolConfig = {
      user: this.user,
      host: this.host,
      database: this.database,
      password: this.password,
      port: this.port,
    };
    this.pool = new Pool(dbConfig);
  }

  print() {
    console.log(this.password);
  }

  async connect() {
    await this.pool.connect();
  }

  async create(title:string, autor:string, year:number ) {
     const { rows } = await this.pool.query(
      `INSERT INTO public.books (title, autor, year)
       VALUES ($1, $2, $3)
       RETURNING id, title, autor, year`,
      [title, autor, year ?? null])
  }

  async read() {
    await this.pool.query('SELECT * FROM books ORDER BY id ASC');
  }

  async readAll() {
    const allBooks = await this.pool.query(
      'SELECT * FROM books ORDER BY id ASC'
    );
    return allBooks;
  }

  async update() {}

  async delete() {}
}
