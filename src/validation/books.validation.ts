export const MAX_PRICE = 1000000;

// Тело запроса на создание и обновление книги. null — всё в порядке, иначе текст ошибки
export function validateBook(body: any): string | null {
  const { title, author, price } = body ?? {};
  if (!title || !author) return 'Names book need necessary';
  if (price === undefined) return null;
  if (typeof price !== 'number') return 'Price not a number';
  if (!Number.isInteger(price)) return "Price of book isn't integer";
  if (price < 0) return 'Price cannot be negative';
  if (price > MAX_PRICE) return 'Price out of range';
  return null;
}
