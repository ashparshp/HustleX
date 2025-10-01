const express = require("express");
const router = express.Router();
const {
  getInsights,
  getRecommendations,
  queryData,
  getScheduleSuggestions,
  analyzeSkills,
  getWeeklyReport,
  chat,
} = require("../controllers/ai");
const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// AI Insights and Analysis
router.post("/insights", getInsights);
router.post("/recommendations", getRecommendations);
router.post("/query", queryData);
router.post("/chat", chat);

// Specific AI Features
router.post("/schedule-suggestions", getScheduleSuggestions);
router.post("/skill-analysis", analyzeSkills);
router.post("/weekly-report", getWeeklyReport);

module.exports = router;
