const { GoogleGenAI } = require("@google/genai");
const Schedule = require("../models/Schedule");
const Skills = require("../models/Skills");
const Timetable = require("../models/Timetable");
const WorkingHours = require("../models/WorkingHours");

// Initialize Gemini AI with API key
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Get user's complete data from database with optional date filtering
 */
const getUserData = async (userId, options = {}) => {
  try {
    const { startDate, endDate, includeHistory = true } = options;

    // Build query filters
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate);
    }

    const [schedules, skills, timetables, workingHours] = await Promise.all([
      Schedule.find({ user: userId, ...dateFilter })
        .sort({ date: -1 })
        .lean(),
      Skills.find({ user: userId }).lean(),
      Timetable.find({ user: userId }).lean(),
      WorkingHours.find({ user: userId, ...dateFilter })
        .sort({ date: -1 })
        .lean(),
    ]);

    return {
      schedules,
      skills,
      timetables,
      workingHours,
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

/**
 * Format user data for AI context
 */
const formatUserDataForAI = (userData) => {
  const { schedules, skills, timetables, workingHours } = userData;

  let context = "User's Productivity Data:\n\n";

  // Schedules
  if (schedules && schedules.length > 0) {
    context += "SCHEDULES:\n";
    schedules.forEach((schedule, index) => {
      context += `${index + 1}. Date: ${new Date(
        schedule.date
      ).toLocaleDateString()}\n`;
      context += `   Day Type: ${schedule.dayType}\n`;
      context += `   Status: ${schedule.status}\n`;
      context += `   Total Hours: ${schedule.totalHours || 0}\n`;
      if (schedule.items && schedule.items.length > 0) {
        context += `   Tasks (${schedule.items.length}):\n`;
        schedule.items.forEach((item, i) => {
          context += `     - ${item.title} (${item.startTime}-${item.endTime})\n`;
          context += `       Category: ${item.category}, Priority: ${item.priority}, Completed: ${item.completed}\n`;
        });
      }
      context += "\n";
    });
  }

  // Skills
  if (skills && skills.length > 0) {
    context += "SKILLS:\n";
    skills.forEach((skill, index) => {
      context += `${index + 1}. ${skill.name}\n`;
      context += `   Category: ${skill.category}\n`;
      context += `   Status: ${skill.status}\n`;
      context += `   Progress: ${skill.progress}%\n`;
      context += `   Priority: ${skill.priority}\n`;
      if (skill.description) {
        context += `   Description: ${skill.description}\n`;
      }
      if (skill.resources && skill.resources.length > 0) {
        context += `   Resources: ${skill.resources.length} items\n`;
      }
      context += "\n";
    });
  }

  // Timetables
  if (timetables && timetables.length > 0) {
    context += "TIMETABLES:\n";
    timetables.forEach((timetable, index) => {
      context += `${index + 1}. ${timetable.name}\n`;
      context += `   Active: ${timetable.isActive}\n`;
      if (timetable.description) {
        context += `   Description: ${timetable.description}\n`;
      }

      // Current Week
      if (timetable.currentWeek) {
        const week = timetable.currentWeek;
        context += `   Current Week: ${new Date(
          week.weekStartDate
        ).toLocaleDateString()} - ${new Date(
          week.weekEndDate
        ).toLocaleDateString()}\n`;
        context += `   Overall Completion: ${week.overallCompletionRate}%\n`;
        if (week.activities && week.activities.length > 0) {
          context += `   Activities (${week.activities.length}):\n`;
          week.activities.forEach((act) => {
            context += `     - ${act.activity.name} at ${act.activity.time} (${act.activity.category})\n`;
            context += `       Weekly completion: ${act.completionRate}%\n`;
            const completedDays = act.dailyStatus.filter(Boolean).length;
            context += `       Days completed: ${completedDays}/7\n`;
          });
        }
      }

      // Historical Weeks
      if (timetable.history && timetable.history.length > 0) {
        context += `   Historical Data (${timetable.history.length} past weeks):\n`;
        // Show last 4 weeks of history
        const recentHistory = timetable.history.slice(-4);
        recentHistory.forEach((week, weekIndex) => {
          context += `     Week ${weekIndex + 1}: ${new Date(
            week.weekStartDate
          ).toLocaleDateString()} - ${new Date(
            week.weekEndDate
          ).toLocaleDateString()}\n`;
          context += `       Overall Completion: ${week.overallCompletionRate}%\n`;
          if (week.activities && week.activities.length > 0) {
            week.activities.forEach((act) => {
              const completedDays = act.dailyStatus.filter(Boolean).length;
              context += `       - ${act.activity.name}: ${act.completionRate}% (${completedDays}/7 days)\n`;
            });
          }
        });
      }

      context += "\n";
    });
  }

  // Working Hours
  if (workingHours && workingHours.length > 0) {
    context += "WORKING HOURS:\n";
    workingHours.forEach((wh, index) => {
      context += `${index + 1}. Date: ${new Date(
        wh.date
      ).toLocaleDateString()}\n`;
      context += `   Category: ${wh.category}\n`;
      context += `   Target: ${wh.targetHours}h, Achieved: ${wh.achievedHours}h\n`;
      context += `   Progress: ${(
        (wh.achievedHours / wh.targetHours) *
        100
      ).toFixed(0)}%\n`;
      context += `   Mood: ${wh.mood}\n`;
      if (wh.notes) {
        context += `   Notes: ${wh.notes}\n`;
      }
      context += "\n";
    });
  }

  return context;
};

/**
 * Generate productivity insights using Gemini
 */
const generateInsights = async (userId, detailLevel = "detailed") => {
  try {
    const userData = await getUserData(userId);
    const context = formatUserDataForAI(userData);

    // Customize prompt based on detail level
    let promptInstructions = "";

    if (detailLevel === "brief") {
      promptInstructions = `Based on the above productivity data, provide a BRIEF analysis (max 300 words) covering:

1. **Key Productivity Pattern**: One main observation about their work habits
2. **Top Strength**: What they're doing best
3. **Main Area for Improvement**: The most critical thing to fix
4. **Priority Recommendation**: 1-2 specific, actionable recommendations

Keep it concise and focused on the most important insights.`;
    } else if (detailLevel === "comprehensive") {
      promptInstructions = `Based on the above productivity data, provide an IN-DEPTH, COMPREHENSIVE analysis covering:

1. **Productivity Patterns**: Detailed analysis of work habits, schedule completion rates, time management, consistency, and behavioral trends
2. **Strengths**: What they're doing well, including specific examples and data points
3. **Areas for Improvement**: Detailed breakdown of weaknesses with specific examples
4. **Skill Development**: Deep analysis of skill progress, learning patterns, and strategic recommendations
5. **Time Management**: Comprehensive insights on working hours, schedule effectiveness, and optimization opportunities
6. **Actionable Recommendations**: 5-7 specific, detailed, actionable recommendations with implementation steps

Provide extensive, personalized analysis with specific data references and examples.`;
    } else {
      // detailed (default)
      promptInstructions = `Based on the above productivity data, provide a comprehensive analysis with the following:

1. **Productivity Patterns**: Identify patterns in their work habits, schedule completion rates, and time management
2. **Strengths**: What are they doing well?
3. **Areas for Improvement**: Where can they improve?
4. **Skill Development**: Analyze their skill progress and provide recommendations
5. **Time Management**: Insights on their working hours and schedule effectiveness
6. **Actionable Recommendations**: 3-5 specific, actionable recommendations to improve productivity

Provide a detailed, personalized analysis in a clear, structured format.`;
    }

    const prompt = `${context}

${promptInstructions}`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const insights = result.text;

    return {
      insights,
      dataStats: {
        totalSchedules: userData.schedules.length,
        totalSkills: userData.skills.length,
        totalTimetables: userData.timetables.length,
        totalWorkingHourRecords: userData.workingHours.length,
      },
    };
  } catch (error) {
    console.error("Error generating insights:", error);
    throw error;
  }
};

/**
 * Get personalized recommendations
 */
const getRecommendations = async (userId, focusArea = null) => {
  try {
    const userData = await getUserData(userId);
    const context = formatUserDataForAI(userData);

    let prompt = `${context}

Based on the above productivity data, provide personalized recommendations`;

    if (focusArea) {
      prompt += ` specifically focused on: ${focusArea}`;
    }

    prompt += `\n\nProvide 5-7 specific, actionable recommendations that will help improve productivity. Each recommendation should include:
- A clear title
- Detailed explanation
- Expected impact
- How to implement it

Format as a numbered list with clear sections.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const recommendations = result.text;

    return {
      recommendations,
      focusArea: focusArea || "general productivity",
    };
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw error;
  }
};

/**
 * Answer natural language queries about user data
 */
/**
 * Extract date range from natural language question
 */
const extractDateRangeFromQuestion = (question) => {
  const now = new Date();
  const lowerQuestion = question.toLowerCase();

  // Last X weeks/days/months patterns
  const weeksMatch = lowerQuestion.match(/last (\d+) weeks?/);
  const daysMatch = lowerQuestion.match(/last (\d+) days?/);
  const monthsMatch = lowerQuestion.match(/last (\d+) months?/);

  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - weeks * 7);
    return { startDate, endDate: now };
  }

  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    return { startDate, endDate: now };
  }

  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - months);
    return { startDate, endDate: now };
  }

  // This week/month patterns
  if (lowerQuestion.includes("this week")) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - now.getDay()); // Start of week (Sunday)
    return { startDate, endDate: now };
  }

  if (lowerQuestion.includes("this month")) {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate, endDate: now };
  }

  // History-related keywords
  if (
    lowerQuestion.includes("history") ||
    lowerQuestion.includes("past") ||
    lowerQuestion.includes("previous") ||
    lowerQuestion.includes("summary")
  ) {
    // Default to last 30 days for historical queries
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate: now };
  }

  return null;
};

/**
 * Answer user questions about their data
 */
const queryUserData = async (userId, question) => {
  try {
    console.log("queryUserData: Starting for user:", userId);
    console.log("queryUserData: Question:", question);

    // Extract date range from question
    const dateRange = extractDateRangeFromQuestion(question);
    console.log("queryUserData: Extracted date range:", dateRange);

    const userData = await getUserData(userId, dateRange || {});
    console.log("queryUserData: User data fetched, stats:", {
      schedules: userData.schedules?.length || 0,
      skills: userData.skills?.length || 0,
      timetables: userData.timetables?.length || 0,
      workingHours: userData.workingHours?.length || 0,
    });

    const context = formatUserDataForAI(userData);
    console.log("queryUserData: Context formatted, length:", context.length);

    // Add date context to the prompt
    let dateContext = "";
    if (dateRange) {
      dateContext = `\nDate Range: ${dateRange.startDate.toLocaleDateString()} to ${dateRange.endDate.toLocaleDateString()}\n`;
    }

    const prompt = `${context}${dateContext}

User Question: ${question}

Based on the above productivity data${
      dateRange ? " for the specified time period" : ""
    }, please answer the user's question accurately and helpfully. 

IMPORTANT:
- If asked for historical data (last X weeks/months), analyze trends and patterns across the time period
- Provide specific dates, numbers, and data points from the records
- If the data is insufficient, explain what information is available and what's missing
- For timetable questions, look at the activities, completion rates, and time periods
- For schedule questions, analyze actual entries and completion patterns
- Be concise but specific with actual data references

Answer:`;

    console.log("queryUserData: Sending to Gemini...");
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });
    console.log("queryUserData: Gemini response received");

    const answer = result.text;

    console.log(
      "queryUserData: Answer extracted, length:",
      answer?.length || 0
    );

    return {
      question,
      answer,
    };
  } catch (error) {
    console.error("Error querying user data:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
};

/**
 * Generate schedule suggestions based on patterns
 */
const generateScheduleSuggestions = async (userId) => {
  try {
    const userData = await getUserData(userId);
    const context = formatUserDataForAI(userData);

    // Use new Gemini API

    const prompt = `${context}

Based on the user's past schedules, skills, and working patterns, suggest 3-5 optimized schedule templates for the upcoming week. Consider:
- Their most productive time blocks
- Skill development goals
- Past schedule completion rates
- Work-life balance

For each suggestion, provide:
1. Schedule title
2. Recommended time blocks
3. Priority tasks to include
4. Rationale for this schedule

Format as a clear, actionable list.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    // Get text directly
    const suggestions = result.text;

    return {
      suggestions,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating schedule suggestions:", error);
    throw error;
  }
};

/**
 * Analyze skill progress and suggest learning path
 */
const analyzeSkillProgress = async (userId) => {
  try {
    const userData = await getUserData(userId);
    const context = formatUserDataForAI(userData);

    // Use new Gemini API

    const prompt = `${context}

Analyze the user's skill development progress and provide:

1. **Current Skill Assessment**: Evaluate their current skill levels and progress
2. **Learning Path**: Suggest a personalized learning path for skill improvement
3. **Time Allocation**: Recommend how much time to spend on each skill
4. **Skill Gaps**: Identify missing skills that would complement their current skill set
5. **Milestone Suggestions**: Propose specific milestones for the next 30, 60, and 90 days

Provide detailed, actionable guidance.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    // Get text directly
    const analysis = result.text;

    return {
      analysis,
      skillCount: userData.skills.length,
      analyzedAt: new Date(),
    };
  } catch (error) {
    console.error("Error analyzing skill progress:", error);
    throw error;
  }
};

/**
 * Generate weekly productivity report
 */
const generateWeeklyReport = async (userId, startDate, endDate) => {
  try {
    const userData = await getUserData(userId);

    // Filter data by date range
    const filteredSchedules = userData.schedules.filter((s) => {
      const scheduleDate = new Date(s.date);
      return (
        scheduleDate >= new Date(startDate) && scheduleDate <= new Date(endDate)
      );
    });

    const filteredTimetables = userData.timetables.filter((t) => {
      const timetableDate = new Date(t.date);
      return (
        timetableDate >= new Date(startDate) &&
        timetableDate <= new Date(endDate)
      );
    });

    const filteredWorkingHours = userData.workingHours.filter((wh) => {
      const whDate = new Date(wh.date);
      return whDate >= new Date(startDate) && whDate <= new Date(endDate);
    });

    const filteredData = {
      schedules: filteredSchedules,
      skills: userData.skills,
      timetables: filteredTimetables,
      workingHours: filteredWorkingHours,
    };

    const context = formatUserDataForAI(filteredData);

    // Use new Gemini API

    const prompt = `${context}

Generate a comprehensive weekly productivity report for the period ${startDate} to ${endDate}.

Include:
1. **Week Summary**: Overall productivity assessment
2. **Key Achievements**: What was accomplished
3. **Time Analysis**: How time was spent
4. **Completion Rate**: Schedule and task completion statistics
5. **Challenges**: Identified obstacles or missed items
6. **Next Week Planning**: Recommendations for the upcoming week

Provide a detailed, motivating report with specific metrics and insights.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    // Get text directly
    const report = result.text;

    return {
      report,
      period: { startDate, endDate },
      stats: {
        schedules: filteredSchedules.length,
        timetables: filteredTimetables.length,
        workingHours: filteredWorkingHours.length,
        totalHours: filteredWorkingHours.reduce(
          (sum, wh) => sum + (wh.totalHours || 0),
          0
        ),
      },
    };
  } catch (error) {
    console.error("Error generating weekly report:", error);
    throw error;
  }
};

module.exports = {
  generateInsights,
  getRecommendations,
  queryUserData,
  generateScheduleSuggestions,
  analyzeSkillProgress,
  generateWeeklyReport,
};
