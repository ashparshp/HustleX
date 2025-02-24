// server/controllers/schedule.js
const Schedule = require("../models/Schedule");
const ScheduleTemplate = require("../models/ScheduleTemplate");
const Category = require("../models/Category");

// Helper function for error handling
const handleError = (res, error, message = "Server error") => {
  console.error(`Error: ${message}`, error);
  res.status(500).json({ success: false, message: error.message || message });
};

// @desc    Get schedules for a date range
// @route   GET /api/schedules
// @access  Private
exports.getSchedules = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let query = { user: req.user.id };

    // Apply date range filter
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Apply status filter if provided
    if (status) {
      query.status = status;
    }

    const schedules = await Schedule.find(query).sort({ date: 1 });

    // Calculate summary statistics
    const stats = {
      total: schedules.length,
      totalHours: schedules.reduce((sum, schedule) => sum + schedule.totalHours, 0),
      planned: schedules.filter(s => s.status === 'Planned').length,
      inProgress: schedules.filter(s => s.status === 'In Progress').length,
      completed: schedules.filter(s => s.status === 'Completed').length,
      averageCompletion: schedules.length > 0 
        ? schedules.reduce((sum, s) => sum + s.overallCompletion, 0) / schedules.length
        : 0,
      categories: {}
    };

    // Build category breakdown
    schedules.forEach(schedule => {
      schedule.items.forEach(item => {
        if (!stats.categories[item.category]) {
          stats.categories[item.category] = {
            totalItems: 0,
            completedItems: 0,
            totalHours: 0
          };
        }

        // Calculate item hours
        const start = new Date(`2000-01-01T${item.startTime}`);
        const end = new Date(`2000-01-01T${item.endTime}`);
        const itemHours = (end - start) / (1000 * 60 * 60);

        stats.categories[item.category].totalItems++;
        stats.categories[item.category].totalHours += itemHours;

        if (item.completed) {
          stats.categories[item.category].completedItems++;
        }
      });
    });

    // Calculate completion rates for each category
    Object.keys(stats.categories).forEach(category => {
      const { totalItems, completedItems } = stats.categories[category];
      stats.categories[category].completionRate = totalItems > 0 
        ? (completedItems / totalItems) * 100
        : 0;
    });

    res.json({
      success: true,
      count: schedules.length,
      stats,
      data: schedules
    });
  } catch (error) {
    handleError(res, error, "Error getting schedules");
  }
};

// @desc    Get a single day's schedule
// @route   GET /api/schedules/:id
// @access  Private
exports.getSchedule = async (req, res) => {
  try {
    // Find schedule and verify ownership
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or not authorized"
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    handleError(res, error, "Error getting schedule");
  }
};

// @desc    Create a new schedule
// @route   POST /api/schedules
// @access  Private
exports.createSchedule = async (req, res) => {
  try {
    const { date, items, templateId } = req.body;

    // Format date to remove time component
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);

    // Check if schedule already exists for this date and user
    const existingSchedule = await Schedule.findOne({
      user: req.user.id,
      date: scheduleDate
    });

    if (existingSchedule) {
      return res.status(400).json({
        success: false,
        message: "Schedule already exists for this date"
      });
    }

    // Determine day type (Weekend or Weekday)
    const dayType = scheduleDate.getDay() % 6 === 0 ? "Weekend" : "Weekday";

    let scheduleItems = items || [];
    let templateName = null;

    // If templateId is provided, use template items
    if (templateId) {
      const template = await ScheduleTemplate.findOne({
        _id: templateId,
        user: req.user.id
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template not found or not authorized"
        });
      }

      scheduleItems = template.items.map(item => ({
        title: item.title,
        description: item.description,
        startTime: item.startTime,
        endTime: item.endTime,
        category: item.category,
        priority: item.priority,
        notes: item.notes,
        completed: false
      }));

      templateName = template.name;
    }

    const schedule = new Schedule({
      user: req.user.id,
      date: scheduleDate,
      dayType,
      items: scheduleItems,
      templateName
    });

    await schedule.save();

    res.status(201).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    handleError(res, error, "Error creating schedule");
  }
};

// @desc    Update a schedule
// @route   PUT /api/schedules/:id
// @access  Private
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find schedule and verify ownership
    const schedule = await Schedule.findOne({
      _id: id,
      user: req.user.id
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or not authorized"
      });
    }

    // Extract fields to update
    const { date, items, dayType, status } = req.body;

    // Update fields if provided
    if (date) {
      schedule.date = new Date(date);
    }

    if (items) {
      schedule.items = items;
    }

    if (dayType) {
      schedule.dayType = dayType;
    }

    if (status) {
      schedule.status = status;
    }

    // Save the updated schedule
    const updatedSchedule = await schedule.save();

    res.json({
      success: true,
      data: updatedSchedule
    });
  } catch (error) {
    handleError(res, error, "Error updating schedule");
  }
};

// @desc    Delete a schedule
// @route   DELETE /api/schedules/:id
// @access  Private
exports.deleteSchedule = async (req, res) => {
  try {
    // Find schedule and verify ownership
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or not authorized"
      });
    }

    await schedule.remove();

    res.json({
      success: true,
      message: "Schedule deleted successfully"
    });
  } catch (error) {
    handleError(res, error, "Error deleting schedule");
  }
};

// @desc    Add item to schedule
// @route   POST /api/schedules/:id/items
// @access  Private
exports.addScheduleItem = async (req, res) => {
  try {
    // Find schedule and verify ownership
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or not authorized"
      });
    }

    // Validate required fields
    const { title, startTime, endTime, category } = req.body;
    if (!title || !startTime || !endTime || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, start time, end time, and category are required"
      });
    }

    schedule.items.push(req.body);
    await schedule.save();

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    handleError(res, error, "Error adding schedule item");
  }
};

// @desc    Update schedule item
// @route   PUT /api/schedules/:id/items/:itemId
// @access  Private
exports.updateScheduleItem = async (req, res) => {
  try {
    // Find schedule and verify ownership
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or not authorized"
      });
    }

    const item = schedule.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Schedule item not found"
      });
    }

    // Update item fields
    Object.keys(req.body).forEach((key) => {
      item[key] = req.body[key];
    });

    await schedule.save();

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    handleError(res, error, "Error updating schedule item");
  }
};

// @desc    Delete schedule item
// @route   DELETE /api/schedules/:id/items/:itemId
// @access  Private
exports.deleteScheduleItem = async (req, res) => {
  try {
    // Find schedule and verify ownership
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found or not authorized"
      });
    }

    // Remove the item
    schedule.items = schedule.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await schedule.save();

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    handleError(res, error, "Error deleting schedule item");
  }
};

// @desc    Get schedule categories
// @route   GET /api/schedules/categories
// @access  Private
exports.getScheduleCategories = async (req, res) => {
  try {
    // Find all unique categories used in schedules
    const schedules = await Schedule.find({ user: req.user.id });
    
    const categoriesSet = new Set();
    
    schedules.forEach(schedule => {
      schedule.items.forEach(item => {
        categoriesSet.add(item.category);
      });
    });
    
    // Get user-defined categories
    const userCategories = await Category.find({
      user: req.user.id,
      type: 'schedule'
    });
    
    userCategories.forEach(category => {
      categoriesSet.add(category.name);
    });
    
    const categories = Array.from(categoriesSet);
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    handleError(res, error, "Error getting schedule categories");
  }
};

// @desc    Create a schedule template
// @route   POST /api/schedules/templates
// @access  Private
exports.createTemplate = async (req, res) => {
  try {
    const { name, dayType, description, items, isDefault } = req.body;
    
    // Validate required fields
    if (!name || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Name and at least one item are required"
      });
    }
    
    // Check for duplicate template name
    const existingTemplate = await ScheduleTemplate.findOne({
      user: req.user.id,
      name: name.trim()
    });
    
    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: "Template with this name already exists"
      });
    }
    
    // Create template
    const template = new ScheduleTemplate({
      user: req.user.id,
      name: name.trim(),
      dayType: dayType || "Any",
      description,
      items,
      isDefault: isDefault || false
    });
    
    await template.save();
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    handleError(res, error, "Error creating schedule template");
  }
};

// @desc    Get all schedule templates for the user
// @route   GET /api/schedules/templates
// @access  Private
exports.getTemplates = async (req, res) => {
  try {
    const templates = await ScheduleTemplate.find({
      user: req.user.id
    });
    
    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    handleError(res, error, "Error getting schedule templates");
  }
};

// @desc    Get a single schedule template
// @route   GET /api/schedules/templates/:id
// @access  Private
exports.getTemplate = async (req, res) => {
  try {
    // Find template and verify ownership
    const template = await ScheduleTemplate.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found or not authorized"
      });
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    handleError(res, error, "Error getting schedule template");
  }
};

// @desc    Update a schedule template
// @route   PUT /api/schedules/templates/:id
// @access  Private
exports.updateTemplate = async (req, res) => {
  try {
    // Find template and verify ownership
    const template = await ScheduleTemplate.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found or not authorized"
      });
    }
    
    const { name, dayType, description, items, isDefault } = req.body;
    
    // Check for duplicate template name if name is changed
    if (name && name !== template.name) {
      const existingTemplate = await ScheduleTemplate.findOne({
        user: req.user.id,
        name: name.trim(),
        _id: { $ne: req.params.id }
      });
      
      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          message: "Template with this name already exists"
        });
      }
      
      template.name = name.trim();
    }
    
    // Update fields if provided
    if (dayType) template.dayType = dayType;
    if (description !== undefined) template.description = description;
    if (items) template.items = items;
    if (isDefault !== undefined) template.isDefault = isDefault;
    
    await template.save();
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    handleError(res, error, "Error updating schedule template");
  }
};

// @desc    Delete a schedule template
// @route   DELETE /api/schedules/templates/:id
// @access  Private
exports.deleteTemplate = async (req, res) => {
  try {
    // Find template and verify ownership
    const template = await ScheduleTemplate.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found or not authorized"
      });
    }
    
    await template.remove();
    
    res.json({
      success: true,
      message: "Template deleted successfully"
    });
  } catch (error) {
    handleError(res, error, "Error deleting schedule template");
  }
};