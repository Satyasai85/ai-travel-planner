const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const {
  generateTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  regenerateDay,
} = require('../controllers/tripController');

// Every trip route is protected — the auth middleware guarantees req.user.id.
router.use(auth);

router.route('/').get(getTrips).post(generateTrip);

router.route('/:id').get(getTripById).put(updateTrip).delete(deleteTrip);

router.post('/:id/days/:dayNumber/regenerate', regenerateDay);

module.exports = router;
