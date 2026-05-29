/**
 * Middleware de autenticação.
 *
 * Lê o header `Authorization: Bearer <token>`, verifica o JWT e popula
 * `req.user`. Se faltar/for inválido, responde 401 via AppError.
 *
 * Use em qualquer rota que exija usuário logado:
 *   router.get('/tasks', requireAuth, handler)
 */
import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt';
import { Errors } from './error';

// Estende o Request do Express com o usuário autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(Errors.unauthorized('Token ausente.'));
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(Errors.unauthorized('Token inválido ou expirado.'));
  }
}
