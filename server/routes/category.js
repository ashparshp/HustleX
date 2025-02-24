// server/routes/category.js
const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getDefaultCategories
} = require('../controllers/category');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Routes
router.route('/')
  .get(getCategories)
  .post(createCategory);

router.route('/:id')
  .put(updateCategory)
  .delete(deleteCategory);

router.get('/defaults/:type', getDefaultCategories);

module.exports = router;