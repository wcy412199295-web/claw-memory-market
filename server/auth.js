import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'claw-memory-market-dev-secret-change-in-prod';
const EXPIRES_IN = '7d';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

/**
 * Express middleware — extracts user from Authorization header.
 * Sets req.user = { id, username } or null.
 */
export function authMiddleware(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(header.slice(7));
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

/**
 * Guard — returns 401 if not authenticated.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
