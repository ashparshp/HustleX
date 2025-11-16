const { GoogleGenAI } = require("@google/genai");
const Schedule = require("../models/Schedule");
const Skills = require("../models/Skills");
const Timetable = require("../models/Timetable");
const WorkingHours = require("../models/WorkingHours");

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getUserData = async (userId, options = {}) => {
  try {
    const { startDate, endDate, includeHistory = true } = options;

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

const generateDataSummary = (userData) => {
  const { schedules, skills, timetables, workingHours } = userData;
  let summary = "=== DATA SUMMARY & KEY INSIGHTS ===\n\n";

  if (schedules && schedules.length > 0) {
    const completedSchedules = schedules.filter(
      (s) => s.status === "completed"
    ).length;
    const totalTasks = schedules.reduce(
      (sum, s) => sum + (s.items?.length || 0),
      0
    );
    const completedTasks = schedules.reduce(
      (sum, s) => sum + (s.items?.filter((i) => i.completed).length || 0),
      0
    );
    const taskCompletionRate =
      totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

    summary += `SCHEDULE INSIGHTS:\n`;
    summary += `- Total Schedules: ${schedules.length} (${completedSchedules} completed)\n`;
    summary += `- Task Completion Rate: ${taskCompletionRate}% (${completedTasks}/${totalTasks} tasks)\n`;
    summary += `- Average Tasks per Day: ${(
      totalTasks / schedules.length
    ).toFixed(1)}\n`;

    const recent = schedules.slice(0, 7);
    const recentCompleted = recent.reduce(
      (sum, s) => sum + (s.items?.filter((i) => i.completed).length || 0),
      0
    );
    const recentTotal = recent.reduce(
      (sum, s) => sum + (s.items?.length || 0),
      0
    );
    if (recentTotal > 0) {
      summary += `- Recent 7-day Completion: ${(
        (recentCompleted / recentTotal) *
        100
      ).toFixed(1)}%\n`;
    }
    summary += "\n";
  }

  if (skills && skills.length > 0) {
    const completed = skills.filter(
      (s) => s.status === "completed" || s.progress === 100
    ).length;
    const inProgress = skills.filter(
      (s) => s.status === "in-progress" && s.progress < 100
    ).length;
    const upcoming = skills.filter(
      (s) => s.status === "upcoming" || s.status === "not-started"
    ).length;
    const highPriorityUpcoming = skills.filter(
      (s) =>
        (s.status === "upcoming" || s.status === "not-started") &&
        s.priority === "high"
    ).length;

    const avgProgress =
      skills.length > 0
        ? (
            skills.reduce((sum, s) => sum + (s.progress || 0), 0) /
            skills.length
          ).toFixed(1)
        : 0;

    summary += `SKILLS INSIGHTS:\n`;
    summary += `- Total Skills: ${skills.length}\n`;
    summary += `- Status: ${completed} completed, ${inProgress} in-progress, ${upcoming} upcoming\n`;
    summary += `- Average Progress: ${avgProgress}%\n`;
    summary += `- High-Priority Upcoming: ${highPriorityUpcoming} skills\n`;

    if (highPriorityUpcoming > 10) {
      summary += `- ⚠️ WARNING: ${highPriorityUpcoming} high-priority upcoming skills may cause decision paralysis\n`;
    }

    const stalledSkills = skills.filter(
      (s) => s.status === "in-progress" && s.progress < 20
    );
    if (stalledSkills.length > 0) {
      summary += `- ⚠️ ${stalledSkills.length} stalled skills (in-progress but <20% complete)\n`;
    }

    const nearlyComplete = skills.filter(
      (s) => s.progress >= 80 && s.progress < 100 && s.status !== "completed"
    );
    if (nearlyComplete.length > 0) {
      summary += `- ✨ ${nearlyComplete.length} skills nearly complete (≥80% but not marked completed)\n`;
    }
    summary += "\n";
  }

  if (timetables && timetables.length > 0) {
    timetables.forEach((tt) => {
      if (tt.currentWeek) {
        const week = tt.currentWeek;
        summary += `TIMETABLE "${tt.name}" - Current Week:\n`;
        summary += `- Period: ${new Date(
          week.weekStartDate
        ).toLocaleDateString()} - ${new Date(
          week.weekEndDate
        ).toLocaleDateString()}\n`;
        summary += `- Overall Completion: ${week.overallCompletionRate}%\n`;

        if (week.activities && week.activities.length > 0) {
          const perfect = week.activities.filter(
            (a) => a.completionRate === 100
          ).length;
          const failed = week.activities.filter(
            (a) => a.completionRate === 0
          ).length;
          summary += `- Activities: ${perfect} perfect (100%), ${failed} not started (0%)\n`;

          const sorted = [...week.activities].sort(
            (a, b) => b.completionRate - a.completionRate
          );
          if (sorted.length > 0) {
            summary += `- Best: ${sorted[0].activity.name} (${sorted[0].completionRate}%)\n`;
            if (sorted[sorted.length - 1].completionRate < 50) {
              summary += `- Needs attention: ${
                sorted[sorted.length - 1].activity.name
              } (${sorted[sorted.length - 1].completionRate}%)\n`;
            }
          }
        }
        summary += "\n";
      }

      if (tt.history && tt.history.length >= 2) {
        const recent = tt.history.slice(-2);
        const trend =
          recent[1].overallCompletionRate - recent[0].overallCompletionRate;
        summary += `- Trend: ${
          trend > 0 ? "📈 Improving" : trend < 0 ? "📉 Declining" : "➡️ Stable"
        } (${trend > 0 ? "+" : ""}${trend.toFixed(1)}% vs previous week)\n\n`;
      }
    });
  }

  if (workingHours && workingHours.length > 0) {
    const totalTarget = workingHours.reduce(
      (sum, w) => sum + (w.targetHours || 0),
      0
    );
    const totalAchieved = workingHours.reduce(
      (sum, w) => sum + (w.achievedHours || 0),
      0
    );
    const overallRate =
      totalTarget > 0 ? ((totalAchieved / totalTarget) * 100).toFixed(1) : 0;

    summary += `WORKING HOURS INSIGHTS:\n`;
    summary += `- Total Records: ${workingHours.length} days\n`;
    summary += `- Overall Achievement: ${overallRate}% (${totalAchieved}h / ${totalTarget}h)\n`;

    const recent = workingHours.slice(0, 7);
    const recentTarget = recent.reduce(
      (sum, w) => sum + (w.targetHours || 0),
      0
    );
    const recentAchieved = recent.reduce(
      (sum, w) => sum + (w.achievedHours || 0),
      0
    );
    if (recentTarget > 0) {
      summary += `- Recent 7-day Achievement: ${(
        (recentAchieved / recentTarget) *
        100
      ).toFixed(1)}%\n`;
    }

    const moods = workingHours.filter((w) => w.mood).map((w) => w.mood);
    if (moods.length > 0) {
      const goodMoods = moods.filter(
        (m) => m === "great" || m === "good"
      ).length;
      summary += `- Positive Mood Days: ${(
        (goodMoods / moods.length) *
        100
      ).toFixed(0)}%\n`;
    }
    summary += "\n";
  }

  summary += generateDataValidation(userData);

  return summary + "=================================\n\n";
};

const generateDataValidation = (userData) => {
  const { schedules, timetables, workingHours } = userData;
  let validation = "DATA QUALITY CHECKS:\n";
  let issuesFound = false;

  if (timetables.length > 0 && workingHours.length > 0) {
    timetables.forEach((tt) => {
      if (tt.currentWeek) {
        const weekStart = new Date(tt.currentWeek.weekStartDate);
        const weekEnd = new Date(tt.currentWeek.weekEndDate);

        const whInSamePeriod = workingHours.filter((w) => {
          const whDate = new Date(w.date);
          return whDate >= weekStart && whDate <= weekEnd;
        });

        if (whInSamePeriod.length > 0) {
          const ttCompletion = tt.currentWeek.overallCompletionRate;
          const whCompletion =
            whInSamePeriod.reduce(
              (sum, w) => sum + ((w.achievedHours / w.targetHours) * 100 || 0),
              0
            ) / whInSamePeriod.length;

          const discrepancy = Math.abs(ttCompletion - whCompletion);
          if (discrepancy > 30) {
            validation += `- ⚠️ DISCREPANCY: Timetable shows ${ttCompletion}% completion but Working Hours shows ${whCompletion.toFixed(
              0
            )}% for the same period\n`;
            issuesFound = true;
          }
        }
      }
    });
  }

  if (userData.skills) {
    const inconsistentSkills = userData.skills.filter(
      (s) => s.status === "completed" && s.progress < 100
    );
    if (inconsistentSkills.length > 0) {
      validation += `- ⚠️ ${inconsistentSkills.length} skills marked completed but progress < 100%\n`;
      issuesFound = true;
    }
  }

  if (userData.skills) {
    const unmarkedComplete = userData.skills.filter(
      (s) => s.progress === 100 && s.status !== "completed"
    );
    if (unmarkedComplete.length > 0) {
      validation += `- ⚠️ ${unmarkedComplete.length} skills at 100% progress but not marked as completed\n`;
      issuesFound = true;
    }
  }

  if (!issuesFound) {
    validation += `- ✅ No major inconsistencies detected\n`;
  }

  return validation + "\n";
};

const formatUserDataForAI = (userData) => {
  const { schedules, skills, timetables, workingHours } = userData;

  let context = "User's Productivity Data:\n\n";

  context += generateDataSummary(userData);

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

  if (skills && skills.length > 0) {
    context += "SKILLS:\n";

    const completedSkills = skills.filter(
      (s) => s.status === "completed" || s.progress === 100
    );
    const inProgressSkills = skills.filter(
      (s) => s.status === "in-progress" && s.progress < 100
    );
    const upcomingSkills = skills.filter(
      (s) => s.status === "upcoming" || s.status === "not-started"
    );

    context += `Summary: ${skills.length} total (${completedSkills.length} completed, ${inProgressSkills.length} in-progress, ${upcomingSkills.length} upcoming)\n\n`;

    if (completedSkills.length > 0) {
      context += `COMPLETED SKILLS (${completedSkills.length}):\n`;
      completedSkills.forEach((skill, index) => {
        context += `${index + 1}. ${skill.name} (${skill.category})\n`;
        if (skill.description) {
          context += `   Description: ${skill.description}\n`;
        }
      });
      context += "\n";
    }

    if (inProgressSkills.length > 0) {
      context += `IN-PROGRESS SKILLS (${inProgressSkills.length}):\n`;
      inProgressSkills.forEach((skill, index) => {
        context += `${index + 1}. ${skill.name}\n`;
        context += `   Category: ${skill.category}\n`;
        context += `   Progress: ${skill.progress}%\n`;
        context += `   Priority: ${skill.priority}\n`;
        if (skill.description) {
          context += `   Description: ${skill.description}\n`;
        }
        if (skill.resources && skill.resources.length > 0) {
          context += `   Resources: ${skill.resources.length} items\n`;
        }
      });
      context += "\n";
    }

    if (upcomingSkills.length > 0) {
      const highPriority = upcomingSkills.filter((s) => s.priority === "high");
      const mediumPriority = upcomingSkills.filter(
        (s) => s.priority === "medium"
      );
      const lowPriority = upcomingSkills.filter((s) => s.priority === "low");

      context += `UPCOMING SKILLS (${upcomingSkills.length}):\n`;
      context += `  Priority Distribution: ${highPriority.length} high, ${mediumPriority.length} medium, ${lowPriority.length} low\n`;

      if (highPriority.length > 0) {
        context += `  High Priority (${highPriority.length}):\n`;
        highPriority.slice(0, 10).forEach((skill, index) => {
          context += `    ${index + 1}. ${skill.name} (${skill.category})`;
          if (skill.description) {
            context += ` - ${skill.description.substring(0, 80)}${
              skill.description.length > 80 ? "..." : ""
            }`;
          }
          context += "\n";
        });
        if (highPriority.length > 10) {
          context += `    ... and ${
            highPriority.length - 10
          } more high priority skills\n`;
        }
      }

      if (mediumPriority.length > 0) {
        context += `  Medium Priority: ${mediumPriority.length} skills\n`;
      }

      if (lowPriority.length > 0) {
        context += `  Low Priority: ${lowPriority.length} skills\n`;
      }
      context += "\n";
    }
  }

  if (timetables && timetables.length > 0) {
    context += "TIMETABLES:\n";
    timetables.forEach((timetable, index) => {
      context += `${index + 1}. ${timetable.name}\n`;
      context += `   Active: ${timetable.isActive}\n`;
      if (timetable.description) {
        context += `   Description: ${timetable.description}\n`;
      }

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

      if (timetable.history && timetable.history.length > 0) {
        context += `   Historical Data (${timetable.history.length} past weeks):\n`;

        const recentHistory = timetable.history.slice(-4);
        const totalWeeks = timetable.history.length;
        recentHistory.forEach((week, weekIndex) => {
          const weekNumber = totalWeeks - recentHistory.length + weekIndex + 1;
          context += `     Week ${weekNumber} (${new Date(
            week.weekStartDate
          ).toLocaleDateString()} - ${new Date(
            week.weekEndDate
          ).toLocaleDateString()}):\n`;
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

const generateInsights = async (userId, detailLevel = "detailed") => {
  try {
    const userData = await getUserData(userId);
    const context = formatUserDataForAI(userData);

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
      promptInstructions = `Based on the above productivity data and the DATA SUMMARY insights, provide a comprehensive analysis with the following:

1. **Productivity Patterns**: Identify patterns in their work habits, schedule completion rates, and time management. Reference specific data points and trends from the summary.

2. **Strengths**: What are they doing well? Highlight specific achievements, consistent activities, and positive trends with actual data.

3. **Areas for Improvement**: Where can they improve? Reference specific issues from the data quality checks, declining trends, or underperforming areas.

4. **Skill Development**: Analyze their skill progress and provide recommendations. Address any stalled skills, skills needing status updates, and prioritization issues.

5. **Time Management**: Insights on their working hours and schedule effectiveness. Address any discrepancies between different tracking methods.

6. **Actionable Recommendations**: 3-5 specific, actionable recommendations to improve productivity. Each should be data-driven and reference specific records.

IMPORTANT: Use actual data points, dates, percentages, and specific activity/skill names from their records. Make insights concrete and actionable, not generic.

Provide a detailed, personalized analysis in a clear, structured format.`;
    }

    const prompt = `${context}

${promptInstructions}`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
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

const getRecommendations = async (userId, focusArea = null) => {
  try {
    const userData = await getUserData(userId);
    const context = formatUserDataForAI(userData);

    let prompt = `${context}

You are an expert productivity coach analyzing the user's data. `;

    if (focusArea) {
      prompt += `The user has specifically requested recommendations focused on: "${focusArea}"\n\n`;
    }

    prompt += `Based on the DATA SUMMARY and detailed productivity data above, provide 5-7 highly specific, data-driven recommendations.

CRITICAL REQUIREMENTS:
1. Each recommendation MUST reference specific data points from the user's records (dates, percentages, activity names, skill names)
2. Focus on actionable changes, not generic advice
3. Prioritize recommendations based on the data issues and patterns identified in the DATA SUMMARY
4. Address any data inconsistencies or warnings highlighted above

FORMAT EACH RECOMMENDATION EXACTLY AS FOLLOWS:

### 1. [Clear, Action-Oriented Title]

**Detailed Explanation:**
[2-3 paragraphs explaining the issue/opportunity. MUST include:
- Specific data references (e.g., "Your 'Go Microservices' activity shows 0% completion in Week 4")
- Concrete examples from their records
- Why this matters for their goals]

**Expected Impact:**
[1-2 sentences on the specific benefits, quantified if possible]

**How to Implement It:**
1. [Specific first step with details]
2. [Specific second step with details]
3. [Specific third step with details]

---

FOCUS AREAS TO PRIORITIZE:
${focusArea ? `- Primary: ${focusArea}` : ""}
- High-priority upcoming skills causing decision paralysis
- Skills at 100% progress not marked completed
- Activities with 0% completion in current timetable
- Discrepancies between timetable and working hours data
- Stalled in-progress skills (<20% progress)
- Declining completion trends

Make every recommendation specific, data-backed, and immediately actionable.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const recommendations = result.text;

    const validation = validateRecommendationResponse(
      recommendations,
      userData
    );

    return {
      recommendations,
      focusArea: focusArea || "general productivity",
      quality: validation,
    };
  } catch (error) {
    console.error("Error generating recommendations:", error);
    throw error;
  }
};

const validateRecommendationResponse = (text, userData) => {
  const validation = {
    hasDataReferences: false,
    hasSpecificDates: false,
    hasActionableSteps: false,
    hasExpectedImpact: false,
    score: 0,
    warnings: [],
  };

  const hasPercentages = /\d+%/.test(text);
  const hasSkillMentions = userData.skills.some((s) =>
    text.toLowerCase().includes(s.name.toLowerCase().substring(0, 15))
  );
  const hasTimetableMentions = userData.timetables.some((t) =>
    t.currentWeek?.activities?.some((a) =>
      text.toLowerCase().includes(a.activity.name.toLowerCase())
    )
  );

  validation.hasDataReferences =
    hasPercentages || hasSkillMentions || hasTimetableMentions;
  if (validation.hasDataReferences) validation.score += 25;
  else validation.warnings.push("Missing specific data references");

  validation.hasSpecificDates =
    /week \d+|september|october|9\/\d+\/|last \d+ (days|weeks)/i.test(text);
  if (validation.hasSpecificDates) validation.score += 25;
  else validation.warnings.push("Missing specific dates or time periods");

  validation.hasActionableSteps = /how to implement|step \d+|^\d+\./m.test(
    text
  );
  if (validation.hasActionableSteps) validation.score += 25;
  else validation.warnings.push("Missing clear implementation steps");

  validation.hasExpectedImpact =
    /expected impact|benefit|improve|increase|reduce/i.test(text);
  if (validation.hasExpectedImpact) validation.score += 25;
  else validation.warnings.push("Missing expected impact statements");

  return validation;
};

const extractDateRangeFromQuestion = (question) => {
  const now = new Date();
  const lowerQuestion = question.toLowerCase();

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

  if (lowerQuestion.includes("this week")) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - now.getDay());
    return { startDate, endDate: now };
  }

  if (lowerQuestion.includes("this month")) {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate, endDate: now };
  }

  if (
    lowerQuestion.includes("history") ||
    lowerQuestion.includes("past") ||
    lowerQuestion.includes("previous") ||
    lowerQuestion.includes("summary")
  ) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate: now };
  }

  return null;
};

const queryUserData = async (userId, question) => {
  try {
    console.log("queryUserData: Starting for user:", userId);
    console.log("queryUserData: Question:", question);

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
      model: "gemini-2.5-flash",
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
    // Normalize quota exceeded / rate limit errors so controllers can map status codes
    const status = error.status || error.code;
    if (
      status === 429 ||
      error.message?.includes("Quota") ||
      error.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      const normalized = new Error(
        "AI quota exceeded. Please retry after a short delay or upgrade your plan."
      );
      normalized.name = "QuotaExceededError";
      normalized.status = 429;
      // Attempt to extract retry delay if present
      try {
        const details = error.error?.details || error.details;
        if (Array.isArray(details)) {
          const retryInfo = details.find(
            (d) => d.retryDelay || d["@type"]?.includes("RetryInfo")
          );
          if (retryInfo?.retryDelay) {
            normalized.retryAfter = retryInfo.retryDelay;
          }
        }
      } catch (_) {}
      throw normalized;
    }
    throw error;
  }
};

const generateScheduleSuggestions = async (userId) => {
  try {
    const userData = await getUserData(userId);
    const context = formatUserDataForAI(userData);

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

const analyzeSkillProgress = async (userId) => {
  try {
    const userData = await getUserData(userId);
    const context = formatUserDataForAI(userData);

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

const generateWeeklyReport = async (userId, startDate, endDate) => {
  try {
    const userData = await getUserData(userId);

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
