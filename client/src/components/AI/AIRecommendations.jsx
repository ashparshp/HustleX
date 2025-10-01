import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Target,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import LoadingSpinner from "../common/LoadingSpinner";

const AIRecommendations = ({ recommendations, isLoading }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? "text-gray-400" : "text-gray-500"}>
          No recommendations available yet
        </p>
      </div>
    );
  }

  const toggleItem = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const parseRecommendations = (recText) => {
    const items = [];
    const lines = recText.split("\n");
    let currentItem = null;
    let currentSection = null;

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Match numbered items like "1. **Title**" or "### 1. Title"
      const numberedMatch = trimmedLine.match(
        /^(?:###\s*)?(\d+)\.\s*\*\*(.+?)\*\*/
      );
      const headerMatch = trimmedLine.match(/^###\s*(\d+)\.\s*(.+)/);

      if (numberedMatch || headerMatch) {
        if (currentItem) items.push(currentItem);
        const match = numberedMatch || headerMatch;
        currentItem = {
          number: match[1],
          title: match[2].replace(/\*\*/g, ""),
          sections: [],
        };
        currentSection = null;
      } else if (currentItem) {
        // Check for sub-sections with asterisks
        const bulletMatch = trimmedLine.match(/^\*\s*\*\*(.+?)\*\*:?\s*(.*)/);
        if (bulletMatch) {
          currentSection = {
            title: bulletMatch[1],
            content: bulletMatch[2] ? [bulletMatch[2]] : [],
          };
          currentItem.sections.push(currentSection);
        } else if (trimmedLine.length > 0 && trimmedLine !== "---") {
          const cleanLine = trimmedLine.replace(/\*\*/g, "");
          if (currentSection) {
            currentSection.content.push(cleanLine);
          } else {
            currentItem.sections.push({ title: null, content: [cleanLine] });
          }
        }
      }
    });

    if (currentItem) items.push(currentItem);
    return items.length > 0 ? items : null;
  };

  const parsedRecommendations = parseRecommendations(
    recommendations.recommendations
  );

  return (
    <div className="space-y-6">
      {/* Focus Area */}
      {recommendations.focusArea && recommendations.focusArea !== "null" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border-l-4 border-blue-500 ${
            isDark
              ? "bg-gradient-to-r from-blue-900/20 to-indigo-900/20"
              : "bg-gradient-to-r from-blue-50 to-indigo-50"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Target className={isDark ? "text-blue-400" : "text-blue-600"} />
            <p
              className={`text-sm font-medium ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Focus Area
            </p>
          </div>
          <p
            className={`text-lg font-semibold capitalize ${
              isDark ? "text-blue-300" : "text-blue-700"
            }`}
          >
            {recommendations.focusArea}
          </p>
        </motion.div>
      )}

      {/* Recommendations List */}
      {parsedRecommendations ? (
        <div className="space-y-4">
          {parsedRecommendations.map((rec, index) => {
            const isExpanded = expandedItems[index] ?? true;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isDark
                    ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Recommendation Header */}
                <motion.button
                  whileHover={{
                    backgroundColor: isDark
                      ? "rgba(55, 65, 81, 0.5)"
                      : "rgba(249, 250, 251, 1)",
                  }}
                  onClick={() => toggleItem(index)}
                  className="w-full px-6 py-4 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {rec.number}
                    </div>
                    <h3
                      className={`text-xl font-semibold text-left ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {rec.title}
                    </h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp
                      className={`w-5 h-5 flex-shrink-0 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                  ) : (
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                  )}
                </motion.button>

                {/* Recommendation Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-6 pb-6 pt-2"
                    >
                      <div className="space-y-4">
                        {rec.sections.map((section, sectionIndex) => {
                          if (section.title) {
                            return (
                              <div
                                key={sectionIndex}
                                className={`rounded-lg p-4 border-l-4 border-blue-500 ${
                                  isDark ? "bg-gray-750" : "bg-gray-50"
                                }`}
                              >
                                <h4
                                  className={`font-semibold mb-2 flex items-start gap-2 ${
                                    isDark ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  <ArrowRight className="text-blue-500 mt-1 flex-shrink-0 w-5 h-5" />
                                  <span>{section.title}</span>
                                </h4>
                                {section.content
                                  .filter((c) => c.trim())
                                  .map((text, textIndex) => (
                                    <p
                                      key={textIndex}
                                      className={`text-sm leading-relaxed ml-6 mb-1 ${
                                        isDark
                                          ? "text-gray-300"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {text}
                                    </p>
                                  ))}
                              </div>
                            );
                          } else {
                            return section.content
                              .filter((c) => c.trim())
                              .map((text, textIndex) => (
                                <p
                                  key={`${sectionIndex}-${textIndex}`}
                                  className={`leading-relaxed ${
                                    isDark ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  {text}
                                </p>
                              ));
                          }
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      ) : (
        // Fallback: Show raw recommendations
        <div
          className={`p-6 rounded-xl border ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <div className="prose dark:prose-invert max-w-none">
            <pre
              className={`whitespace-pre-wrap text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {recommendations.recommendations}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIRecommendations;
