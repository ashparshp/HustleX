const Timetable = require("../models/Timetable");
const Category = require("../models/Category");

const handleError = (res, error, message = "Server error") => {
  console.error(`Error: ${message}`, error);
  res.status(500).json({ success: false, message: error.message || message });
};

const setCacheHeaders = (res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
};

exports.getTimetables = async (req, res) => {
  try {
    setCacheHeaders(res);

    const timetables = await Timetable.find({ user: req.user.id });

    res.json({
      success: true,
      count: timetables.length,
      data: timetables.map((timetable) => ({
        id: timetable._id,
        name: timetable.name,
        description: timetable.description,
        isActive: timetable.isActive,
        createdAt: timetable.createdAt,
        updatedAt: timetable.updatedAt,
        activitiesCount: timetable.defaultActivities.length,
        completionRate: timetable.currentWeek.overallCompletionRate,
      })),
    });
  } catch (error) {
    handleError(res, error, "Error getting timetables");
  }
};

exports.createTimetable = async (req, res) => {
  try {
    setCacheHeaders(res);

    const { name, description, defaultActivities } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const existingTimetable = await Timetable.findOne({
      user: req.user.id,
      name: name.trim(),
    });

    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        message: "A timetable with this name already exists",
      });
    }

    let activities = defaultActivities || [];

    const timetable = new Timetable({
      user: req.user.id,
      name: name.trim(),
      description,
      defaultActivities: activities,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    });

    await timetable.startNewWeek();

    await timetable.save();

    if (timetable.isActive) {
      await Timetable.updateMany(
        { user: req.user.id, _id: { $ne: timetable._id } },
        { isActive: false }
      );
    }

    console.log("Created new timetable:", {
      id: timetable._id,
      name: timetable.name,
      isActive: timetable.isActive,
    });

    res.status(201).json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    console.error("Error creating timetable:", error);
    handleError(res, error, "Error creating timetable");
  }
};

exports.getTimetable = async (req, res) => {
  try {
    setCacheHeaders(res);

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found or not authorized",
      });
    }

    res.json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    handleError(res, error, "Error getting timetable");
  }
};

exports.updateTimetable = async (req, res) => {
  try {
    setCacheHeaders(res);

    const { name, description, isActive } = req.body;

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found or not authorized",
      });
    }

    if (name && name !== timetable.name) {
      const existingTimetable = await Timetable.findOne({
        user: req.user.id,
        name: name.trim(),
        _id: { $ne: req.params.id },
      });

      if (existingTimetable) {
        return res.status(400).json({
          success: false,
          message: "A timetable with this name already exists",
        });
      }

      timetable.name = name.trim();
    }

    if (description !== undefined) {
      timetable.description = description;
    }

    if (isActive !== undefined) {
      timetable.isActive = isActive;

      if (isActive) {
        await Timetable.updateMany(
          { user: req.user.id, _id: { $ne: req.params.id } },
          { isActive: false }
        );
      }
    }

    await timetable.save();

    res.json({
      success: true,
      data: timetable,
    });
  } catch (error) {
    handleError(res, error, "Error updating timetable");
  }
};

exports.deleteTimetable = async (req, res) => {
  try {
    setCacheHeaders(res);

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found or not authorized",
      });
    }

    const count = await Timetable.countDocuments({ user: req.user.id });

    if (count <= 1) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete the only timetable. Create another one first.",
      });
    }

    if (timetable.isActive) {
      const anotherTimetable = await Timetable.findOne({
        user: req.user.id,
        _id: { $ne: req.params.id },
      });

      if (anotherTimetable) {
        anotherTimetable.isActive = true;
        await anotherTimetable.save();
      }
    }

    await timetable.deleteOne();

    res.json({
      success: true,
      message: "Timetable deleted successfully",
    });
  } catch (error) {
    handleError(res, error, "Error deleting timetable");
  }
};

exports.getCurrentWeek = async (req, res) => {
  try {
    setCacheHeaders(res);

    let timetable;

    if (req.params.id) {
      timetable = await Timetable.findOne({
        _id: req.params.id,
        user: req.user.id,
      });

      if (!timetable) {
        return res.status(404).json({
          success: false,
          message: "Timetable not found or not authorized",
        });
      }
    } else {
      timetable = await Timetable.findOne({
        user: req.user.id,
        isActive: true,
      });

      if (!timetable) {
        timetable = await Timetable.findOne({ user: req.user.id });

        if (!timetable) {
          timetable = new Timetable({
            user: req.user.id,
            name: "Default Timetable",
            defaultActivities: [
              { name: "DS & Algo", time: "18:00-00:00", category: "Core" },
              { name: "MERN Stack", time: "00:00-05:00", category: "Frontend" },
              { name: "Go Backend", time: "10:00-12:00", category: "Backend" },
              { name: "Java & Spring", time: "12:00-14:00", category: "Backend" },
              { name: "Mobile Development", time: "14:00-17:00", category: "Mobile" },
            ],
          });
        }

        timetable.isActive = true;
      }
    }

    const now = new Date();

    const needsNewWeek =
      !timetable.currentWeek ||
      now > new Date(timetable.currentWeek.weekEndDate);

    if (needsNewWeek) {
      console.log("Week has ended or no current week, starting new week");
      await timetable.startNewWeek();

      await timetable.save();

      timetable = await Timetable.findById(timetable._id);
    }

    res.json({
      success: true,
      timetableId: timetable._id,
      timetableName: timetable.name,
      data: timetable.currentWeek,
    });
  } catch (error) {
    handleError(res, error, "Error getting current week");
  }
};

exports.getHistory = async (req, res) => {
  try {
    setCacheHeaders(res);

    const { page = 1, limit = 10 } = req.query;

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found or not authorized",
      });
    }

    if (!timetable.history.length) {
      return res.json({
        success: true,
        history: [],
        currentPage: 1,
        totalPages: 0,
        totalWeeks: 0,
      });
    }

    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = parseInt(page) * parseInt(limit);
    const paginatedHistory = timetable.history.slice(startIndex, endIndex);

    res.json({
      success: true,
      history: paginatedHistory,
      currentPage: parseInt(page),
      totalPages: Math.ceil(timetable.history.length / parseInt(limit)),
      totalWeeks: timetable.history.length,
    });
  } catch (error) {
    handleError(res, error, "Error getting history");
  }
};

exports.toggleActivityStatus = async (req, res) => {
  try {
    setCacheHeaders(res);

    const { activityId, dayIndex } = req.body;

    if (dayIndex < 0 || dayIndex > 6) {
      return res.status(400).json({
        success: false,
        message: "Day index must be between 0 and 6",
      });
    }

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found or not authorized",
      });
    }

    const activity = timetable.currentWeek.activities.id(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    activity.dailyStatus[dayIndex] = !activity.dailyStatus[dayIndex];
    await timetable.save();

    res.json({
      success: true,
      data: timetable.currentWeek,
    });
  } catch (error) {
    handleError(res, error, "Error toggling activity status");
  }
};

exports.updateDefaultActivities = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    if (!Array.isArray(req.body.activities)) {
      return res.status(400).json({
        success: false,
        message: "Invalid input: activities must be an array",
      });
    }

    for (const activity of req.body.activities) {
      if (!activity.name || !activity.time || !activity.category) {
        return res.status(400).json({
          success: false,
          message: "Each activity must have name, time, and category",
        });
      }
    }

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found or not authorized",
      });
    }

    timetable.defaultActivities = req.body.activities;

    if (timetable.currentWeek && timetable.currentWeek.activities) {
      const currentActivities = timetable.currentWeek.activities;

      timetable.currentWeek.activities = req.body.activities.map(
        (newActivity) => {
          const matchingPreviousActivity = currentActivities.find(
            (prevActivity) =>
              prevActivity.activity.name === newActivity.name &&
              prevActivity.activity.time === newActivity.time &&
              prevActivity.activity.category === newActivity.category
          );

          return {
            activity: newActivity,
            dailyStatus: matchingPreviousActivity
              ? matchingPreviousActivity.dailyStatus
              : [false, false, false, false, false, false, false],
            completionRate: matchingPreviousActivity
              ? matchingPreviousActivity.completionRate
              : 0,
          };
        }
      );
    }

    await timetable.save();

    res.json({
      success: true,
      data: {
        defaultActivities: timetable.defaultActivities,
        currentWeek: timetable.currentWeek,
      },
    });
  } catch (error) {
    console.error("Error updating activities:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update activities",
      error: error.toString(),
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    setCacheHeaders(res);

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found or not authorized",
      });
    }

    const stats = {
      currentWeek: {
        completionRate: timetable.currentWeek.overallCompletionRate,
        byCategory: {},
      },
      overall: {
        totalWeeks: timetable.history.length + 1,
        averageCompletionRate: 0,
        bestWeek: null,
        worstWeek: null,
      },
    };

    timetable.currentWeek.activities.forEach((activity) => {
      const category = activity.activity.category;

      if (!stats.currentWeek.byCategory[category]) {
        stats.currentWeek.byCategory[category] = {
          total: 0,
          completed: 0,
        };
      }

      stats.currentWeek.byCategory[category].total += 7;
      stats.currentWeek.byCategory[category].completed +=
        activity.dailyStatus.filter((status) => status).length;
    });

    Object.keys(stats.currentWeek.byCategory).forEach((category) => {
      const categoryStats = stats.currentWeek.byCategory[category];
      categoryStats.completionRate =
        (categoryStats.completed / categoryStats.total) * 100;
    });

    const allWeeks = [...timetable.history, timetable.currentWeek];

    if (allWeeks.length > 0) {
      stats.overall.averageCompletionRate =
        allWeeks.reduce((sum, week) => sum + week.overallCompletionRate, 0) /
        allWeeks.length;

      const sortedWeeks = [...allWeeks].sort(
        (a, b) => b.overallCompletionRate - a.overallCompletionRate
      );

      stats.overall.bestWeek = {
        weekStartDate: sortedWeeks[0].weekStartDate,
        completionRate: sortedWeeks[0].overallCompletionRate,
      };

      stats.overall.worstWeek = {
        weekStartDate: sortedWeeks[sortedWeeks.length - 1].weekStartDate,
        completionRate:
          sortedWeeks[sortedWeeks.length - 1].overallCompletionRate,
      };
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(res, error, "Error getting stats");
  }
};

exports.startNewWeek = async (req, res) => {
  try {
    setCacheHeaders(res);

    const timetable = await Timetable.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found or not authorized",
      });
    }

    await timetable.startNewWeek();

    res.json({
      success: true,
      message: "New week started successfully",
      data: timetable.currentWeek,
    });
  } catch (error) {
    handleError(res, error, "Error starting new week");
  }
};

exports.getCategories = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    const timetables = await Timetable.find({ user: req.user.id });

    const categoriesSet = new Set();

    timetables.forEach((timetable) => {
      if (
        timetable.defaultActivities &&
        Array.isArray(timetable.defaultActivities)
      ) {
        timetable.defaultActivities.forEach((activity) => {
          if (activity.category) {
            categoriesSet.add(activity.category);
          }
        });
      }
    });

    const userCategories = await Category.find({
      user: req.user.id,
      type: "timetable",
    });

    userCategories.forEach((category) => {
      if (category.name) {
        categoriesSet.add(category.name);
      }
    });

    const categories = Array.from(categoriesSet);

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get categories",
    });
  }
};
