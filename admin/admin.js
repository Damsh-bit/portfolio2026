/**
 * =========================================================================
 * ADMIN PANEL
 * =========================================================================
 * Editor for every project on the site (personal + client work).
 *
 * Talks to /api/admin/*: login returns a 12h session token; the content is
 * loaded whole, edited in memory and saved in one go (one commit on
 * GitHub, or straight to disk when running `npm run dev`). Images are
 * resized and converted to WebP in the browser before uploading; uploads
 * are staged immediately and published with the next save.
 *
 * For personal projects, content fields (summary, features…) are filled by
 * the GitHub sync. Editing one here pins it ("Fijado a mano") so the sync
 * stops changing it; "Volver a automático" releases it.
 */

import { resolveContentField } from '/js/modules/project-model.js';

const API = '/api/admin';
const TOKEN_KEY = 'pf_admin_token';
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 2000;
const VIDEO_RE = /\.(mp4|webm)$/i;

const SOURCE_LABELS = {
  manual: 'Fijado a mano',
  auto: 'Automático',
  seed: 'Texto inicial',
  empty: 'Lo completa la sync'
};

const $ = (id) => document.getElementById(id);

const state = {
  token: null,
  storage: null,
  canWrite: false,
  files: { clients: null, personal: null },
  shas: { clients: null, personal: null },
  synced: new Map(),
  media: [],
  uploads: [],
  previews: new Map(),
  autoId: new WeakSet(),
  selected: null,
  dirty: false,
  saving: false
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Tiny element builder: props → properties/attributes, on* → listeners. */
function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (key in el && typeof value !== 'string') el[key] = value;
    else if (key === 'value') el.value = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child === undefined || child === null || child === false) continue;
    el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

let uidCounter = 0;
const uid = () => `f${++uidCounter}`;

function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

const randomSuffix = () => Math.random().toString(36).slice(2, 7);
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
const fileName = (p) => p.split('/').pop();

function allProjects() {
  return [...state.files.personal.projects, ...state.files.clients.projects];
}

function uniqueId(base, except) {
  const taken = new Set(allProjects().filter((p) => p !== except).map((p) => p.id));
  const root = base || 'proyecto';
  let id = root;
  for (let n = 2; taken.has(id); n++) id = `${root}-${n}`;
  return id;
}

/** Sets an optional string field, removing it when empty so the JSON stays clean. */
function setOptional(obj, key, value) {
  if (value === undefined || value === null || String(value).trim() === '') delete obj[key];
  else obj[key] = value;
}

const parseList = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

const listFor = (kind) => (kind === 'personal' ? state.files.personal.projects : state.files.clients.projects);

const assetUrl = (p) => state.previews.get(p) || `/${p}`;

/* ------------------------------------------------------------------ */
/*  Session + API                                                     */
/* ------------------------------------------------------------------ */

const tokenStore = {
  get() { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(TOKEN_KEY, v); } catch { /* sin storage: dura lo que la pestaña */ } },
  clear() { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* idem */ } }
};

class SessionExpired extends Error {}

async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch { data = null; }

  if (res.status === 401 && path !== '/login') {
    showLogin(state.dirty ? 'Tu sesión venció. Volvé a entrar (tus cambios siguen acá).' : 'Tu sesión venció. Volvé a entrar.');
    throw new SessionExpired('Sesión vencida');
  }
  if (!res.ok) throw new Error((data && data.error) || `Error ${res.status}`);
  return data;
}

/* ------------------------------------------------------------------ */
/*  Status, dirty state                                               */
/* ------------------------------------------------------------------ */

function setStatus(text, tone = '') {
  const el = $('status');
  el.textContent = text;
  el.dataset.tone = tone;
}

function updateSaveButton() {
  const btn = $('saveBtn');
  btn.disabled = !state.dirty || state.saving || !state.canWrite;
  btn.textContent = state.saving ? 'Guardando…' : 'Guardar cambios';
}

function markDirty() {
  state.dirty = true;
  updateSaveButton();
  setStatus('Cambios sin guardar', 'warn');
}

window.addEventListener('beforeunload', (e) => {
  if (!state.dirty) return;
  e.preventDefault();
  e.returnValue = '';
});

/* ------------------------------------------------------------------ */
/*  Login / load                                                      */
/* ------------------------------------------------------------------ */

function showLogin(message = '') {
  state.token = null;
  tokenStore.clear();
  $('app').hidden = true;
  $('login').hidden = false;
  $('loginError').textContent = message;
  $('password').value = '';
  $('password').focus();
}

async function enterApp() {
  $('login').hidden = true;
  $('app').hidden = false;
  // After a mid-session re-login, keep the unsaved edits instead of reloading.
  if (state.files.clients && state.dirty) return;
  await loadContent();
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('loginBtn');
  btn.disabled = true;
  $('loginError').textContent = '';
  try {
    const { token } = await api('/login', { method: 'POST', body: { password: $('password').value } });
    state.token = token;
    tokenStore.set(token);
    await enterApp();
  } catch (err) {
    if (!(err instanceof SessionExpired)) $('loginError').textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

$('logoutBtn').addEventListener('click', () => {
  if (state.dirty && !confirm('Tenés cambios sin guardar. ¿Salir igual?')) return;
  state.dirty = false;
  showLogin();
});

async function loadContent() {
  setStatus('Cargando…', 'info');
  try {
    const data = await api('/content');
    state.storage = data.storage;
    state.canWrite = data.canWrite;
    state.files.clients = data.files.clients.data;
    state.files.personal = data.files.personal.data;
    state.shas = { clients: data.files.clients.sha, personal: data.files.personal.sha };
    state.synced = new Map((data.files.synced.data.projects || []).map((p) => [p.id, p]));
    state.media = data.media;
    state.uploads = [];
    state.dirty = false;

    const first = state.files.personal.projects[0] || state.files.clients.projects[0];
    state.selected = first ? { kind: state.files.personal.projects[0] ? 'personal' : 'client', project: first } : null;

    renderNotice();
    renderLists();
    renderEditor();
    updateSaveButton();
    setStatus('');
  } catch (err) {
    if (!(err instanceof SessionExpired)) setStatus(`No se pudo cargar: ${err.message}`, 'error');
  }
}

function renderNotice() {
  const notice = $('notice');
  if (state.storage === 'local') {
    notice.textContent = 'Modo local: los cambios se guardan directo en los archivos de esta carpeta. Después commiteá y pusheá.';
    notice.hidden = false;
  } else if (!state.canWrite) {
    notice.textContent = 'Solo lectura: para guardar falta configurar GITHUB_TOKEN en Vercel (ver README → Panel de administración).';
    notice.hidden = false;
  } else {
    notice.hidden = true;
  }
}

/* ------------------------------------------------------------------ */
/*  Save                                                              */
/* ------------------------------------------------------------------ */

async function save() {
  if (!state.dirty || state.saving || !state.canWrite) return;
  state.saving = true;
  updateSaveButton();
  setStatus('Guardando…', 'info');

  try {
    const result = await api('/content', {
      method: 'PUT',
      body: {
        clients: state.files.clients,
        personal: state.files.personal,
        base: state.shas,
        uploads: state.uploads
      }
    });
    state.shas = result.shas;
    state.uploads = [];
    state.dirty = false;
    state.autoId = new WeakSet(); // once saved, a project's id no longer follows its title
    if (state.storage === 'local') setStatus('Guardado en los archivos locales ✓', 'ok');
    else if (result.unchanged) setStatus('No había cambios para publicar.', 'ok');
    else setStatus('Guardado ✓ El sitio se actualiza en 1–2 minutos.', 'ok');
  } catch (err) {
    if (!(err instanceof SessionExpired)) setStatus(err.message, 'error');
  } finally {
    state.saving = false;
    updateSaveButton();
  }
}

$('saveBtn').addEventListener('click', save);

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    save();
  }
});

/* ------------------------------------------------------------------ */
/*  Project list                                                      */
/* ------------------------------------------------------------------ */

function select(kind, project) {
  state.selected = { kind, project };
  renderLists();
  renderEditor();
  // Side-by-side: back to the top of the form. Stacked (narrow): jump down to the form.
  if (window.matchMedia('(max-width: 900px)').matches) $('editor').scrollIntoView({ behavior: 'smooth' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

function move(kind, index, delta) {
  const list = listFor(kind);
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  markDirty();
  renderLists();
}

function renderLists() {
  renderList($('personalList'), 'personal');
  renderList($('clientList'), 'client');
}

function renderList(el, kind) {
  const list = listFor(kind);
  if (!list.length) {
    el.replaceChildren(h('li', { class: 'project-empty' }, 'Todavía no hay proyectos'));
    return;
  }
  el.replaceChildren(...list.map((p, i) => {
    const active = state.selected && state.selected.project === p;
    return h('li', { class: `project-item${active ? ' is-active' : ''}${p.hidden ? ' is-hidden' : ''}` },
      h('button', { type: 'button', class: 'project-item-main', onclick: () => select(kind, p) },
        h('span', { class: 'project-item-title' }, p.title || 'Sin título'),
        h('span', { class: 'project-item-meta mono' },
          p.hidden ? 'oculto · ' : '',
          kind === 'personal' ? (p.repo || 'falta el repo') : (p.subtitle || p.id))),
      h('span', { class: 'project-item-move' },
        h('button', { type: 'button', class: 'icon-btn', title: 'Subir', 'aria-label': `Subir ${p.title}`, disabled: i === 0, onclick: () => move(kind, i, -1) }, '↑'),
        h('button', { type: 'button', class: 'icon-btn', title: 'Bajar', 'aria-label': `Bajar ${p.title}`, disabled: i === list.length - 1, onclick: () => move(kind, i, 1) }, '↓')));
  }));
}

document.querySelectorAll('[data-add]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const kind = btn.dataset.add;
    const project = kind === 'personal'
      ? { id: uniqueId('nuevo-proyecto'), repo: '', title: 'Nuevo proyecto', gallery: [] }
      : { id: uniqueId('nuevo-proyecto'), title: 'Nuevo proyecto', tags: [], gallery: [] };
    state.autoId.add(project);
    listFor(kind).push(project);
    markDirty();
    select(kind, project);
  });
});

function removeProject(kind, project) {
  if (!confirm(`¿Eliminar "${project.title || project.id}"? Se quita del sitio al guardar. Las imágenes quedan en la biblioteca.`)) return;
  const list = listFor(kind);
  const index = list.indexOf(project);
  list.splice(index, 1);
  const next = list[index] || list[index - 1];
  state.selected = next ? { kind, project: next } : null;
  markDirty();
  renderLists();
  renderEditor();
}

/* ------------------------------------------------------------------ */
/*  Form controls                                                     */
/* ------------------------------------------------------------------ */

function field(label, control, { hint, required, id } = {}) {
  const controlId = id || control.id || '';
  return h('div', { class: 'field' },
    h('label', { for: controlId || undefined }, label, required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null),
    control,
    hint ? h('small', { class: 'hint' }, hint) : null);
}

function textInput(value, onInput, attrs = {}) {
  return h('input', { type: 'text', id: uid(), value: value ?? '', oninput: (e) => onInput(e.target.value), ...attrs });
}

function textArea(value, onInput, rows = 3) {
  return h('textarea', { id: uid(), rows, value: value ?? '', oninput: (e) => onInput(e.target.value) });
}

function listInput(values, onChange, placeholder) {
  return textInput((values || []).join(', '), (v) => onChange(parseList(v)), { placeholder });
}

function iconBtn(label, title, disabled, onclick) {
  return h('button', { type: 'button', class: 'icon-btn', title, 'aria-label': title, disabled, onclick }, label);
}

/** Rows of { title, text }. Re-renders on add/remove/move; typing doesn't re-render (keeps focus). */
function featuresEditor(initial, onChange) {
  const items = (initial || []).map((f) => ({ ...f }));
  const wrap = h('div', { class: 'features' });
  const emit = () => onChange(items.map((f) => ({ ...f })));

  const render = () => {
    wrap.replaceChildren(
      ...items.map((f, i) => h('div', { class: 'feature-row' },
        h('div', { class: 'feature-fields' },
          h('input', { type: 'text', value: f.title || '', placeholder: 'Título corto', 'aria-label': `Funcionalidad ${i + 1}: título`, oninput: (e) => { items[i].title = e.target.value; emit(); } }),
          h('textarea', { rows: 2, value: f.text || '', placeholder: 'Una oración que la explique', 'aria-label': `Funcionalidad ${i + 1}: texto`, oninput: (e) => { items[i].text = e.target.value; emit(); } })),
        h('div', { class: 'row-actions' },
          iconBtn('↑', 'Subir', i === 0, () => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; emit(); render(); }),
          iconBtn('↓', 'Bajar', i === items.length - 1, () => { [items[i + 1], items[i]] = [items[i], items[i + 1]]; emit(); render(); }),
          iconBtn('×', 'Quitar', false, () => { items.splice(i, 1); emit(); render(); })))),
      h('button', { type: 'button', class: 'btn small', onclick: () => { items.push({ title: '', text: '' }); emit(); render(); wrap.querySelector('.feature-row:last-of-type input')?.focus(); } }, '+ Agregar funcionalidad'));
  };
  render();
  return wrap;
}

function thumb(path) {
  if (VIDEO_RE.test(path)) return h('div', { class: 'thumb thumb-video' }, h('span', {}, '▶'), h('small', { class: 'mono' }, fileName(path)));
  return h('div', { class: 'thumb' }, h('img', { src: assetUrl(path), alt: '', loading: 'lazy' }));
}

/* ------------------------------------------------------------------ */
/*  Uploads + media library                                           */
/* ------------------------------------------------------------------ */

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(blob);
  });
}

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/** PNG/JPG/WebP → resized WebP; GIF/AVIF/videos untouched. */
async function prepareFile(file) {
  if (file.type === 'video/mp4' || file.type === 'video/webm') return { blob: file, ext: file.type.split('/')[1] };
  if (file.type === 'image/gif' || file.type === 'image/avif') return { blob: file, ext: file.type.split('/')[1] };
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error(`${file.name}: formato no soportado (usá PNG, JPG, WebP, GIF, AVIF, MP4 o WebM).`);
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (bitmap.close) bitmap.close();

  const webp = await canvasToBlob(canvas, 'image/webp', 0.86);
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp' };
  return { blob: await canvasToBlob(canvas, 'image/jpeg', 0.86), ext: 'jpg' };
}

async function uploadFiles(files, project) {
  const paths = [];
  for (const [i, file] of files.entries()) {
    setStatus(`Subiendo ${i + 1}/${files.length}: ${file.name}…`, 'info');
    try {
      const { blob, ext } = await prepareFile(file);
      if (blob.size > MAX_UPLOAD_BYTES) {
        throw new Error(`${file.name} pesa ${mb(blob.size)} MB y el máximo desde el panel es 3 MB.${VIDEO_RE.test(`.${ext}`) ? ' Comprimí el video (por ejemplo con HandBrake) y probá de nuevo.' : ''}`);
      }
      const dataUrl = await blobToDataUrl(blob);
      const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'archivo';
      const path = `assets/projects/${slugify(project.id) || 'proyecto'}/${base}-${randomSuffix()}.${ext}`;
      const staged = await api('/upload', { method: 'POST', body: { path, data: dataUrl.slice(dataUrl.indexOf(',') + 1) } });

      state.uploads.push(staged);
      if (!VIDEO_RE.test(path)) state.previews.set(path, dataUrl);
      state.media.push({ path, size: blob.size });
      paths.push(path);
    } catch (err) {
      if (!(err instanceof SessionExpired)) setStatus(err.message, 'error');
      if (paths.length) markDirty();
      return paths;
    }
  }
  markDirty();
  setStatus(`${paths.length} archivo(s) listo(s) — se publican al guardar.`, 'info');
  return paths;
}

function chooseFiles({ video, multiple }) {
  return new Promise((resolve) => {
    const input = h('input', {
      type: 'file',
      accept: video ? 'video/mp4,video/webm' : 'image/png,image/jpeg,image/webp,image/gif,image/avif',
      multiple
    });
    input.addEventListener('change', () => resolve([...input.files]));
    input.addEventListener('cancel', () => resolve([]));
    input.click();
  });
}

let mediaResolve = null;

function pickFromLibrary({ video }) {
  const dialog = $('mediaDialog');
  const items = state.media
    .filter((m) => VIDEO_RE.test(m.path) === !!video)
    .sort((a, b) => a.path.localeCompare(b.path));

  $('mediaDialogTitle').textContent = video ? 'Biblioteca · videos' : 'Biblioteca · imágenes';
  $('mediaGrid').replaceChildren(...(items.length
    ? items.map((m) => h('button', { type: 'button', class: 'media-item', onclick: () => closeLibrary(m.path) },
        thumb(m.path),
        h('span', { class: 'mono' }, m.path.replace('assets/projects/', ''))))
    : [h('p', { class: 'muted' }, 'Todavía no hay archivos de este tipo.')]));

  return new Promise((resolve) => {
    mediaResolve = resolve;
    dialog.showModal();
  });
}

function closeLibrary(value = null) {
  const dialog = $('mediaDialog');
  if (dialog.open) dialog.close();
  if (mediaResolve) mediaResolve(value);
  mediaResolve = null;
}

$('mediaDialogClose').addEventListener('click', () => closeLibrary(null));
$('mediaDialog').addEventListener('close', () => closeLibrary(null));

/* ------------------------------------------------------------------ */
/*  Editor                                                            */
/* ------------------------------------------------------------------ */

function rerender() {
  const y = window.scrollY;
  renderLists();
  renderEditor();
  window.scrollTo(0, y);
}

function section(title, body, hint) {
  return h('section', { class: 'editor-section' },
    h('h2', { class: 'mono' }, title),
    hint ? h('p', { class: 'section-hint' }, hint) : null,
    body);
}

function renderEditor() {
  const editor = $('editor');
  const sel = state.selected;
  if (!sel) {
    editor.replaceChildren(h('p', { class: 'editor-empty' }, 'Elegí un proyecto de la lista o creá uno nuevo.'));
    return;
  }

  const { kind, project: p } = sel;
  const personal = kind === 'personal';

  editor.replaceChildren(...[
    h('div', { class: 'editor-head' },
      h('div', {},
        h('span', { class: 'eyebrow mono' }, personal ? 'Proyecto personal · destacado' : 'Trabajo de cliente'),
        h('h1', { id: 'editorTitle' }, p.title || 'Sin título')),
      h('div', { class: 'editor-head-actions' },
        h('label', { class: 'toggle' },
          h('input', { type: 'checkbox', checked: !p.hidden, onchange: (e) => { setOptional(p, 'hidden', e.target.checked ? null : true); markDirty(); renderLists(); } }),
          h('span', {}, 'Visible en el sitio')),
        h('button', { type: 'button', class: 'btn danger small', onclick: () => removeProject(kind, p) }, 'Eliminar'))),
    section('Datos básicos', basicFields(kind, p)),
    section('Imágenes y video', mediaFields(p)),
    section('Contenido', personal ? personalContent(p) : clientContent(p),
      personal ? 'La sincronización con el repo mantiene estos textos al día. Si editás uno, queda "Fijado a mano" y la sync deja de tocarlo.' : null),
    personal ? section('Instrucciones para la IA', aiFields(p), 'No se muestran en el sitio: solo orientan al resumen automático.') : null,
    personal ? section('Sincronización', syncInfo(p)) : null
  ].filter(Boolean));
}

function basicFields(kind, p) {
  const idInput = textInput(p.id, () => {}, { spellcheck: 'false' });
  idInput.addEventListener('change', (e) => {
    state.autoId.delete(p);
    p.id = uniqueId(slugify(e.target.value), p);
    e.target.value = p.id;
    markDirty();
    renderLists();
  });

  const fields = [
    field('Título', textInput(p.title, (v) => {
      p.title = v;
      if (state.autoId.has(p)) {
        p.id = uniqueId(slugify(v), p);
        idInput.value = p.id;
      }
      $('editorTitle').textContent = v || 'Sin título';
      markDirty();
      renderLists();
    }), { required: true }),
    field('Subtítulo', textInput(p.subtitle, (v) => { setOptional(p, 'subtitle', v); markDirty(); renderLists(); }),
      { hint: kind === 'personal' ? 'Ej.: "App de estadísticas — CS2 5v5"' : 'Ej.: "Landing - Restaurante"' }),
    field('Link del sitio', textInput(p.link, (v) => { setOptional(p, 'link', v.trim()); markDirty(); }, { type: 'url', placeholder: 'https://…' }),
      { hint: 'Para el botón "Visitar sitio". Vacío = sin botón.' })
  ];

  if (kind === 'personal') {
    fields.push(
      field('Repositorio de GitHub', textInput(p.repo, (v) => { p.repo = v.trim(); markDirty(); renderLists(); }, { placeholder: 'usuario/repositorio', spellcheck: 'false' }),
        { required: true, hint: 'De acá salen el resumen automático y los últimos cambios. No se muestra en el sitio.' }),
      field('Rama', textInput(p.branch, (v) => { setOptional(p, 'branch', v.trim()); markDirty(); }, { placeholder: 'main', spellcheck: 'false' }),
        { hint: 'Vacío = la rama principal del repo.' })
    );
  }

  fields.push(field('ID', idInput, { hint: 'Minúsculas y guiones. Si lo cambiás, se reinician los likes y vistas del proyecto.' }));
  return h('div', { class: 'grid-2' }, fields);
}

function mediaPicker({ value, video, project, onChange, emptyLabel }) {
  return h('div', { class: 'media-picker' },
    value ? thumb(value) : h('div', { class: 'thumb thumb-empty' }, h('span', {}, emptyLabel)),
    h('div', { class: 'media-picker-info' },
      value ? h('code', { class: 'mono' }, value) : null,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn small', onclick: async () => {
          const files = await chooseFiles({ video, multiple: false });
          if (!files.length) return;
          const [path] = await uploadFiles(files, project);
          if (path) onChange(path);
        } }, video ? 'Subir video' : 'Subir imagen'),
        h('button', { type: 'button', class: 'btn small', onclick: async () => {
          const path = await pickFromLibrary({ video });
          if (path) onChange(path);
        } }, 'Elegir de la biblioteca'),
        value ? h('button', { type: 'button', class: 'btn small ghost', onclick: () => onChange('') }, 'Quitar') : null)));
}

function mediaFields(p) {
  const changed = () => { markDirty(); rerender(); };
  const gallery = p.gallery || (p.gallery = []);

  const galleryGrid = gallery.length
    ? h('div', { class: 'gallery-grid' }, gallery.map((path, i) => h('figure', { class: `gallery-item${p.image === path ? ' is-cover' : ''}` },
        thumb(path),
        h('figcaption', { class: 'gallery-actions' },
          iconBtn('←', 'Mover a la izquierda', i === 0, () => { [gallery[i - 1], gallery[i]] = [gallery[i], gallery[i - 1]]; changed(); }),
          iconBtn('→', 'Mover a la derecha', i === gallery.length - 1, () => { [gallery[i + 1], gallery[i]] = [gallery[i], gallery[i + 1]]; changed(); }),
          iconBtn('★', p.image === path ? 'Es la portada' : 'Usar como portada', p.image === path, () => { p.image = path; changed(); }),
          iconBtn('×', 'Quitar de la galería', false, () => { gallery.splice(i, 1); changed(); })))))
    : h('p', { class: 'muted' }, 'Sin capturas todavía.');

  return h('div', { class: 'media-fields' },
    field('Portada', mediaPicker({
      value: p.image, project: p, emptyLabel: 'Sin portada',
      onChange: (v) => { setOptional(p, 'image', v); changed(); }
    }), { hint: 'Se ve en la tarjeta y arriba del detalle. Ideal 1600×900 o más; se recorta desde arriba al centro.' }),

    h('div', { class: 'field' },
      h('label', {}, 'Galería'),
      galleryGrid,
      h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn small', onclick: async () => {
          const files = await chooseFiles({ video: false, multiple: true });
          if (!files.length) return;
          const paths = await uploadFiles(files, p);
          gallery.push(...paths);
          if (!p.image && paths[0]) p.image = paths[0];
          rerender();
        } }, 'Subir imágenes'),
        h('button', { type: 'button', class: 'btn small', onclick: async () => {
          const path = await pickFromLibrary({ video: false });
          if (path && !gallery.includes(path)) { gallery.push(path); changed(); }
        } }, 'Agregar de la biblioteca')),
      h('small', { class: 'hint' }, 'Capturas del detalle del proyecto. ★ la usa de portada. Las imágenes se convierten a WebP y se achican solas.')),

    field('Video', mediaPicker({
      value: p.video, video: true, project: p, emptyLabel: 'Sin video',
      onChange: (v) => { setOptional(p, 'video', v); changed(); }
    }), { hint: 'Opcional: suma el botón "Ver video". MP4 o WebM de hasta 3 MB.' })
  );
}

function clientContent(p) {
  return h('div', { class: 'content-fields' },
    field('Resumen', textArea(p.summary, (v) => { setOptional(p, 'summary', v); markDirty(); }, 2),
      { hint: 'Una o dos oraciones: aparece en negrita al abrir el proyecto.' }),
    field('Descripción', textArea(p.description, (v) => { setOptional(p, 'description', v); markDirty(); }, 7)),
    field('Tags', listInput(p.tags, (list) => { p.tags = list; markDirty(); }, 'Landing, SEO técnico, WooCommerce'),
      { hint: 'Separadas por comas. Se ven en la tarjeta.' }),
    h('div', { class: 'field' },
      h('label', {}, 'Funcionalidades'),
      featuresEditor(p.features, (list) => { setOptional(p, 'features', list.length ? list : null); markDirty(); }),
      h('small', { class: 'hint' }, 'Opcional: tarjetitas con ✓ dentro del detalle.')));
}

/** A content field of a personal project, with its auto/manual state. */
function pinnableField(p, name, label, buildControl, hint) {
  const synced = state.synced.get(p.id);
  const { value, source } = resolveContentField(p, synced, name);

  const badge = h('span', { class: `badge${source === 'manual' ? ' badge-manual' : ''}` }, SOURCE_LABELS[source]);
  const reset = h('button', {
    type: 'button', class: 'link-btn', hidden: source !== 'manual',
    onclick: () => {
      delete p.overrides[name];
      if (!Object.keys(p.overrides).length) delete p.overrides;
      markDirty();
      rerender();
    }
  }, '↺ Volver a automático');

  const control = buildControl(value, (next) => {
    p.overrides = p.overrides || {};
    p.overrides[name] = next;
    badge.textContent = SOURCE_LABELS.manual;
    badge.classList.add('badge-manual');
    reset.hidden = false;
    markDirty();
  });

  return h('div', { class: 'field' },
    h('div', { class: 'field-label-row' },
      h('label', { for: control.id || undefined }, label),
      badge,
      reset),
    control,
    hint ? h('small', { class: 'hint' }, hint) : null);
}

function personalContent(p) {
  return h('div', { class: 'content-fields' },
    pinnableField(p, 'summary', 'Resumen', (v, set) => textArea(v, set, 2), 'Se ve en la tarjeta y en negrita en el detalle.'),
    pinnableField(p, 'description', 'Descripción', (v, set) => textArea(v, set, 7)),
    pinnableField(p, 'tags', 'Tags', (v, set) => listInput(v, set, 'Dashboard de datos, IA / OCR'), 'Separadas por comas.'),
    pinnableField(p, 'stack', 'Stack', (v, set) => listInput(v, set, 'Next.js 16, Supabase'), 'Separado por comas.'),
    pinnableField(p, 'features', 'Funcionalidades', (v, set) => featuresEditor(v, set)));
}

function aiFields(p) {
  const ai = () => (p.ai = p.ai || {});
  const tidy = () => { if (p.ai && !Object.keys(p.ai).length) delete p.ai; };
  return h('div', { class: 'content-fields' },
    field('Notas para la IA', textArea(p.ai && p.ai.notes, (v) => { setOptional(ai(), 'notes', v); tidy(); markDirty(); }, 4),
      { hint: 'Contexto del proyecto, qué destacar, chistes internos que conviene no explicar…' }),
    field('Archivos de contexto', listInput(p.ai && p.ai.contextFiles, (list) => { setOptional(ai(), 'contextFiles', list.length ? list : null); tidy(); markDirty(); }, 'docs/arquitectura.md, lib/novedades.ts'),
      { hint: 'Archivos del repo que conviene que lea (separados por comas). El README se lee siempre.' }));
}

function syncInfo(p) {
  const s = state.synced.get(p.id);
  if (!s) {
    return h('p', { class: 'muted' }, 'Todavía no se sincronizó. Después de guardar, la sincronización automática lo procesa en unos minutos.');
  }
  const when = s.syncedAt ? new Date(s.syncedAt).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const analysis = s.analysis && s.analysis.mode === 'ai' ? `Con IA (${s.analysis.model})` : 'A partir de los commits (sin IA)';
  const repo = s.repo ? `${s.repo.commits ?? '—'} commits${s.repo.version ? ` · v${s.repo.version}` : ''}` : '—';
  return h('dl', { class: 'sync-info' },
    h('dt', {}, 'Última actualización'), h('dd', {}, when),
    h('dt', {}, 'Resumen'), h('dd', {}, analysis),
    h('dt', {}, 'Repositorio'), h('dd', {}, repo),
    h('dt', {}, 'Últimos cambios'),
    h('dd', {}, (s.changelog || []).length
      ? h('ul', {}, s.changelog.slice(0, 4).map((e) => h('li', {}, h('span', { class: 'mono' }, e.date), ` — ${e.title}`)))
      : '—'));
}

/* ------------------------------------------------------------------ */
/*  Boot                                                              */
/* ------------------------------------------------------------------ */

const savedToken = tokenStore.get();
if (savedToken) {
  state.token = savedToken;
  enterApp();
} else {
  showLogin();
}
