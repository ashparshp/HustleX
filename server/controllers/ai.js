const aiService = require("../services/aiService");






exports.getInsights = async (req, res) => {
  try {
    const { detailLevel = "detailed" } = req.body;
    const insights = await aiService.generateInsights(req.user.id, detailLevel);

    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error("Error in getInsights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate insights",
      error: error.message
    });
  }
};






exports.getRecommendations = async (req, res) => {
  try {
    const { focusArea } = req.body;
    const recommendations = await aiService.getRecommendations(
      req.user.id,
      focusArea
    );

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error("Error in getRecommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate recommendations",
      error: error.message
    });
  }
};






exports.queryData = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required"
      });
    }

    const result = await aiService.queryUserData(req.user.id, question);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error in queryData:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process query",
      error: error.message
    });
  }
};






exports.getScheduleSuggestions = async (req, res) => {
  try {
    const suggestions = await aiService.generateScheduleSuggestions(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error("Error in getScheduleSuggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate schedule suggestions",
      error: error.message
    });
  }
};






exports.analyzeSkills = async (req, res) => {
  try {
    const analysis = await aiService.analyzeSkillProgress(req.user.id);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error("Error in analyzeSkills:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze skills",
      error: error.message
    });
  }
};






exports.getWeeklyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const report = await aiService.generateWeeklyReport(
      req.user.id,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error("Error in getWeeklyReport:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate weekly report",
      error: error.message
    });
  }
};






exports.chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    console.log("Chat controller: Processing message:", message);
    console.log("Chat controller: User ID:", req.user.id);


    const result = await aiService.queryUserData(req.user.id, message);

    console.log("Chat controller: Result from service:", result);

    res.status(200).json({
      success: true,
      data: {
        userMessage: message,
        aiResponse: result.answer
      }
    });
  } catch (error) {
    console.error("Error in chat:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to process chat message",
      error: error.message
    });
  }
};