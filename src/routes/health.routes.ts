import { Router } from 'express';

// Для Docker и мониторинга: сервер запущен и отвечает
export function healthRouter(): Router {
  const router = Router();

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Сервер жив
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: status — ok, uptime — секунд с запуска
   */
  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: Math.round(process.uptime()) });
  });

  return router;
}
