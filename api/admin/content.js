/**
 * GET /api/admin/content → every editable file (with its version sha), the
 *   synced personal data (read-only) and the media library.
 * PUT /api/admin/content { clients, personal, base, uploads } → saves both
 *   project files (plus any staged uploads) in one commit.
 */

import { requireAuth } from '../_lib/auth.js';
import { allowMethods, HttpError, noStore, respond } from '../_lib/http.js';
import { EDITABLE_FILES, getStore } from '../_lib/storage.js';
import { mediaPath, validateClientsFile, validatePersonalFile } from '../_lib/validate.js';

async function readContent(store) {
  const [clients, personal, synced, media] = await Promise.all([
    store.readFile('clients'),
    store.readFile('personal'),
    store.readFile('synced').catch(() => ({ data: { projects: [] }, sha: null })),
    store.listMedia()
  ]);
  return {
    storage: store.kind,
    canWrite: store.canWrite(),
    files: { clients, personal, synced },
    media
  };
}

async function saveContent(store, body) {
  if (!store.canWrite()) {
    throw new HttpError(503, 'Falta configurar GITHUB_TOKEN en Vercel para poder guardar.');
  }
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Cuerpo vacío');

  const seen = new Set();
  const files = {
    personal: validatePersonalFile(body.personal, seen),
    clients: validateClientsFile(body.clients, seen)
  };

  const base = {};
  for (const key of EDITABLE_FILES) {
    base[key] = typeof body.base?.[key] === 'string' ? body.base[key] : null;
  }

  const uploads = (Array.isArray(body.uploads) ? body.uploads : []).map((u, i) => {
    const where = `Archivo subido #${i + 1}`;
    if (!u || typeof u.sha !== 'string' || !/^[0-9a-f]{40}$/.test(u.sha)) throw new HttpError(400, `${where}: falta el identificador`);
    return { path: mediaPath(u.path, where, { required: true }), sha: u.sha };
  });

  return store.commit({
    files,
    base,
    uploads: store.kind === 'github' ? uploads : [],
    message: 'content: actualizar proyectos desde el panel'
  });
}

export default async function handler(req, res) {
  noStore(res);
  if (!allowMethods(req, res, ['GET', 'PUT'])) return;
  if (!requireAuth(req, res)) return;

  const store = getStore();
  await respond(res, async () => {
    if (req.method === 'GET') {
      res.status(200).json(await readContent(store));
    } else {
      res.status(200).json(await saveContent(store, req.body));
    }
  });
}
