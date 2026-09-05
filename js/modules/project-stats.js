/**
 * =========================================================================
 * PROJECT STATS (likes + views)
 * =========================================================================
 * Talks directly to a Supabase Postgres REST endpoint — no SDK needed,
 * just two RPC calls guarded by SECURITY DEFINER functions server-side
 * (the client can only ever +1 a view or toggle a like, nothing else).
 * Counts are shared globally across every visitor; "liked" state and
 * "already counted this session" are remembered per-browser via
 * localStorage/sessionStorage.
 */

const SUPABASE_URL = 'https://ieqaombgxdqagtdyhwqq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cQj9ix4U6MB1ufJalAxgUw_Nx_7R0wX';

const LIKED_KEY = 'pf_liked_projects';
const VIEWED_KEY = 'pf_viewed_session';

function readJSON(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — degrade silently, feature just won't persist */
  }
}

export function isLiked(projectId) {
  const liked = readJSON(localStorage, LIKED_KEY, {});
  return !!liked[projectId];
}

function setLikedLocal(projectId, liked) {
  const map = readJSON(localStorage, LIKED_KEY, {});
  if (liked) map[projectId] = true;
  else delete map[projectId];
  writeJSON(localStorage, LIKED_KEY, map);
}

function hasViewedThisSession(projectId) {
  const seen = readJSON(sessionStorage, VIEWED_KEY, {});
  return !!seen[projectId];
}

function markViewedThisSession(projectId) {
  const seen = readJSON(sessionStorage, VIEWED_KEY, {});
  seen[projectId] = true;
  writeJSON(sessionStorage, VIEWED_KEY, seen);
}

async function callRpc(fn, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${fn} failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] || { views: 0, likes: 0 };
}

/** Fetches current counts without mutating anything. */
export async function fetchStats(projectId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/portfolio_project_stats?project_id=eq.${encodeURIComponent(projectId)}&select=views,likes`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) throw new Error(`fetchStats failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] || { views: 0, likes: 0 };
}

/** Registers a view once per project per browser session, then resolves
 *  with the current counts either way. */
export async function registerView(projectId) {
  if (hasViewedThisSession(projectId)) {
    return fetchStats(projectId);
  }
  markViewedThisSession(projectId);
  return callRpc('portfolio_increment_view', { p_project_id: projectId });
}

/** Flips the local liked flag, tells the server, and returns { liked, views, likes }. */
export async function toggleLike(projectId) {
  const nextLiked = !isLiked(projectId);
  setLikedLocal(projectId, nextLiked);
  try {
    const stats = await callRpc('portfolio_toggle_like', { p_project_id: projectId, p_like: nextLiked });
    return { liked: nextLiked, ...stats };
  } catch (err) {
    setLikedLocal(projectId, !nextLiked);
    throw err;
  }
}
