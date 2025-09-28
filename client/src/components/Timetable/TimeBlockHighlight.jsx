import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";

const TimeBlockHighlight = ({
  isDark,
  toggleActivityStatus,
  getCategoryStyle,
  formatTimeRange,
  currentWeek,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayInHours, setDisplayInHours] = useState(true);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const currentDayIndex = useMemo(() => {
    const day = currentTime.getDay();
    return day === 0 ? 6 : day - 1;
  }, [currentTime]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { activeTimeBlock, upcomingActivity } = useMemo(() => {
    if (!currentWeek?.activities)
      return { activeTimeBlock: null, upcomingActivity: null };

    const now = currentTime;
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const time = new Date(now);
      time.setHours(hours, minutes, 0, 0);
      return time;
    };

    let currentActivity = null;
    let nextActivity = null;
    let minTimeDiff = Infinity;

    currentWeek.activities.forEach((activity) => {
      const [startTime, endTime] = activity.activity.time.split("-");
      let start = parseTime(startTime);
      let end = parseTime(endTime);

      if (end < start) end.setDate(end.getDate() + 1);

      if (now >= start && now <= end) {
        currentActivity = activity;
      } else if (start > now) {
        const timeDiff = start - now;
        if (timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          nextActivity = {
            ...activity,
            startsIn: Math.round(timeDiff / (1000 * 60)), // minutes until start
            startTime: startTime,
          };
        }
      }
    });

    return {
      activeTimeBlock: currentActivity,
      upcomingActivity: nextActivity,
    };
  }, [currentTime, currentWeek]);

  if (!activeTimeBlock && upcomingActivity) {
    const formatUpcomingDuration = (minutesTotal) => {
      // Always show minutes if less than 60 minutes, regardless of displayInHours setting
      if (minutesTotal < 60) {
        return `${minutesTotal} min`;
      }

      // For 60+ minutes, respect user's display preference
      if (!displayInHours) {
        return `${minutesTotal} min`;
      }

      const hours = Math.floor(minutesTotal / 60);
      const remainingMinutes = minutesTotal % 60;

      if (remainingMinutes === 0) {
        return `${hours} hr`;
      }

      // More concise format for mixed hours and minutes
      return `${hours}h ${remainingMinutes}m`;
    };

    return (
      <div
        className={`max-w-3xl mx-auto rounded-lg border shadow-sm overflow-hidden mb-4 ${
          isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"
        }`}
      >
        <div
          className={`px-4 py-3 border-b ${
            isDark
              ? "bg-gray-950/50 border-gray-800"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              No Current Activity
            </span>

            {/* Time format toggle with clear visual indication */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full ${
                  isDark
                    ? displayInHours
                      ? "bg-orange-900/50 text-orange-300"
                      : "bg-blue-900/50 text-blue-300"
                    : displayInHours
                    ? "bg-orange-100 text-orange-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">
                  Next in {formatUpcomingDuration(upcomingActivity.startsIn)}
                </span>
              </div>

              {upcomingActivity.startsIn >= 60 && (
                <button
                  onClick={() => setDisplayInHours((prev) => !prev)}
                  aria-label={`Switch to ${
                    displayInHours ? "minutes" : "hours"
                  } format`}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 border-2 border-dashed ${
                    isDark
                      ? displayInHours
                        ? "border-orange-500 bg-orange-900/20 text-orange-400 hover:bg-orange-900/30"
                        : "border-blue-500 bg-blue-900/20 text-blue-400 hover:bg-blue-900/30"
                      : displayInHours
                      ? "border-orange-400 bg-orange-50 text-orange-600 hover:bg-orange-100"
                      : "border-blue-400 bg-blue-50 text-blue-600 hover:bg-blue-100"
                  } hover:scale-105 cursor-pointer`}
                >
                  <span className="text-[10px] opacity-70">
                    {displayInHours ? "min" : "hr"}
                  </span>
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${
                      displayInHours ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m0-4l4-4"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`p-4 ${isDark ? "bg-gray-900/30" : "bg-gray-50/50"}`}>
          <div className="flex items-center gap-3">
            <ArrowRight
              className={`w-5 h-5 ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            />
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Upcoming: {upcomingActivity.activity.name}
              </p>
              <p
                className={`text-xs mt-1 ${
                  isDark
                    ? displayInHours
                      ? "text-orange-400"
                      : "text-blue-400"
                    : displayInHours
                    ? "text-orange-600"
                    : "text-blue-600"
                }`}
              >
                Starts at {upcomingActivity.startTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeTimeBlock) return null;

  const style = getCategoryStyle();
  const isCompleted = activeTimeBlock.dailyStatus[currentDayIndex];

  return (
    <div
      className={`max-w-3xl mx-auto rounded-lg border shadow-sm overflow-hidden mb-4 ${
        isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"
      }`}
    >
      <table className="w-full table-fixed">
        <thead
          className={
            isDark
              ? "bg-gray-950 border-b border-gray-800"
              : "bg-gray-100 border-b border-gray-200"
          }
        >
          <tr>
            <th className="w-1/2">
              <div
                className={`py-2 px-1 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Current Activity
              </div>
            </th>
            <th className="w-1/4">
              <div
                className={`py-2 px-1 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <div className="flex items-center gap-1 justify-center">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  Time
                </div>
              </div>
            </th>
            <th className="w-1/4">
              <div
                className={`py-2 px-1 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {days[currentDayIndex]}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <motion.tr
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`transition-all duration-200 group ${style.bg}`}
          >
            <td className="py-3 px-2">
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`mx-auto max-w-xs text-center px-3 py-1.5 text-[10px] sm:text-xs rounded-md font-medium border ${
                  style.border
                } 
                  group-hover:scale-[1.02] transition-transform
                  ${
                    isDark
                      ? "bg-gray-950 text-gray-300"
                      : "bg-white text-gray-700"
                  }`}
              >
                {activeTimeBlock.activity.name}
              </motion.div>
            </td>
            <td className="py-3 px-2">
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`mx-auto max-w-xs text-center px-2 py-1.5 text-[10px] sm:text-xs rounded-md border
                  ${
                    isDark
                      ? "bg-gray-950 text-gray-400 border-gray-900"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
              >
                {formatTimeRange(activeTimeBlock.activity.time)}
              </motion.div>
            </td>
            <td className="py-3 px-2">
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    toggleActivityStatus(activeTimeBlock._id, currentDayIndex)
                  }
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    isDark
                      ? isCompleted
                        ? "bg-green-950 hover:bg-green-900"
                        : "bg-red-950 hover:bg-red-900"
                      : isCompleted
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-red-50 hover:bg-red-100"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isDark ? "text-green-500" : "text-green-600"
                      }`}
                    />
                  ) : (
                    <XCircle
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isDark ? "text-red-500" : "text-red-600"
                      }`}
                    />
                  )}
                </motion.button>
              </div>
            </td>
          </motion.tr>
        </tbody>
      </table>
    </div>
  );
};

export default TimeBlockHighlight;
