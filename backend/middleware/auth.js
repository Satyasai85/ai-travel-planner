const jwt = require('jsonwebtoken');

/**
 * JWT verification middleware.
 *
 * Reads the bearer token from the Authorization header, verifies it against the
 * server secret, and attaches the decoded payload to `req.user`.
 *
 * The signed payload always contains `{ id }`, so downstream controllers can use
 * `req.user.id` to scope every query to the authenticated user — this is the
 * cornerstone of strict multi-user data isolation.
 */
module.exports = function auth(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Access denied. Missing or malformed authorization token.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // { id, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired security token.' });
  }
};
