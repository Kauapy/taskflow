/**
 * Hashing de senha com bcrypt.
 *
 * Custo (rounds) configurável via BCRYPT_ROUNDS. bcryptjs é puro-JS
 * (sem binário nativo), o que simplifica deploy em qualquer host.
 */
import bcrypt from 'bcryptjs';
import { config } from '../config';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, config.bcryptRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
