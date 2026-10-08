/**
 * Where the admin reads and writes content. No database: the portfolio repo
 * itself is the store.
 *
 *  - github (Vercel): reads through the GitHub API and saves by committing
 *    to the branch, so every save is versioned and triggers a redeploy.
 *    Needs GITHUB_TOKEN (fine-grained, Contents: read & write on the repo).
 *  - local (npm run dev): reads/writes the working copy on disk, so the
 *    panel can be tried without touching GitHub.
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from './http.js';

export const CONTENT_FILES = {
  clients: 'content/client-projects.json',
  personal: 'content/personal-projects.config.json',
  synced: 'data/personal-projects.json'
};
export const EDITABLE_FILES = ['clients', 'personal'];
export const MEDIA_DIR = 'assets/projects/';
export const MEDIA_EXT = /\.(png|jpe?g|webp|gif|avif|mp4|webm)$/i;

const REPO = process.env.GITHUB_REPO || 'Damsh-bit/portfolio2026';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

export const serialize = (data) => `${JSON.stringify(data, null, 2)}\n`;

/** Git's blob id for some content, so both stores version files the same way. */
export function gitBlobSha(buffer) {
  return crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${buffer.length}\0`), buffer])).digest('hex');
}

const conflict = () => new HttpError(409, 'Los datos cambiaron desde que abriste el panel (¿otra pestaña o el sync automático?). Recargá para ver la última versión.');

const MISSING_TOKEN = 'Falta configurar GITHUB_TOKEN en Vercel (ver README → Panel de administración).';

/** Turns GitHub's auth errors into what to change, since its own message doesn't say. */
function authHint(res) {
  if (res.status === 401) {
    return ' — GITHUB_TOKEN es inválido o venció: generá uno nuevo, reemplazalo en Vercel y hacé Redeploy.';
  }
  if (res.status !== 403) return '';
  if (res.headers.get('x-ratelimit-remaining') === '0') return ' — se agotó el límite de la API de GitHub, probá en unos minutos.';
  const needed = res.headers.get('x-accepted-github-permissions');
  return ` — el token no puede escribir en ${REPO}${needed ? ` (GitHub pide: ${needed})` : ''}. `
    + `En GitHub → Settings → Developer settings → Fine-grained tokens, editá el token: Repository access tiene que incluir ${REPO} `
    + 'y Permissions → Contents en "Read and write".';
}

/* ------------------------------------------------------------------ */
/*  GitHub                                                            */
/* ------------------------------------------------------------------ */

async function github(pathname, { method = 'GET', body } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'portfolio-admin'
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`https://api.github.com/repos/${REPO}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) {
    const err = new HttpError(502, `GitHub ${res.status}: ${(data && data.message) || text.slice(0, 160)}${authHint(res)}`);
    err.githubStatus = res.status;
    throw err;
  }
  return data;
}

async function githubReadFile(filePath, ref = BRANCH) {
  const file = await github(`/contents/${filePath}?ref=${encodeURIComponent(ref)}`);
  const buffer = Buffer.from(file.content, 'base64');
  return { data: JSON.parse(buffer.toString('utf8')), sha: file.sha };
}

const githubStore = {
  kind: 'github',

  canWrite: () => !!process.env.GITHUB_TOKEN,

  /**
   * Whether the token can really commit. Having one isn't enough: a token
   * with read-only Contents passes every read and only fails on the first
   * upload or save. Staging an empty blob is a write that leaves no trace.
   */
  async checkWrite() {
    if (!process.env.GITHUB_TOKEN) return { canWrite: false, writeError: MISSING_TOKEN };
    try {
      await github('/git/blobs', { method: 'POST', body: { content: '', encoding: 'utf-8' } });
    } catch (err) {
      if (err.githubStatus === 401 || err.githubStatus === 403) return { canWrite: false, writeError: err.message };
      console.warn('No pude verificar el permiso de escritura:', err.message);
    }
    return { canWrite: true, writeError: null };
  },

  async readFile(key) {
    return githubReadFile(CONTENT_FILES[key]);
  },

  async listMedia() {
    try {
      const tree = await github(`/git/trees/${encodeURIComponent(BRANCH)}?recursive=1`);
      return tree.tree
        .filter((t) => t.type === 'blob' && t.path.startsWith(MEDIA_DIR) && MEDIA_EXT.test(t.path))
        .map((t) => ({ path: t.path, size: t.size }));
    } catch (err) {
      console.warn('No pude listar los archivos de assets:', err.message);
      return [];
    }
  },

  /** Uploads the bytes as a git blob; it only becomes part of the repo when a save references it. */
  async stageUpload(filePath, buffer) {
    const blob = await github('/git/blobs', {
      method: 'POST',
      body: { content: buffer.toString('base64'), encoding: 'base64' }
    });
    return { path: filePath, sha: blob.sha };
  },

  /** One commit with the edited JSON files plus any staged uploads. */
  async commit({ files, base, uploads, message }) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ref = await github(`/git/ref/heads/${encodeURIComponent(BRANCH)}`);
      const headSha = ref.object.sha;
      const headCommit = await github(`/git/commits/${headSha}`);

      for (const key of Object.keys(files)) {
        const current = await github(`/contents/${CONTENT_FILES[key]}?ref=${headSha}`);
        if (base[key] && current.sha !== base[key]) throw conflict();
      }

      const tree = await github('/git/trees', {
        method: 'POST',
        body: {
          base_tree: headCommit.tree.sha,
          tree: [
            ...Object.entries(files).map(([key, data]) => ({
              path: CONTENT_FILES[key], mode: '100644', type: 'blob', content: serialize(data)
            })),
            ...uploads.map((u) => ({ path: u.path, mode: '100644', type: 'blob', sha: u.sha }))
          ]
        }
      });

      const shas = Object.fromEntries(Object.entries(files).map(([key, data]) => [key, gitBlobSha(Buffer.from(serialize(data)))]));
      if (tree.sha === headCommit.tree.sha) return { commit: headSha, shas, unchanged: true };

      const commit = await github('/git/commits', {
        method: 'POST',
        body: { message, tree: tree.sha, parents: [headSha] }
      });

      try {
        await github(`/git/refs/heads/${encodeURIComponent(BRANCH)}`, {
          method: 'PATCH',
          body: { sha: commit.sha, force: false }
        });
        return { commit: commit.sha, shas, unchanged: false };
      } catch (err) {
        // Someone else pushed in between (e.g. the sync Action): rebuild on top of it once.
        if (err.githubStatus === 422 && attempt === 0) continue;
        throw err;
      }
    }
    throw conflict();
  }
};

/* ------------------------------------------------------------------ */
/*  Local (dev)                                                       */
/* ------------------------------------------------------------------ */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function localPath(relative) {
  const full = path.resolve(ROOT, relative);
  if (!full.startsWith(ROOT + path.sep)) throw new HttpError(400, 'Ruta inválida');
  return full;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const localStore = {
  kind: 'local',

  canWrite: () => true,

  async checkWrite() {
    return { canWrite: true, writeError: null };
  },

  async readFile(key) {
    const buffer = await fs.readFile(localPath(CONTENT_FILES[key]));
    return { data: JSON.parse(buffer.toString('utf8')), sha: gitBlobSha(buffer) };
  },

  async listMedia() {
    const files = await walk(localPath(MEDIA_DIR));
    const media = [];
    for (const full of files) {
      const rel = path.relative(ROOT, full).split(path.sep).join('/');
      if (MEDIA_EXT.test(rel)) media.push({ path: rel, size: (await fs.stat(full)).size });
    }
    return media;
  },

  async stageUpload(filePath, buffer) {
    const full = localPath(filePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, buffer);
    return { path: filePath, sha: gitBlobSha(buffer) };
  },

  async commit({ files, base }) {
    for (const key of Object.keys(files)) {
      const current = await fs.readFile(localPath(CONTENT_FILES[key])).catch(() => null);
      if (base[key] && current && gitBlobSha(current) !== base[key]) throw conflict();
    }
    const shas = {};
    for (const [key, data] of Object.entries(files)) {
      const buffer = Buffer.from(serialize(data));
      await fs.writeFile(localPath(CONTENT_FILES[key]), buffer);
      shas[key] = gitBlobSha(buffer);
    }
    return { commit: 'local', shas, unchanged: false };
  }
};

export function getStore() {
  return process.env.ADMIN_STORAGE === 'local' ? localStore : githubStore;
}
