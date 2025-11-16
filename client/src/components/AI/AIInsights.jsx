import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Target,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import LoadingSpinner from "../common/LoadingSpinner";

const AIInsights = ({ insights, isLoading }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center py-12">
        <Zap
          className={`mx-auto w-16 h-16 mb-4 ${
            isDark ? "text-gray-600" : "text-gray-300"
          }`}
        />

        <p className={isDark ? "text-gray-400" : "text-gray-500"}>
          No insights available yet
        </p>
      </div>
    );
  }

  const parseInsights = (insightsText) => {
    if (!insightsText || typeof insightsText !== "string") return [];

    const sections = [];
    const lines = insightsText.split("\n");
    let currentSection = null;
    let currentSubsection = null;

    const startNewSection = (rawTitle) => {
      const title = rawTitle.replace(/\*\*/g, "").trim();
      currentSection = { title, items: [], type: "main" };
      sections.push(currentSection);
      currentSubsection = null;
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Normalize bullet character variants
      const normalized = trimmedLine.replace(/^•\s*/, "* ");

      // Headings: support 1-4 #'s and optional leading enumerations (e.g., #### 1. Productivity Patterns)
      const headingMatch = normalized.match(/^#{1,4}\s+(?:\d+\.\s+)?(.+)/);
      if (headingMatch) {
        startNewSection(headingMatch[1]);
        return;
      }

      // Numbered bold heading fallback (e.g., 1. **Strengths**)
      const numberedBold = normalized.match(/^\d+\.\s+\*\*(.+?)\*\*/);
      if (numberedBold) {
        startNewSection(numberedBold[1]);
        return;
      }

      // Bullet with bold title pattern: * **Title:** content OR * **Title**: content
      const bulletWithTitle = normalized.match(/^\*\s+\*\*(.+?)\*\*:?\s*(.*)$/);
      if (bulletWithTitle) {
        const bulletTitle = bulletWithTitle[1].trim();
        const bulletContent = bulletWithTitle[2].trim();
        currentSubsection = {
          title: bulletTitle,
          content: bulletContent ? [bulletContent] : [],
          type: "bullet",
        };
        if (currentSection) currentSection.items.push(currentSubsection);
        return;
      }

      // Generic bullet line (capture as text under current section or subsection)
      const genericBullet = normalized.match(/^\*\s+(.*)$/);
      if (genericBullet) {
        const content = genericBullet[1].replace(/\*\*/g, "").trim();
        if (currentSubsection) {
          currentSubsection.content.push(content);
        } else if (currentSection) {
          currentSection.items.push({ type: "text", content });
        }
        return;
      }

      // Numbered line content (inside subsection or section)
      const numberedLine = normalized.match(/^\d+\.\s+(.+)/);
      if (numberedLine) {
        const content = numberedLine[1].replace(/\*\*/g, "").trim();
        if (currentSubsection) {
          currentSubsection.content.push(content);
        } else if (currentSection) {
          currentSection.items.push({ type: "text", content });
        }
        return;
      }

      // Fallback: plain text line
      if (trimmedLine !== "---") {
        const content = normalized.replace(/\*\*/g, "").trim();
        if (currentSubsection) {
          currentSubsection.content.push(content);
        } else if (currentSection) {
          currentSection.items.push({ type: "text", content });
        } else {
          // Create an implicit section if none exists yet
          startNewSection("Summary");
          currentSection.items.push({ type: "text", content });
        }
      }
    });

    return sections.filter((s) => s.items.length > 0);
  };

  const sections = parseInsights(insights.insights);

  const getIcon = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("trend") || lowerTitle.includes("pattern"))
      return <TrendingUp className="text-blue-500 w-5 h-5" />;
    if (lowerTitle.includes("strength") || lowerTitle.includes("skill"))
      return <Target className="text-green-500 w-5 h-5" />;
    if (
      lowerTitle.includes("recommendation") ||
      lowerTitle.includes("actionable")
    )
      return <Zap className="text-yellow-500 w-5 h-5" />;
    if (lowerTitle.includes("time") || lowerTitle.includes("management"))
      return <Clock className="text-purple-500 w-5 h-5" />;
    if (lowerTitle.includes("improvement") || lowerTitle.includes("area"))
      return <AlertCircle className="text-orange-500 w-5 h-5" />;
    return <CheckCircle className="text-blue-500 w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {}
      {insights.dataStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${
              isDark
                ? "bg-blue-900/20 border-blue-800"
                : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
            }`}
          >
            <p
              className={`text-xs font-medium mb-1 ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Schedules
            </p>
            <p
              className={`text-3xl font-bold ${
                isDark ? "text-blue-300" : "text-blue-700"
              }`}
            >
              {insights.dataStats.totalSchedules}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-xl border ${
              isDark
                ? "bg-green-900/20 border-green-800"
                : "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
            }`}
          >
            <p
              className={`text-xs font-medium mb-1 ${
                isDark ? "text-green-400" : "text-green-600"
              }`}
            >
              Skills
            </p>
            <p
              className={`text-3xl font-bold ${
                isDark ? "text-green-300" : "text-green-700"
              }`}
            >
              {insights.dataStats.totalSkills}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-xl border ${
              isDark
                ? "bg-purple-900/20 border-purple-800"
                : "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
            }`}
          >
            <p
              className={`text-xs font-medium mb-1 ${
                isDark ? "text-purple-400" : "text-purple-600"
              }`}
            >
              Timetables
            </p>
            <p
              className={`text-3xl font-bold ${
                isDark ? "text-purple-300" : "text-purple-700"
              }`}
            >
              {insights.dataStats.totalTimetables}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-4 rounded-xl border ${
              isDark
                ? "bg-orange-900/20 border-orange-800"
                : "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
            }`}
          >
            <p
              className={`text-xs font-medium mb-1 ${
                isDark ? "text-orange-400" : "text-orange-600"
              }`}
            >
              Work Records
            </p>
            <p
              className={`text-3xl font-bold ${
                isDark ? "text-orange-300" : "text-orange-700"
              }`}
            >
              {insights.dataStats.totalWorkingHourRecords}
            </p>
          </motion.div>
        </div>
      )}

      {}
      <div className="space-y-4">
        {sections.map((section, index) => {
          const isExpanded = expandedSections[index] ?? true;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                isDark
                  ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              {}
              <motion.button
                whileHover={{
                  backgroundColor: isDark
                    ? "rgba(55, 65, 81, 0.5)"
                    : "rgba(249, 250, 251, 1)",
                }}
                onClick={() => toggleSection(index)}
                className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                  isDark ? "" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {getIcon(section.title)}
                  <h3
                    className={`text-xl font-semibold text-left ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {section.title}
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

              {}
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
                      {section.items.map((item, itemIndex) => {
                        if (item.type === "bullet") {
                          return (
                            <div
                              key={itemIndex}
                              className={`rounded-lg p-4 border-l-4 border-blue-500 ${
                                isDark ? "bg-gray-750" : "bg-gray-50"
                              }`}
                            >
                              <h4
                                className={`font-semibold mb-2 flex items-start gap-2 ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{item.title}</span>
                              </h4>
                              {item.content
                                .filter((c) => c.trim())
                                .map((text, textIndex) => (
                                  <p
                                    key={textIndex}
                                    className={`text-sm leading-relaxed ml-6 mb-1 ${
                                      isDark ? "text-gray-300" : "text-gray-600"
                                    }`}
                                  >
                                    {text}
                                  </p>
                                ))}
                            </div>
                          );
                        } else if (item.type === "text") {
                          return (
                            <p
                              key={itemIndex}
                              className={`leading-relaxed ${
                                isDark ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {item.content}
                            </p>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AIInsights;
