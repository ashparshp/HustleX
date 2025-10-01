import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Target,
  AlertCircle,
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

      // Match numbered items with ### heading format: "### 1. Title" or "### 1. **Title**"
      const h3Match = trimmedLine.match(
        /^###\s*(\d+)\.\s*(?:\*\*)?(.+?)(?:\*\*)?$/
      );

      // Match numbered items with bold: "1. **Title**"
      const boldMatch = trimmedLine.match(/^(\d+)\.\s*\*\*(.+?)\*\*$/);

      // Match plain numbered items: "1. Title"
      const plainMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);

      const match = h3Match || boldMatch || plainMatch;

      if (match) {
        // Save previous item if exists
        if (currentItem) items.push(currentItem);

        currentItem = {
          number: match[1],
          title: match[2].replace(/\*\*/g, "").trim(),
          sections: [],
        };
        currentSection = null;
      } else if (currentItem) {
        // Check for section headers: "**Detailed Explanation:**" or "**Expected Impact:**"
        const sectionMatch = trimmedLine.match(/^\*\*([^*]+):\*\*\s*(.*)$/);

        if (sectionMatch) {
          const sectionTitle = sectionMatch[1].trim();
          const sectionContent = sectionMatch[2].trim();

          currentSection = {
            title: sectionTitle,
            content: sectionContent ? [sectionContent] : [],
          };
          currentItem.sections.push(currentSection);
        } else if (trimmedLine.length > 0 && trimmedLine !== "---") {
          // Regular content line
          const cleanLine = trimmedLine.replace(/^\*\s*/, ""); // Remove leading asterisk if bullet

          if (currentSection) {
            // Add to current section
            currentSection.content.push(cleanLine);
          } else {
            // Create unnamed section for orphan content
            currentItem.sections.push({
              title: null,
              content: [cleanLine],
            });
          }
        }
      }
    });

    // Don't forget the last item
    if (currentItem) items.push(currentItem);

    return items.length > 0 ? items : null;
  };

  const parsedRecommendations = parseRecommendations(
    recommendations.recommendations
  );

  return (
    <div className="space-y-6">
      {/* Quality Indicator */}
      {recommendations.quality && recommendations.quality.score < 75 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border-l-4 border-amber-500 ${
            isDark
              ? "bg-gradient-to-r from-amber-900/20 to-orange-900/20"
              : "bg-gradient-to-r from-amber-50 to-orange-50"
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertCircle
              className={`w-5 h-5 mt-0.5 ${
                isDark ? "text-amber-400" : "text-amber-600"
              }`}
            />
            <div>
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-amber-400" : "text-amber-600"
                }`}
              >
                Limited Data Context
              </p>
              <p
                className={`text-xs mt-1 ${
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
                            // Determine section type for styling
                            const isImplementation = section.title
                              .toLowerCase()
                              .includes("implement");
                            const isImpact = section.title
                              .toLowerCase()
                              .includes("impact");
                            const isExplanation = section.title
                              .toLowerCase()
                              .includes("explanation");

                            return (
                              <div
                                key={sectionIndex}
                                className={`rounded-lg p-4 border-l-4 ${
                                  isImplementation
                                    ? "border-green-500"
                                    : isImpact
                                    ? "border-purple-500"
                                    : "border-blue-500"
                                } ${isDark ? "bg-gray-750" : "bg-gray-50"}`}
                              >
                                <h4
                                  className={`font-semibold mb-3 flex items-start gap-2 ${
                                    isDark ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  {isImplementation ? (
                                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0 w-5 h-5" />
                                  ) : isImpact ? (
                                    <Target className="text-purple-500 mt-1 flex-shrink-0 w-5 h-5" />
                                  ) : (
                                    <ArrowRight className="text-blue-500 mt-1 flex-shrink-0 w-5 h-5" />
                                  )}
                                  <span>{section.title}</span>
                                </h4>
                                <div
                                  className={`ml-6 space-y-2 ${
                                    isImplementation ? "space-y-3" : "space-y-2"
                                  }`}
                                >
                                  {section.content
                                    .filter((c) => c.trim())
                                    .map((text, textIndex) => {
                                      // Check if this is a numbered step (starts with number)
                                      const stepMatch =
                                        text.match(/^(\d+)\.\s*(.+)$/);

                                      if (stepMatch && isImplementation) {
                                        return (
                                          <div
                                            key={textIndex}
                                            className="flex gap-3 items-start"
                                          >
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold">
                                              {stepMatch[1]}
                                            </div>
                                            <p
                                              className={`text-sm leading-relaxed flex-1 ${
                                                isDark
                                                  ? "text-gray-300"
                                                  : "text-gray-600"
                                              }`}
                                            >
                                              {stepMatch[2]}
                                            </p>
                                          </div>
                                        );
                                      }

                                      return (
                                        <p
                                          key={textIndex}
                                          className={`text-sm leading-relaxed ${
                                            isDark
                                              ? "text-gray-300"
                                              : "text-gray-600"
                                          }`}
                                        >
                                          {text}
                                        </p>
                                      );
                                    })}
                                </div>
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
