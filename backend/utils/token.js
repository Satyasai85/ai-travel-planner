const jwt = require('jsonwebtoken');

// The payload is intentionally minimal — only the user id — so the token stays
// small and never leaks sensitive profile data.
/** Sign a short-lived JWT carrying only the user id. */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = { signToken };
