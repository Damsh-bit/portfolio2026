/**
 * Shape checks for what the admin panel sends. Each project is rebuilt from
 * known keys only, so nothing unexpected ends up in the public JSON files.
 */

import { HttpError } from './http.js';
import { MEDIA_DIR, MEDIA_EXT } from './storage.js';
import { CONTENT_FIELDS } from '../../js/modules/project-model.js';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,60}$/;
const REPO_RE = /^[\w.-]+\/[\w.-]+$/;
const MAX_TEXT = 4000;

const fail = (where, message) => { throw new HttpError(400, `${where}: ${message}`); };

function text(value, where, { required = false, max = MAX_TEXT } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) fail(where, 'es obligatorio');
    return undefined;
  }
  if (typeof value !== 'string') fail(where, 'tiene que ser texto');
  const trimmed = value.trim();
  if (required && !trimmed) fail(where, 'es obligatorio');
  if (trimmed.length > max) fail(where, `es demasiado largo (máx. ${max} caracteres)`);
  return trimmed;
}

function textList(value, where, maxItems = 30) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) fail(where, 'tiene que ser una lista');
  if (value.length > maxItems) fail(where, `admite hasta ${maxItems} elementos`);
  return value.map((v, i) => text(v, `${where} #${i + 1}`, { required: true, max: 200 }));
}

export function mediaPath(value, where, { required = false } = {}) {
  const p = text(value, where, { required, max: 300 });
  if (p === undefined) return undefined;
  if (!p.startsWith('assets/') || p.includes('..') || p.includes('\\') || !MEDIA_EXT.test(p)) {
    fail(where, `"${p}" no es un archivo de imagen o video dentro de assets/`);
  }
  return p;
}

function link(value, where) {
  const url = text(value, where, { max: 500 });
  if (url === undefined || url === '#') return url;
  if (!/^https?:\/\/[^\s]+$/i.test(url)) fail(where, 'tiene que empezar con https://');
  return url;
}

function features(value, where) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) fail(where, 'tiene que ser una lista');
  if (value.length > 30) fail(where, 'admite hasta 30 funcionalidades');
  return value.map((f, i) => ({
    title: text(f && f.title, `${where} #${i + 1} (título)`, { required: true, max: 120 }),
    text: text(f && f.text, `${where} #${i + 1} (texto)`, { required: true, max: 600 })
  }));
}

function contentFields(source, where) {
  const out = {};
  if (!source || typeof source !== 'object') return out;
  if ('summary' in source) out.summary = text(source.summary, `${where} resumen`) ?? '';
  if ('description' in source) out.description = text(source.description, `${where} descripción`) ?? '';
  if ('tags' in source) out.tags = textList(source.tags, `${where} tags`, 10);
  if ('stack' in source) out.stack = textList(source.stack, `${where} stack`, 20);
  if ('features' in source) out.features = features(source.features, `${where} funcionalidades`);
  for (const key of Object.keys(out)) if (!CONTENT_FIELDS.includes(key)) delete out[key];
  return out;
}

/** Drops undefined values so the JSON stays tidy. */
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

function presentation(p, where) {
  return {
    title: text(p.title, `${where} título`, { required: true, max: 120 }),
    subtitle: text(p.subtitle, `${where} subtítulo`, { max: 160 }),
    link: link(p.link, `${where} link`),
    image: mediaPath(p.image, `${where} portada`),
    video: mediaPath(p.video, `${where} video`),
    gallery: (Array.isArray(p.gallery) ? p.gallery : []).map((g, i) => mediaPath(g, `${where} galería #${i + 1}`, { required: true })),
    hidden: p.hidden === true ? true : undefined
  };
}

function checkId(p, where, seen) {
  const id = text(p.id, `${where} id`, { required: true, max: 61 });
  if (!ID_RE.test(id)) fail(where, `el id "${id}" solo puede tener minúsculas, números y guiones`);
  if (seen.has(id)) fail(where, `el id "${id}" está repetido`);
  seen.add(id);
  return id;
}

export function validateClientsFile(file, seen) {
  if (!file || !Array.isArray(file.projects)) throw new HttpError(400, 'Formato inválido en trabajos de clientes');
  return {
    ...(file.$comment ? { $comment: String(file.$comment) } : {}),
    projects: file.projects.map((p, i) => {
      const where = `Cliente ${i + 1} (${(p && p.title) || 'sin título'})`;
      if (!p || typeof p !== 'object') fail(where, 'formato inválido');
      const id = checkId(p, where, seen);
      const pres = presentation(p, where);
      const content = contentFields(p, where);
      return compact({
        id,
        title: pres.title,
        subtitle: pres.subtitle,
        tags: content.tags ?? [],
        summary: content.summary,
        description: content.description,
        features: content.features && content.features.length ? content.features : undefined,
        image: pres.image,
        gallery: pres.gallery,
        video: pres.video,
        link: pres.link,
        hidden: pres.hidden
      });
    })
  };
}

export function validatePersonalFile(file, seen) {
  if (!file || !Array.isArray(file.projects)) throw new HttpError(400, 'Formato inválido en proyectos personales');
  return {
    ...(file.$comment ? { $comment: String(file.$comment) } : {}),
    projects: file.projects.map((p, i) => {
      const where = `Proyecto personal ${i + 1} (${(p && p.title) || 'sin título'})`;
      if (!p || typeof p !== 'object') fail(where, 'formato inválido');
      const id = checkId(p, where, seen);
      const repo = text(p.repo, `${where} repositorio`, { required: true, max: 140 });
      if (!REPO_RE.test(repo)) fail(where, 'el repositorio tiene que tener la forma usuario/nombre');
      const pres = presentation(p, where);
      const overrides = contentFields(p.overrides, `${where} (fijado)`);
      const seed = contentFields(p.seed, `${where} (inicial)`);
      const ai = p.ai && typeof p.ai === 'object'
        ? compact({
            notes: text(p.ai.notes, `${where} notas para la IA`),
            contextFiles: textList(p.ai.contextFiles, `${where} archivos de contexto`, 15)
          })
        : undefined;
      return compact({
        id,
        repo,
        branch: text(p.branch, `${where} rama`, { max: 100 }),
        ...pres,
        gallery: pres.gallery,
        ai: ai && Object.keys(ai).length ? ai : undefined,
        overrides: Object.keys(overrides).length ? overrides : undefined,
        seed: Object.keys(seed).length ? seed : undefined
      });
    })
  };
}

const SIGNATURES = [
  { ext: /\.png$/i, test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: /\.jpe?g$/i, test: (b) => b[0] === 0xff && b[1] === 0xd8 },
  { ext: /\.gif$/i, test: (b) => b.subarray(0, 4).toString('latin1') === 'GIF8' },
  { ext: /\.webp$/i, test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { ext: /\.(avif|mp4)$/i, test: (b) => b.subarray(4, 8).toString('latin1') === 'ftyp' },
  { ext: /\.webm$/i, test: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) }
];

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

/** Validates an upload's destination and that the bytes match the extension. */
export function validateUpload(filePath, buffer) {
  const p = mediaPath(filePath, 'Archivo', { required: true });
  if (!p.startsWith(MEDIA_DIR) || !/^[\w./-]+$/.test(p)) fail('Archivo', 'solo se puede subir dentro de assets/projects/');
  if (!buffer.length) fail('Archivo', 'está vacío');
  if (buffer.length > MAX_UPLOAD_BYTES) fail('Archivo', 'pesa más de 3 MB');
  const signature = SIGNATURES.find((s) => s.ext.test(p));
  if (!signature || !signature.test(buffer)) fail('Archivo', 'el contenido no coincide con el tipo de archivo');
  return p;
}
