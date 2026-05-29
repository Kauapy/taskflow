/**
 * Emissão e verificação de JWT.
 *
 * O token carrega apenas o id e o e-mail do usuário (sub + email). Não
 * colocamos nada sensível no payload — JWT é assinado, não criptografado.
 */
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  sub: string;   // user id
  email: string;
}

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

/**
 * Verifica e decodifica. Lança se inválido/expirado — o caller (middleware)
 * traduz isso em 401.
 */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwt.secret);
  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as Record<string, unknown>).sub !== 'string' ||
    typeof (decoded as Record<string, unknown>).email !== 'string'
  ) {
    throw new Error('Payload de token inválido');
  }
  const d = decoded as Record<string, unknown>;
  return { sub: d.sub as string, email: d.email as string };
}
