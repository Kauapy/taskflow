/**
 * Upload de anexos. Substitui o Supabase Storage.
 *
 *   POST   /uploads   (multipart, campo "file")  → { attachment }
 *   DELETE /uploads   { key }                     → 204
 *
 * Aceita QUALQUER tipo de arquivo até 10 MB. O arquivo vai para o driver
 * de storage ativo (disco em dev, S3/R2 em produção). A URL pública
 * retornada é o que o frontend guarda em tasks.attachments.
 */
import { Router } from 'express';
import multer, { MulterError } from 'multer';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import { Errors } from '../middleware/error';
import { storage } from '../lib/storage';

export const uploadsRouter = Router();
uploadsRouter.use(requireAuth);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

/** POST /uploads */
uploadsRouter.post('/', (req, res, next) => {
  upload.single('file')(req, res, async (err: unknown) => {
    try {
      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          throw Errors.badRequest('Arquivo excede 10 MB.', 'file_too_large');
        }
        throw Errors.badRequest(`Falha no upload: ${err.message}`, 'upload_error');
      }
      if (err) throw err;
      if (!req.file) {
        throw Errors.badRequest('Nenhum arquivo enviado (campo "file").', 'no_file');
      }

      const stored = await storage.upload({
        userId: req.user!.id,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype || 'application/octet-stream',
        buffer: req.file.buffer,
      });

      res.status(201).json({ attachment: stored });
    } catch (e) {
      next(e);
    }
  });
});

const deleteSchema = z.object({ key: z.string().min(1) });

/** DELETE /uploads */
uploadsRouter.delete('/', async (req, res, next) => {
  try {
    const { key } = deleteSchema.parse(req.body);
    // Segurança: o key começa com `{userId}/`. Um usuário só apaga o que é seu.
    if (!key.startsWith(`${req.user!.id}/`)) {
      throw Errors.forbidden('Você não pode apagar este arquivo.');
    }
    await storage.remove(key);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
