/**
 * Rotas de autenticação: substitui o Supabase Auth.
 *
 *   POST /auth/signup  { email, password }     → { token, user }
 *   POST /auth/login   { email, password }     → { token, user }
 *   GET  /auth/me      (Bearer token)          → { user }
 *
 * Senhas são hasheadas com bcrypt; sessão é um JWT stateless.
 */
import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db';
import { hashPassword, verifyPassword } from '../lib/hash';
import { signToken } from '../lib/jwt';
import { requireAuth } from '../middleware/requireAuth';
import { Errors } from '../middleware/error';

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email('E-mail inválido.').max(255),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.').max(128),
});

interface AuthUserRow {
  id: string;
  email: string;
  password_hash: string;
}

/** POST /auth/signup */
authRouter.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    // Já existe?
    const existing = await query<{ id: string }>(
      'SELECT id FROM auth_users WHERE lower(email) = $1',
      [normalizedEmail]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      throw Errors.conflict('Já existe uma conta com esse e-mail.', 'email_taken');
    }

    const passwordHash = await hashPassword(password);

    // Cria usuário + profile na mesma transação (profile é o espelho de e-mail
    // usado no lookup de compartilhamento — substitui o trigger do Supabase).
    const user = await withTransaction(async (client) => {
      const inserted = await client.query<{ id: string; email: string }>(
        `INSERT INTO auth_users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email`,
        [normalizedEmail, passwordHash]
      );
      const row = inserted.rows[0];
      await client.query(
        `INSERT INTO profiles (id, email) VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [row.id, normalizedEmail]
      );
      return row;
    });

    const token = signToken({ sub: user.id, email: user.email });
    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

/** POST /auth/login */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const result = await query<AuthUserRow>(
      'SELECT id, email, password_hash FROM auth_users WHERE lower(email) = $1',
      [normalizedEmail]
    );
    const row = result.rows[0];

    // Mesma mensagem para usuário inexistente e senha errada — evita
    // enumeração de e-mails cadastrados.
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      throw Errors.unauthorized('E-mail ou senha incorretos.', 'invalid_credentials');
    }

    const token = signToken({ sub: row.id, email: row.email });
    res.json({ token, user: { id: row.id, email: row.email } });
  } catch (err) {
    next(err);
  }
});

/** GET /auth/me */
authRouter.get('/me', requireAuth, (req, res) => {
  // requireAuth garante req.user
  res.json({ user: req.user });
});
