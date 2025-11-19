require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const ActivityTracker = require("../models/ActivityTracker");

async function initDb() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ Connected to MongoDB");

    let tracker = await ActivityTracker.findOne();

    if (tracker) {
      console.log("⚠️ Existing tracker found. Resetting current week...");

      const existingHistory = tracker.history;

      const defaultActivities = [
        { name: "Interviews", time: "09:00-12:00", category: "Career" },
        { name: "Go Backend", time: "12:00-14:00", category: "Backend" },
        { name: "Maths & OS", time: "14:00-17:00", category: "Core" },
        { name: "MERN Stack", time: "18:00-20:00", category: "Frontend" },
        { name: "DS & Algo", time: "20:00-22:00", category: "Core" },
        { name: "Java Stack", time: "22:00-00:00", category: "Backend" },
        { name: "Mobile Dev", time: "02:00-04:00", category: "Mobile" },
      ];

      const now = new Date();
      const currentDay = now.getDay();

      const monday = new Date(now);
      if (currentDay === 0) {
        monday.setDate(now.getDate() - 6);
      } else {
        monday.setDate(now.getDate() - (currentDay - 1));
      }
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      tracker.defaultActivities = defaultActivities;
      tracker.currentWeek = {
        weekStartDate: monday,
        weekEndDate: sunday,
        activities: defaultActivities.map((activity) => ({
          activity: activity,
          dailyStatus: [false, false, false, false, false, false, false],
          completionRate: 0,
        })),
        overallCompletionRate: 0,
      };

      tracker.history = existingHistory.slice(-10);

      await tracker.save();
    } else {
      tracker = await ActivityTracker.initializeDefault();
    }

    console.log("\n✅ Activity tracker initialized successfully!");
    console.log("\nDefault Activities:");
    console.table(
      tracker.defaultActivities.map((act) => ({
        name: act.name,
        time: act.time,
        category: act.category,
      }))
    );

    console.log("\nCurrent Week:");
    console.log("Start:", tracker.currentWeek.weekStartDate);
    console.log("End:", tracker.currentWeek.weekEndDate);
    console.log(`Activities: ${tracker.currentWeek.activities.length}`);
    console.log(`Total History Entries: ${tracker.history.length}`);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  }
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  process.exit(0);
});

initDb();
