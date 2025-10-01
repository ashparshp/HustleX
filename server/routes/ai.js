const express = require("express");
const router = express.Router();
const {
  getInsights,
  getRecommendations,
  queryData,
  getScheduleSuggestions,
  analyzeSkills,
  getWeeklyReport,
  chat
} = require("../controllers/ai");
const { protect } = require("../middleware/auth");


router.use(protect);


router.post("/insights", getInsights);
router.post("/recommendations", getRecommendations);
router.post("/query", queryData);
router.post("/chat", chat);


router.post("/schedule-suggestions", getScheduleSuggestions);
router.post("/skill-analysis", analyzeSkills);
router.post("/weekly-report", getWeeklyReport);

module.exports = router;