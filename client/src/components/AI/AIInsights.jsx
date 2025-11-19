import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  Zap,
  Clock,
  Calendar,
  Briefcase,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import LoadingSpinner from "../common/LoadingSpinner";
import FormattedMessage from "./FormattedMessage";

const AIInsights = ({ insights, isLoading }) => {
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner />
        <p
          className={`mt-4 text-sm ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Analyzing your productivity data...
        </p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-16 px-4">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            isDark ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-300"
          }`}
        >
          <Zap className="w-10 h-10" />
        </div>
        <h3
          className={`text-xl font-semibold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          No insights yet
        </h3>
        <p
          className={`max-w-md mx-auto ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Generate insights to get a deep dive into your productivity patterns
          and performance.
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: "Schedules",
      value: insights.dataStats?.totalSchedules || 0,
      icon: Calendar,
      color: "blue",
    },
    {
      label: "Skills",
      value: insights.dataStats?.totalSkills || 0,
      icon: Target,
      color: "green",
    },
    {
      label: "Timetables",
      value: insights.dataStats?.totalTimetables || 0,
      icon: Clock,
      color: "purple",
    },
    {
      label: "Work Records",
      value: insights.dataStats?.totalWorkingHourRecords || 0,
      icon: Briefcase,
      color: "orange",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      {insights.dataStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-md ${
                isDark
                  ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800"
                  : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-2.5 rounded-xl ${
                    isDark
                      ? `bg-${stat.color}-500/10 text-${stat.color}-400`
                      : `bg-${stat.color}-50 text-${stat.color}-600`
                  }`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p
                  className={`text-sm font-medium mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {stat.label}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Insights Content */}
      <div
        className={`rounded-3xl p-8 border ${
          isDark
            ? "bg-gray-800/30 border-gray-700/50"
            : "bg-white border-gray-100 shadow-xl shadow-gray-200/40"
        }`}
      >
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div
            className={`p-2 rounded-lg ${
              isDark
                ? "bg-indigo-500/20 text-indigo-400"
                : "bg-indigo-50 text-indigo-600"
            }`}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Productivity Analysis
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              AI-generated insights based on your recent activity
            </p>
          </div>
        </div>

        <div className="max-w-none">
          <FormattedMessage
            content={insights.insights}
            className="text-base leading-relaxed space-y-4"
          />
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
