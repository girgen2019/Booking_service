// Ошибки приложения: сервисы и контроллеры их бросают, errorHandler превращает в HTTP-ответ.
// body — то, что уйдёт клиенту (по умолчанию { message })
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown = { message }
  ) {
    super(message);
    this.name = new.target.name;
  }
}

// 400: запрос в неверном формате (id, даты, имя, цена)
export class ValidationError extends AppError {
  constructor(message: string, body?: unknown) {
    super(400, message, body ?? { message });
  }
}

// 404: книги или брони с таким id нет
export class NotFoundError extends AppError {
  constructor(message: string, body?: unknown) {
    super(404, message, body ?? { message });
  }
}

// 409: действие противоречит текущему состоянию (даты заняты, бронь уже отменена/выдана/возвращена)
export class ConflictError extends AppError {
  constructor(message: string, body?: unknown) {
    super(409, message, body ?? { message });
  }
}
