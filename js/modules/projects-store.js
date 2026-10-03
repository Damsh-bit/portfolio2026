/**
 * =========================================================================
 * PROJECTS STORE
 * =========================================================================
 * Single list of projects the UI renders, in page order:
 *  1. Client work — hand-written in js/data/portfolio-data.js.
 *  2. Personal projects — synced from their GitHub repos into
 *     data/personal-projects.json by scripts/sync-projects.mjs (a GitHub
 *     Action keeps it fresh), so they update themselves on every push.
 *
 * The personal JSON is a static file on the same origin; if it can't be
 * loaded the site still renders with the client work alone.
 */

import { portfolioData } from '../data/portfolio-data.js';

const PERSONAL_DATA_URL = 'data/personal-projects.json';
const LOAD_TIMEOUT_MS = 4000;

const clientProjects = portfolioData.projects.map((p) => ({ ...p, type: p.type || 'trabajo' }));

let projects = clientProjects;
let personalLoaded = false;

/** Fetches the synced personal projects. Never rejects: on failure the list stays client-only. */
export async function loadProjects() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS);

  try {
    const res = await fetch(PERSONAL_DATA_URL, { signal: controller.signal, cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const personal = (data.projects || []).map((p) => ({
      ...p,
      type: 'personal',
      tags: p.tags || [],
      features: p.features || [],
      changelog: p.changelog || []
    }));
    projects = [...clientProjects, ...personal];
    personalLoaded = true;
  } catch (err) {
    console.warn('No se pudieron cargar los proyectos personales:', err);
  } finally {
    clearTimeout(timer);
  }

  return projects;
}

export const getProjects = () => projects;

export const isPersonalLoaded = () => personalLoaded;
