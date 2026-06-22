const User = require('../models/User');
const { signToken } = require('../utils/token');

/** Shape the user object returned to the client (never includes the hash). */
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

/**
 * POST /api/auth/register
 * Creates a new account, hashes the password (handled in the model), returns a JWT.
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    return res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/auth/login
 * Verifies credentials against the stored hash and returns a JWT on success.
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Password has select:false, so explicitly select it for comparison.
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user (protected route).
 */
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};
