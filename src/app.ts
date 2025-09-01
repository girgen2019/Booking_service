/** @format */

import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import chalk from 'chalk';
import { PostgresDB } from './DataBase/bd';
import { DBConnection, DBBaseCRUD, BookData } from '../Interfases/interfaces';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
const postgreDB: DBConnection & DBBaseCRUD  = new PostgresDB();

(async () => {
  await postgreDB.connect();
  logger.info(chalk.green('Data Base was connect'));
})();

app.get('/books', async (req: Request, res: Response) => {
  try {
    postgreDB.print();
    const allBooks = await postgreDB.readAll();
    res.status(200).json(allBooks.rows);
  } catch (error) {
    res.status(500).json('Internal server error');
  }
});

app.get('/book/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const { rows } = await postgreDB.readByID(id);
  if (rows.length === 0) {
    return res.status(404).json('404 Not Found');
  }
    return res.status(200).json(rows[0]);
});

app.post('/create/book', async (req, res) => {
  const { title, author, year } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: 'Names book need necessary' });
  }

  try {
    const bookData = { title, author, year }
    const request = await postgreDB.create(bookData);
    return res.status(201).json(request);
  } catch (error) {
    console.error('[POST /books] error:', error);
    return res
      .status(500)
      .json({ message: 'Internal server error', detail: error.message });
  }
});

app.delete('/delete/book/:id', async (req, res) => {
  const id = Number(req.params.id)
  const {deleteBook} = await postgreDB.delete(id)
  if(!deleteBook){
     return res.status(404).json("404 Not Found")
  }

  logger.info(chalk.bgGreen(deleteBook))
  return res.status(200).json(`${deleteBook.autor} "${deleteBook.title}" was delete`)
});

export default app;

// 4 роута (в каждом из них, указать строку)
//  придумать боди, что будет у книги (айди, тайтл, автор, год), это гет
// утановить логгер
// исправить чалк
// перенести листенер
//  создать БД постгре, пг админ,
// миграция БД
// исполняющий файл миграция
// придумать одно поле в табл
// метод креэйт в интерфейсе у себя в параметре должен принимать, что то двугое (body)
