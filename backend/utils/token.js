const jwt = require('jsonwebtoken');

/** Sign a short-lived JWT carrying only the user id. */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = { signToken };
