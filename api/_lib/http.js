/** Small helpers shared by the /api/admin handlers. */

export function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}

/** Ends with 405 unless the method is one of `allowed`. */
export function allowMethods(req, res, allowed) {
  if (allowed.includes(req.method)) return true;
  res.setHeader('Allow', allowed.join(', '));
  res.status(405).json({ error: `Método ${req.method} no permitido` });
  return false;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Runs a handler body and turns thrown errors into JSON responses. */
export async function respond(res, fn) {
  try {
    await fn();
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message || 'Error inesperado' });
  }
}
