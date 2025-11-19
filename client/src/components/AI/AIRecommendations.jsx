import { motion } from "framer-motion";
import { Target, AlertCircle, Lightbulb } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import LoadingSpinner from "../common/LoadingSpinner";
import FormattedMessage from "./FormattedMessage";

const AIRecommendations = ({ recommendations, isLoading }) => {
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
          Generating personalized recommendations...
        </p>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="text-center py-16 px-4">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
            isDark ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-300"
          }`}
        >
          <Lightbulb className="w-10 h-10" />
        </div>
        <h3
          className={`text-xl font-semibold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          No recommendations yet
        </h3>
        <p
          className={`max-w-md mx-auto ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Get tailored advice to improve your productivity and reach your goals
          faster.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Quality Warning */}
      {recommendations.quality && recommendations.quality.score < 75 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border-l-4 border-amber-500 ${
            isDark
              ? "bg-amber-900/10 border-amber-500/50"
              : "bg-amber-50 border-amber-500"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isDark ? "text-amber-400" : "text-amber-600"
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-amber-400" : "text-amber-700"
                }`}
              >
                Limited Data Context
              </p>
              <p
                className={`text-sm mt-1 ${
                  isDark ? "text-amber-300/80" : "text-amber-700/80"
                }`}
              >
                Some recommendations may be generic.{" "}
                {recommendations.quality.warnings?.join(". ")}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Focus Area Badge */}
      {recommendations.focusArea && recommendations.focusArea !== "null" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
            isDark
              ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">
            Focus:{" "}
            <span className="capitalize">{recommendations.focusArea}</span>
          </span>
        </motion.div>
      )}

      {/* Main Content */}
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
                ? "bg-green-500/20 text-green-400"
                : "bg-green-50 text-green-600"
            }`}
          >
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Actionable Recommendations
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Data-driven steps to optimize your workflow
            </p>
          </div>
        </div>

        <div className="max-w-none">
          <FormattedMessage
            content={recommendations.recommendations}
            className="text-base leading-relaxed space-y-6"
          />
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
