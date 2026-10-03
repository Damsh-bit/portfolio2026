#!/usr/bin/env node
/**
 * Servidor local: sirve el sitio y las funciones de /api igual que Vercel,
 * para probar el panel /admin sin deployar.
 *
 *   npm run dev            → http://localhost:5173  (panel en /admin/)
 *
 * Por defecto el panel guarda directo en los archivos de esta carpeta
 * (ADMIN_STORAGE=local). Con ADMIN_STORAGE=github y GITHUB_TOKEN commitea
 * al repo como en producción.
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

process.env.ADMIN_STORAGE ??= 'local';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5173;
const MAX_BODY_BYTES = 5 * 1024 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.avif': 'image/avif', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.glb': 'model/gltf-binary', '.obj': 'text/plain', '.woff2': 'font/woff2'
};

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error('Body demasiado grande');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw && (req.headers['content-type'] || '').includes('application/json') ? JSON.parse(raw) : raw || undefined;
}

/** Adds the Vercel-style helpers (req.query/body, res.status/json). */
async function runFunction(file, req, res, url) {
  req.query = Object.fromEntries(url.searchParams);
  try {
    req.body = await readBody(req);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: err.message }));
    return;
  }
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
    return res;
  };
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  await mod.default(req, res);
}

async function serveStatic(pathname, res) {
  let file = path.resolve(ROOT, `.${decodeURIComponent(pathname)}`);
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  const stat = await fs.stat(file).catch(() => null);
  if (stat && stat.isDirectory()) file = path.join(file, 'index.html');
  const body = await fs.readFile(file).catch(() => null);
  if (!body) return res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(body);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const file = path.resolve(ROOT, `.${url.pathname.replace(/\/$/, '')}.js`);
      const exists = file.startsWith(path.join(ROOT, 'api')) && !url.pathname.includes('/_') && await fs.stat(file).catch(() => null);
      if (!exists) return res.writeHead(404, { 'Content-Type': 'application/json' }).end('{"error":"No existe"}');
      return await runFunction(file, req, res, url);
    }
    // Vercel serves /admin and /admin/ from admin/index.html
    if (url.pathname === '/admin') return res.writeHead(308, { Location: '/admin/' }).end();
    await serveStatic(url.pathname, res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}).listen(PORT, () => {
  console.log(`Portfolio en http://localhost:${PORT}  ·  panel en http://localhost:${PORT}/admin/  ·  guardado: ${process.env.ADMIN_STORAGE}`);
});
