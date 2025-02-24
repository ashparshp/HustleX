// require("dotenv").config({ path: "./.env" });
// const mongoose = require("mongoose");
// const ActivityTracker = require("../models/ActivityTracker");

// async function createPreviousWeekHistory() {
//   try {
//     const tracker = await ActivityTracker.findOne();
//     if (!tracker) {
//       console.log(
//         "No existing tracker found. Skipping previous week history creation."
//       );
//       return;
//     }

//     // Calculate dates for the previous week
//     const now = new Date();
//     const currentWeekStart = new Date(tracker.currentWeek.weekStartDate);
//     const previousWeekEnd = new Date(currentWeekStart);
//     previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);

//     const previousWeekStart = new Date(previousWeekEnd);
//     previousWeekStart.setDate(previousWeekStart.getDate() - 6);

//     // Create a mock previous week with some completion
//     const previousWeek = {
//       weekStartDate: previousWeekStart,
//       weekEndDate: previousWeekEnd,
//       activities: tracker.currentWeek.activities.map((currentActivity) => ({
//         activity: currentActivity.activity,
//         dailyStatus: [
//           Math.random() > 0.3, // Randomly set some days as completed
//           Math.random() > 0.3,
//           Math.random() > 0.3,
//           Math.random() > 0.3,
//           Math.random() > 0.3,
//           Math.random() > 0.3,
//           Math.random() > 0.3,
//         ],
//         completionRate: 0, // Will be calculated in pre-save middleware
//       })),
//       overallCompletionRate: 0, // Will be calculated in pre-save middleware
//     };

//     // Add the previous week to history
//     tracker.history.push(previousWeek);

//     // Save the tracker
//     await tracker.save();

//     console.log("\n✅ Previous week history created:");
//     console.log("Previous Week Start:", previousWeekStart);
//     console.log("Previous Week End:", previousWeekEnd);
//     console.log(
//       `Activities in Previous Week: ${previousWeek.activities.length}`
//     );

//     return tracker;
//   } catch (error) {
//     console.error("\n❌ Error creating previous week history:", error.message);
//     throw error;
//   }
// }

// async function initDb() {
//   try {
//     if (!process.env.MONGODB_URI) {
//       throw new Error("MONGODB_URI is not defined in environment variables");
//     }

//     console.log("Connecting to MongoDB...");
//     await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000,
//     });
//     console.log("✅ Connected to MongoDB");

//     const existingTracker = await ActivityTracker.findOne();
//     if (existingTracker) {
//       console.log("⚠️  Existing tracker found. Clearing data...");
//       await ActivityTracker.deleteMany({});
//     }

//     console.log("Initializing new activity tracker...");
//     const tracker = await ActivityTracker.initializeDefault();

//     console.log("\n✅ Activity tracker initialized successfully!");
//     console.log("\nDefault Activities:");
//     console.table(
//       tracker.defaultActivities.map((act) => ({
//         name: act.name,
//         time: act.time,
//         category: act.category,
//       }))
//     );

//     console.log("\nCurrent Week:");
//     console.log("Start:", tracker.currentWeek.weekStartDate);
//     console.log("End:", tracker.currentWeek.weekEndDate);
//     console.log(`Activities: ${tracker.currentWeek.activities.length}`);

//     // Create previous week history
//     await createPreviousWeekHistory();
//   } catch (error) {
//     console.error("\n❌ Error:", error.message);
//     console.error("\nFull error:", error);
//     process.exit(1);
//   } finally {
//     await mongoose.disconnect();
//     console.log("\n✅ Database connection closed");
//     process.exit(0);
//   }
// }

// process.on("SIGINT", async () => {
//   await mongoose.disconnect();
//   process.exit(0);
// });

// initDb();

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

      // Preserve history
      const existingHistory = tracker.history;

      // Reset current week with default activities
      const defaultActivities = [
        { name: "Interviews", time: "09:00-12:00", category: "Career" },
        { name: "Go Backend", time: "12:00-14:00", category: "Backend" },
        { name: "Maths & OS", time: "14:00-17:00", category: "Core" },
        { name: "MERN Stack", time: "18:00-20:00", category: "Frontend" },
        { name: "DS & Algo", time: "20:00-22:00", category: "Core" },
        { name: "Java Stack", time: "22:00-00:00", category: "Backend" },
        { name: "Mobile Dev", time: "02:00-04:00", category: "Mobile" },
      ];

      // Calculate new week dates
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday, etc.

      // Calculate Monday (start of week)
      const monday = new Date(now);
      if (currentDay === 0) {
        // If today is Sunday, go back 6 days to previous Monday
        monday.setDate(now.getDate() - 6);
      } else {
        // Otherwise, go back to Monday of current week
        monday.setDate(now.getDate() - (currentDay - 1));
      }
      monday.setHours(0, 0, 0, 0);

      // Calculate Sunday (end of week)
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // Update tracker
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

      // Preserve or limit history if needed
      tracker.history = existingHistory.slice(-10); // Keep last 10 history entries if desired

      await tracker.save();
    } else {
      // If no tracker exists, create a new one
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
