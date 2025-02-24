// server/routes/contests.js
const express = require('express');
const router = express.Router();
const {
  getContests,
  addContest,
  updateContest,
  deleteContest,
  getPlatforms,
  getContestStats
} = require('../controllers/contests');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Main routes
router.route('/')
  .get(getContests)
  .post(addContest);

router.route('/:id')
  .put(updateContest)
  .delete(deleteContest);

// Additional routes
router.get('/platforms', getPlatforms);
router.get('/stats', getContestStats);

module.exports = router;