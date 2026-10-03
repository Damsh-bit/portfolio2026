/**
 * =========================================================================
 * PROJECTS STORE
 * =========================================================================
 * Single list of projects the UI renders, in page order:
 *  1. Personal projects — config (content/personal-projects.config.json)
 *     merged with what the GitHub sync wrote (data/personal-projects.json).
 *  2. Client work — content/client-projects.json.
 *
 * All three are static JSON files on the same origin, edited from /admin
 * (or by the sync Action). If one fails to load, the rest still render.
 */

import { composeClientProject, composePersonalProject } from './project-model.js';

const CLIENTS_URL = 'content/client-projects.json';
const PERSONAL_CONFIG_URL = 'content/personal-projects.config.json';
const PERSONAL_SYNCED_URL = 'data/personal-projects.json';
const LOAD_TIMEOUT_MS = 4000;

let projects = [];
let personalLoaded = false;

async function fetchJson(url, signal) {
  const res = await fetch(url, { signal, cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

/** Loads every project source. Never rejects: whatever fails is left out. */
export async function loadProjects() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);

  const [clients, personalConfig, personalSynced] = await Promise.allSettled([
    fetchJson(CLIENTS_URL, controller.signal),
    fetchJson(PERSONAL_CONFIG_URL, controller.signal),
    fetchJson(PERSONAL_SYNCED_URL, controller.signal)
  ]);
  clearTimeout(timer);

  for (const result of [clients, personalConfig, personalSynced]) {
    if (result.status === 'rejected') console.warn('No se pudo cargar una fuente de proyectos:', result.reason);
  }

  const syncedById = new Map(
    (personalSynced.status === 'fulfilled' ? personalSynced.value.projects || [] : []).map((p) => [p.id, p])
  );

  const personal = personalConfig.status === 'fulfilled'
    ? (personalConfig.value.projects || [])
        .filter((cfg) => !cfg.hidden)
        .map((cfg) => composePersonalProject(cfg, syncedById.get(cfg.id)))
    : [];
  personalLoaded = personalConfig.status === 'fulfilled';

  const clientWork = clients.status === 'fulfilled'
    ? (clients.value.projects || []).filter((p) => !p.hidden).map(composeClientProject)
    : [];

  projects = [...personal, ...clientWork];
  return projects;
}

export const getProjects = () => projects;

export const isPersonalLoaded = () => personalLoaded;
