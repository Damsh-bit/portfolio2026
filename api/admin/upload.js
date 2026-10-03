/**
 * POST /api/admin/upload { path, data } (data = base64) → { path, sha }
 *
 * On GitHub the file is staged as a blob and only lands in the repo with
 * the next save, so a batch of images + edits becomes a single commit.
 */

import { requireAuth } from '../_lib/auth.js';
import { allowMethods, HttpError, noStore, respond } from '../_lib/http.js';
import { getStore } from '../_lib/storage.js';
import { validateUpload } from '../_lib/validate.js';

export default async function handler(req, res) {
  noStore(res);
  if (!allowMethods(req, res, ['POST'])) return;
  if (!requireAuth(req, res)) return;

  const store = getStore();
  await respond(res, async () => {
    if (!store.canWrite()) throw new HttpError(503, 'Falta configurar GITHUB_TOKEN en Vercel para poder subir archivos.');

    const { path, data } = req.body || {};
    if (typeof data !== 'string' || !data) throw new HttpError(400, 'Falta el contenido del archivo');
    const buffer = Buffer.from(data, 'base64');
    const filePath = validateUpload(path, buffer);

    res.status(200).json(await store.stageUpload(filePath, buffer));
  });
}
