/**
 * Error handler central. Mapeia AppError em respostas HTTP estruturadas
 * e captura tudo o que vazar pra dar 500 sem expor stack ao cliente.
 */
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  override readonly name = 'AppError';
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

/** Erros comuns prontos para uso. */
export const Errors = {
  badRequest: (message: string, code = 'bad_request') =>
    new AppError(400, code, message),
  unauthorized: (message = 'Não autenticado', code = 'unauthorized') =>
    new AppError(401, code, message),
  forbidden: (message = 'Não autorizado', code = 'forbidden') =>
    new AppError(403, code, message),
  notFound: (message = 'Recurso não encontrado', code = 'not_found') =>
    new AppError(404, code, message),
  conflict: (message: string, code = 'conflict') =>
    new AppError(409, code, message),
  internal: (message = 'Erro interno', code = 'internal') =>
    new AppError(500, code, message),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // O parâmetro `next` é exigido pelo Express para identificar como error middleware,
  // mesmo que não usemos.
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Payload inválido.',
        issues: err.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    });
    return;
  }

  // Erros que já carregam status HTTP (ex.: serve-static lança 404 para
  // arquivo inexistente com fallthrough:false). Respeita o status.
  const httpStatus = (err as { status?: number; statusCode?: number })?.status
    ?? (err as { statusCode?: number })?.statusCode;
  if (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 600) {
    res.status(httpStatus).json({
      error: {
        code: httpStatus === 404 ? 'not_found' : 'error',
        message: httpStatus === 404 ? 'Recurso não encontrado.' : 'Erro na requisição.',
      },
    });
    return;
  }

  // Erro inesperado
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: { code: 'internal', message: 'Erro interno do servidor.' },
  });
}
