// server/routes/schedule.js
const express = require("express");
const router = express.Router();
const {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  addScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
  getScheduleCategories,
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate
} = require("../controllers/schedule");
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Schedule routes
router.route('/')
  .get(getSchedules)
  .post(createSchedule);

router.route('/:id')
  .get(getSchedule)
  .put(updateSchedule)
  .delete(deleteSchedule);

// Schedule item routes
router.route('/:id/items')
  .post(addScheduleItem);

router.route('/:id/items/:itemId')
  .put(updateScheduleItem)
  .delete(deleteScheduleItem);

// Category routes
router.get('/categories', getScheduleCategories);

// Template routes
router.route('/templates')
  .get(getTemplates)
  .post(createTemplate);

router.route('/templates/:id')
  .get(getTemplate)
  .put(updateTemplate)
  .delete(deleteTemplate);

module.exports = router;