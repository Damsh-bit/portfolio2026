/**
 * =========================================================================
 * PROJECT MODEL
 * =========================================================================
 * Shared by the site (projects-store.js), the admin panel and the GitHub
 * sync script, so the "which value wins" rules live in one place.
 *
 * A personal project is built from two sources:
 *  - its config entry (content/personal-projects.config.json), written by
 *    hand or from /admin: presentation fields plus optional `overrides`
 *    (content the author pinned) and `seed` (initial content);
 *  - its synced entry (data/personal-projects.json), written by the sync:
 *    AI/commit-derived content, changelog and repo stats.
 *
 * Precedence for content fields: overrides → synced → seed.
 */

export const PRESENTATION_FIELDS = ['title', 'subtitle', 'link', 'image', 'video', 'gallery'];
export const CONTENT_FIELDS = ['summary', 'description', 'tags', 'stack', 'features'];

const EMPTY_CONTENT = { summary: '', description: '', tags: [], stack: [], features: [] };

/** Effective value of one content field and where it came from. */
export function resolveContentField(cfg, synced, field) {
  if (cfg.overrides && cfg.overrides[field] !== undefined) return { value: cfg.overrides[field], source: 'manual' };
  if (synced && synced[field] !== undefined) return { value: synced[field], source: 'auto' };
  if (cfg.seed && cfg.seed[field] !== undefined) return { value: cfg.seed[field], source: 'seed' };
  return { value: EMPTY_CONTENT[field], source: 'empty' };
}

export function composePersonalProject(cfg, synced) {
  const project = { id: cfg.id, type: 'personal' };
  for (const field of PRESENTATION_FIELDS) {
    if (cfg[field] !== undefined) project[field] = cfg[field];
  }
  for (const field of CONTENT_FIELDS) {
    project[field] = resolveContentField(cfg, synced, field).value;
  }
  project.changelog = (synced && synced.changelog) || [];
  project.repo = (synced && synced.repo) || null;
  project.analysis = (synced && synced.analysis) || null;
  return project;
}

export function composeClientProject(entry) {
  return {
    tags: [],
    gallery: [],
    features: [],
    ...entry,
    type: 'trabajo'
  };
}
