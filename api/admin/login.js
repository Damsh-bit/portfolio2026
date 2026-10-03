/**
 * POST /api/admin/login  { password } → { token, expiresIn }
 */

import { checkPassword, issueToken } from '../_lib/auth.js';
import { allowMethods, noStore } from '../_lib/http.js';

const FAILED_LOGIN_DELAY_MS = 900;

export default async function handler(req, res) {
  noStore(res);
  if (!allowMethods(req, res, ['POST'])) return;

  const password = req.body && req.body.password;
  if (!checkPassword(password)) {
    // Slows down guessing; there's no state to lock accounts with.
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    res.status(401).json({ error: 'Contraseña incorrecta' });
    return;
  }

  res.status(200).json(issueToken());
}
