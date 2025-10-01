












const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();


const User = require("../models/User");
const WorkingHours = require("../models/WorkingHours");
const Skill = require("../models/Skills");
const Schedule = require("../models/Schedule");

const ActivityTracker = mongoose.model("ActivityTracker") || {
  schema: mongoose.Schema({})
};
const Timetable = require("../models/Timetable");
const Category = require("../models/Category");


mongoose.
connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).
then(() => console.log("MongoDB Connected")).
catch((err) => {
  console.error("MongoDB Connection Error:", err);
  process.exit(1);
});


const migrateData = async () => {
  try {
    console.log("Starting data migration...");


    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || "admin123",
      salt
    );


    let adminUser = await User.findOne({
      email: process.env.ADMIN_EMAIL || "admin@example.com"
    });

    if (!adminUser) {
      adminUser = await User.create({
        name: process.env.ADMIN_NAME || "Admin User",
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        password: hashedPassword,
        isEmailVerified: true
      });
      console.log(`Created admin user: ${adminUser.email}`);
    } else {
      console.log(`Using existing admin user: ${adminUser.email}`);
    }


    console.log("Migrating categories...");


    const categoryTypes = ["working-hours", "skills", "schedule", "timetable"];

    for (const type of categoryTypes) {
      let categories = [];


      switch (type) {
        case "working-hours":
          const workingHours = await WorkingHours.find();
          categories = [
          ...new Set(workingHours.map((wh) => wh.category).filter(Boolean))];

          break;

        case "skills":
          const skills = await Skill.find();
          categories = [
          ...new Set(skills.map((skill) => skill.category).filter(Boolean))];

          break;

        case "schedule":
          const schedules = await Schedule.find();
          const scheduleCategories = new Set();
          schedules.forEach((schedule) => {
            if (schedule.items && Array.isArray(schedule.items)) {
              schedule.items.forEach((item) => {
                if (item && item.category)
                scheduleCategories.add(item.category);
              });
            }
          });
          categories = [...scheduleCategories];
          break;

        case "timetable":
          try {

            const activityTrackerCollection =
            mongoose.connection.db.collection("activitytrackers");
            if (activityTrackerCollection) {
              const activityDocs = await activityTrackerCollection.
              find({}).
              toArray();
              if (
              activityDocs.length > 0 &&
              activityDocs[0].defaultActivities)
              {
                const actCategories = new Set();
                activityDocs[0].defaultActivities.forEach((act) => {
                  if (act && act.category) actCategories.add(act.category);
                });
                categories = [...actCategories];
              }
            }
          } catch (err) {
            console.log(
              "No ActivityTracker collection found, using default categories"
            );
            categories = ["Career", "Backend", "Core", "Frontend", "Mobile"];
          }
          break;
      }


      for (const name of categories) {
        if (!name) continue;


        const existingCategory = await Category.findOne({
          user: adminUser._id,
          name,
          type
        });

        if (!existingCategory) {
          await Category.create({
            user: adminUser._id,
            name,
            type,
            color: getRandomColor(),
            icon: "circle"
          });
        }
      }

      console.log(`Created ${categories.length} categories for ${type}`);
    }


    console.log("Migrating working hours...");
    const workingHours = await WorkingHours.find();
    let whCount = 0;

    for (const wh of workingHours) {

      const existingWh = await WorkingHours.findOne({
        user: adminUser._id,
        date: wh.date
      });

      if (!existingWh) {
        const newWh = new WorkingHours({
          ...wh.toObject(),
          _id: undefined,
          user: adminUser._id
        });
        await newWh.save();
        whCount++;
      }
    }
    console.log(`Migrated ${whCount} working hours records`);


    console.log("Migrating skills...");
    const skills = await Skill.find();
    let skillCount = 0;

    for (const skill of skills) {

      const existingSkill = await Skill.findOne({
        user: adminUser._id,
        name: skill.name,
        category: skill.category
      });

      if (!existingSkill) {
        const newSkill = new Skill({
          ...skill.toObject(),
          _id: undefined,
          user: adminUser._id
        });
        await newSkill.save();
        skillCount++;
      }
    }
    console.log(`Migrated ${skillCount} skills`);


    console.log("Migrating schedules...");
    const schedules = await Schedule.find();
    let scheduleCount = 0;

    for (const schedule of schedules) {

      const existingSchedule = await Schedule.findOne({
        user: adminUser._id,
        date: schedule.date
      });

      if (!existingSchedule) {
        const newSchedule = new Schedule({
          ...schedule.toObject(),
          _id: undefined,
          user: adminUser._id
        });
        await newSchedule.save();
        scheduleCount++;
      }
    }
    console.log(`Migrated ${scheduleCount} schedules`);


    console.log("Migrating activity tracker to timetable...");

    try {

      const activityTrackerCollection =
      mongoose.connection.db.collection("activitytrackers");

      if (activityTrackerCollection) {
        const activityDocs = await activityTrackerCollection.find({}).toArray();

        if (activityDocs.length > 0) {

          const existingTimetable = await Timetable.findOne({
            user: adminUser._id,
            name: "Default Timetable"
          });

          if (!existingTimetable) {
            const activityDoc = activityDocs[0];

            const timetable = new Timetable({
              user: adminUser._id,
              name: "Default Timetable",
              description: "Migrated from previous data",
              isActive: true,
              currentWeek: {
                weekStartDate:
                activityDoc.currentWeek?.weekStartDate || new Date(),
                weekEndDate:
                activityDoc.currentWeek?.weekEndDate ||
                new Date(new Date().setDate(new Date().getDate() + 6)),
                activities: activityDoc.currentWeek?.activities || [],
                overallCompletionRate:
                activityDoc.currentWeek?.overallCompletionRate || 0
              },
              history: activityDoc.history || [],
              defaultActivities: activityDoc.defaultActivities || []
            });

            await timetable.save();
            console.log("Migrated activity tracker to timetable");
          } else {
            console.log("Timetable already migrated, skipping");
          }
        } else {
          console.log("No activity tracker data found to migrate");
        }
      } else {
        console.log("No ActivityTracker collection found");
      }
    } catch (error) {
      console.log("Error migrating ActivityTracker:", error.message);


      const existingTimetable = await Timetable.findOne({
        user: adminUser._id
      });

      if (!existingTimetable) {
        const now = new Date();
        const monday = new Date(now);

        monday.setDate(
          now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)
        );
        monday.setHours(0, 0, 0, 0);


        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const defaultActivities = [
        { name: "DS & Algo", time: "18:00-00:00", category: "Core" },
        { name: "MERN Stack", time: "00:00-05:00", category: "Frontend" },
        { name: "Go Backend", time: "10:00-12:00", category: "Backend" },
        { name: "Java & Spring", time: "12:00-14:00", category: "Backend" },
        {
          name: "Mobile Development",
          time: "14:00-17:00",
          category: "Mobile"
        }];


        const timetable = new Timetable({
          user: adminUser._id,
          name: "Default Timetable",
          description: "Default timetable",
          isActive: true,
          currentWeek: {
            weekStartDate: monday,
            weekEndDate: sunday,
            activities: defaultActivities.map((activity) => ({
              activity: activity,
              dailyStatus: [false, false, false, false, false, false, false],
              completionRate: 0
            })),
            overallCompletionRate: 0
          },
          history: [],
          defaultActivities
        });

        await timetable.save();
        console.log("Created default timetable");
      }
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};


function getRandomColor() {
  const colors = [
  "#3498db",
  "#2ecc71",
  "#e74c3c",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#95a5a6",
  "#34495e",
  "#16a085"];


  return colors[Math.floor(Math.random() * colors.length)];
}


migrateData();