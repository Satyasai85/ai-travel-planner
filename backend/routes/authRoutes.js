const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const { register, login, me } = require('../controllers/authController');

// Public endpoints (register, login) issue a JWT; /me is protected and echoes
// back the currently authenticated user.
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me); // protected

module.exports = router;
