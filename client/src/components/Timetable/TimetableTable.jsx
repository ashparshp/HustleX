import React, { useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import TimetableToggle from "./TimetableToggle";

const TimetableTableBase = ({
  currentWeek,
  isDark,
  toggleActivityStatus,
  getCategoryStyle,
  formatTimeRange
}) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const containerVariants = React.useMemo(
    () => ({
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.1
        }
      }
    }),
    []
  );

  const rowVariants = React.useMemo(
    () => ({
      hidden: {
        opacity: 0,
        x: -20,
        scale: 0.98
      },
      show: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
          type: "tween",
          duration: 0.3
        }
      },
      exit: {
        opacity: 0,
        x: 20,
        scale: 0.98,
        transition: {
          duration: 0.2
        }
      }
    }),
    []
  );

  const handleToggleActivityStatus = useCallback(
    (activityId, dayIndex) => {
      toggleActivityStatus(activityId, dayIndex);
    },
    [toggleActivityStatus]
  );

  const tableKey = currentWeek?.weekStartDate || "timetable";

  return (
    <div className="relative overflow-x-auto">
      <motion.table
        key={tableKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full min-w-[800px] shadow-sm rounded-lg overflow-hidden">

        <thead>
          <tr
            className={
            isDark ?
            "bg-gray-950 border-b border-gray-900" :
            "bg-gray-100 border-b border-gray-200"
            }>

            <th
              className={`p-3 text-center text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-gray-400" : "text-gray-600"}`
              }>

              Activity
            </th>
            <th
              className={`p-3 text-left text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-gray-400" : "text-gray-600"}`
              }>

              <div className="flex items-center justify-center gap-2">
                <Clock
                  className={`w-4 h-4 ${
                  isDark ? "text-gray-500" : "text-gray-600"}`
                  } />

                Time
              </div>
            </th>
            {days.map((day) =>
            <th
              key={day}
              className={`p-3 text-center text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-gray-400" : "text-gray-600"}`
              }>

                {day}
              </th>
            )}
          </tr>
        </thead>
        <motion.tbody
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={`${
          isDark ? "bg-black" : "bg-white"} divide-y divide-dashed`
          }>

          <AnimatePresence mode="popLayout">
            {currentWeek?.activities.map((activityItem) => {
              const style = getCategoryStyle();
              return (
                <motion.tr
                  key={activityItem._id}
                  variants={rowVariants}
                  layout
                  className={`transition-all duration-200 group ${style.bg} 
                      ${isDark ? "border-gray-900" : "border-gray-100"}`}>

                  <td className="p-3 text-center">
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`px-3 py-1.5 text-xs rounded-md font-medium border ${
                      style.border} group-hover:scale-[1.02] transition-transform
                      ${

                      isDark ?
                      "bg-gray-950 text-gray-300" :
                      "bg-white text-gray-700"}`
                      }>

                      {activityItem.activity.name}
                    </motion.div>
                  </td>
                  <td className="p-3">
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={`px-3 py-1.5 text-xs rounded-md text-center border
                          ${
                      isDark ?
                      "bg-gray-950 text-gray-400 border-gray-900" :
                      "bg-white text-gray-600 border-gray-200"}`
                      }>

                      {formatTimeRange(activityItem.activity.time)}
                    </motion.div>
                  </td>
                  {activityItem.dailyStatus.map((status, dayIndex) =>
                  <td key={dayIndex} className="p-3 text-center">
                      <TimetableToggle
                        activity={activityItem}
                        dayIndex={dayIndex}
                        dayName={days[dayIndex]}
                        onToggle={handleToggleActivityStatus}
                        isDark={isDark}
                      />
                    </td>
                  )}
                </motion.tr>);

            })}
          </AnimatePresence>
        </motion.tbody>
      </motion.table>
    </div>);

};

const TimetableTable = memo(TimetableTableBase);

export default TimetableTable;
