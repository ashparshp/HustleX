# Performance Analysis: Toggle Day Operation

## Overview

This document analyzes the significant performance difference observed between the Node.js (Mongoose) implementation and the Go (Mongo Driver) implementation for the "Toggle Day" operation in the Timetable feature.

**Benchmark Results:**
*   **Node.js:** ~695 ms
*   **Go:** ~1.72 ms

## Implementation Comparison

### Node.js (Mongoose)

In the Node.js implementation (`server/controllers/timetable.js`), the `toggleActivityStatus` function performs the following steps:

1.  **Fetch Document:** `await Timetable.findOne(...)` retrieves the entire Timetable document, including all history and activities.
2.  **Mongoose Hydration:** The raw MongoDB document is converted into a heavy Mongoose Document object. This involves overhead for getters/setters, change tracking, and virtuals.
3.  **Subdocument Search:** `timetable.currentWeek.activities.id(activityId)` searches the array.
4.  **In-Memory Modification:** The boolean status is toggled in memory.
5.  **Save:** `await timetable.save()` is called.
    *   **Pre-save Hook:** Mongoose triggers the `pre('save')` hook defined in `models/Timetable.js`.
    *   **Recalculation:** This hook iterates over *all* activities in the current week AND *all* weeks in history to recalculate `completionRate` and `overallCompletionRate`.
    *   **Validation:** Mongoose runs schema validation on the entire document.
    *   **DB Update:** Finally, it sends an update command to MongoDB.

**Key Bottleneck:** The `pre('save')` hook recalculating statistics for the entire history on every toggle is likely the primary cause of latency, combined with the overhead of hydrating the full Mongoose document.

### Go (Official Driver)

In the Go implementation (`backend-go/internal/handlers/timetable_handler.go`), the `ToggleActivityStatus` function performs:

1.  **Fetch Document:** `collection.FindOne(...)` retrieves the document. The Go driver unmarshals this into a struct, which is generally faster than Mongoose hydration but still involves reflection.
2.  **In-Memory Modification:** Iterates the slice to find the activity and toggles the boolean.
3.  **Recalculation (Optimized):** Calls `calculateTimetableStats(&timetable)`.
    *   **Optimization:** This Go function *only* recalculates stats for the `CurrentWeek`. It does *not* iterate through the `History` array, assuming history is immutable.
4.  **DB Update:** `collection.UpdateOne(...)` sends the update.

**Why it's faster:**
1.  **Reduced Scope:** The stats recalculation only touches the current week, avoiding the O(N) operation over the entire history that the Node.js version performs.
2.  **Driver Efficiency:** The Go driver uses BSON directly and has less object overhead than Mongoose.
3.  **No Hooks:** There are no implicit pre-save hooks. The logic is explicit and minimal.

## Conclusion

The 400x performance improvement is primarily due to:
1.  **Algorithmic Optimization:** The Go implementation avoids recalculating immutable historical data.
2.  **Framework Overhead:** Removing Mongoose middleware and validation layers reduces processing time significantly.
