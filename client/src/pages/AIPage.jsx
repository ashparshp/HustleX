import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  TrendingUp,
  Star,
  Calendar,
  BarChart2,
  FileText,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import AIChat from "../components/AI/AIChat";
import AIInsights from "../components/AI/AIInsights";
import AIRecommendations from "../components/AI/AIRecommendations";
import FormattedMessage from "../components/AI/FormattedMessage";
import { useAI } from "../hooks";
import SEOHead from "../components/SEO/SEOHead";
import { PAGE_SEO } from "../utils/seoConfig";

const AIPage = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [scheduleSuggestions, setScheduleSuggestions] = useState(null);
  const [skillAnalysis, setSkillAnalysis] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [detailLevel, setDetailLevel] = useState("detailed");

  const {
    isLoading,
    error,
    chat,
    getInsights,
    getRecommendations,
    getScheduleSuggestions,
    analyzeSkills,
    getWeeklyReport,
  } = useAI();

  const handleSendMessage = async (message) => {
    const userMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);

    try {
      console.log("Sending message:", message);
      const response = await chat(message);
      console.log("Chat response:", response);
      const assistantMessage = {
        role: "assistant",
        content:
          response?.aiResponse || response?.answer || "No response received",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleGetInsights = async () => {
    try {
      console.log("Getting insights with detail level:", detailLevel);
      const data = await getInsights(detailLevel);
      console.log("Insights data:", data);
      setInsights(data);
    } catch (err) {
      console.error("Insights error:", err);
    }
  };

  const handleGetRecommendations = async (focusArea = null) => {
    try {
      console.log("Getting recommendations, focus:", focusArea);
      const data = await getRecommendations(focusArea);
      console.log("Recommendations data:", data);
      setRecommendations(data);
    } catch (err) {
      console.error("Recommendations error:", err);
    }
  };

  const handleGetScheduleSuggestions = async () => {
    try {
      console.log("Getting schedule suggestions...");
      const data = await getScheduleSuggestions();
      console.log("Schedule data:", data);
      setScheduleSuggestions(data);
    } catch (err) {
      console.error("Schedule suggestions error:", err);
    }
  };

  const handleAnalyzeSkills = async () => {
    try {
      console.log("Analyzing skills...");
      const data = await analyzeSkills();
      console.log("Skills analysis data:", data);
      setSkillAnalysis(data);
    } catch (err) {
      console.error("Skill analysis error:", err);
    }
  };

  const handleGetWeeklyReport = async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    try {
      console.log("Getting weekly report...");
      const data = await getWeeklyReport(
        startDate.toISOString(),
        endDate.toISOString()
      );
      console.log("Weekly report data:", data);
      setWeeklyReport(data);
    } catch (err) {
      console.error("Weekly report error:", err);
    }
  };

  const tabs = [
    { id: "chat", label: "AI Chat", icon: MessageSquare },
    { id: "insights", label: "Insights", icon: TrendingUp },
    { id: "recommendations", label: "Recommendations", icon: Star },
    { id: "schedule", label: "Schedule Ideas", icon: Calendar },
    { id: "skills", label: "Skill Analysis", icon: BarChart2 },
    { id: "report", label: "Weekly Report", icon: FileText },
  ];

  const { isDark } = useTheme();

  return (
    <>
      <SEOHead {...PAGE_SEO.ai} />
      <section className={`py-16 relative ${isDark ? "bg-black" : "bg-white"}`}>
        <div
          className={`absolute inset-0 bg-gradient-to-b ${
            isDark
              ? "from-indigo-900/10 via-black to-black"
              : "from-indigo-100/50 via-white to-white"
          }`}
        />

        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_50%)]"
              : "bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]"
          }`}
        />

        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {}
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-3xl font-bold mb-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              AI Assistant
            </motion.h1>
            <div
              className={`w-32 h-1 bg-gradient-to-r ${
                isDark
                  ? "from-white to-gray-500"
                  : "from-indigo-600 to-indigo-300"
              } rounded-full`}
            />
          </div>

          {}
          <div
            className={`rounded-lg shadow-md mb-6 overflow-hidden ${
              isDark
                ? "bg-gray-900/50 border border-gray-700"
                : "bg-white border border-gray-200"
            }`}
          >
            <div
              className={`flex border-b ${
                isDark ? "border-gray-700" : "border-gray-200"
              } overflow-x-auto`}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id
                        ? isDark
                          ? "text-indigo-300 border-b-2 border-indigo-400 bg-indigo-500/10"
                          : "text-indigo-700 border-b-2 border-indigo-500 bg-indigo-50"
                        : isDark
                        ? "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg border ${
                isDark
                  ? "bg-red-900/20 border-red-800"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p className={isDark ? "text-red-400" : "text-red-600"}>
                {error}
              </p>
            </motion.div>
          )}

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-lg shadow-lg p-6 ${
              isDark
                ? "bg-gray-900/50 border border-gray-700"
                : "bg-white border border-gray-200"
            }`}
          >
            {activeTab === "chat" && (
              <div className="h-[600px]">
                <AIChat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                />
              </div>
            )}

            {activeTab === "insights" && (
              <div>
                {!insights ? (
                  <div className="text-center py-12">
                    <p
                      className={`mb-6 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Generate AI-powered insights about your productivity
                    </p>

                    {}
                    <div className="mb-6 flex justify-center gap-2 flex-wrap">
                      {["brief", "detailed", "comprehensive"].map((level) => (
                        <motion.button
                          key={level}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setDetailLevel(level)}
                          className={`px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-300 capitalize ${
                            detailLevel === level
                              ? isDark
                                ? "bg-indigo-500/20 border-2 border-indigo-400 text-indigo-300"
                                : "bg-indigo-200/70 border-2 border-indigo-500 text-indigo-700"
                              : isDark
                              ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                              : "bg-indigo-100/50 border border-indigo-300/50 text-indigo-600 hover:bg-indigo-200/70"
                          }`}
                        >
                          {level}
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGetInsights}
                      disabled={isLoading}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                        isDark
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400"
                          : "bg-emerald-100/50 border border-emerald-300/50 text-emerald-600 hover:bg-emerald-200/70 hover:border-emerald-500"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? "Generating..." : "Generate Insights"}
                    </motion.button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                      <div className="flex gap-2 items-center">
                        <span
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Detail Level:
                        </span>
                        <span
                          className={`text-sm font-medium capitalize px-3 py-1 rounded-lg ${
                            isDark
                              ? "bg-indigo-900/30 text-indigo-300 border border-indigo-500/30"
                              : "bg-indigo-100 text-indigo-600 border border-indigo-300"
                          }`}
                        >
                          {detailLevel}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setInsights(null);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-300 ${
                          isDark
                            ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400"
                            : "bg-indigo-100/50 border border-indigo-300/50 text-indigo-600 hover:bg-indigo-200/70 hover:border-indigo-500"
                        }`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Regenerate
                      </motion.button>
                    </div>
                    <AIInsights insights={insights} isLoading={isLoading} />
                  </div>
                )}
              </div>
            )}

            {activeTab === "recommendations" && (
              <div>
                {!recommendations ? (
                  <div className="text-center py-12">
                    <p
                      className={`mb-6 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Get personalized recommendations to improve your
                      productivity
                    </p>
                    <div className="space-y-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleGetRecommendations()}
                        disabled={isLoading}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                          isDark
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400"
                            : "bg-emerald-100/50 border border-emerald-300/50 text-emerald-600 hover:bg-emerald-200/70 hover:border-emerald-500"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isLoading
                          ? "Generating..."
                          : "Get General Recommendations"}
                      </motion.button>
                      <div className="flex gap-2 justify-center flex-wrap">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            handleGetRecommendations("time management")
                          }
                          disabled={isLoading}
                          className={`px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-300 ${
                            isDark
                              ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400"
                              : "bg-indigo-100/50 border border-indigo-300/50 text-indigo-600 hover:bg-indigo-200/70 hover:border-indigo-500"
                          } disabled:opacity-50`}
                        >
                          Time Management
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            handleGetRecommendations("skill development")
                          }
                          disabled={isLoading}
                          className={`px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-300 ${
                            isDark
                              ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400"
                              : "bg-indigo-100/50 border border-indigo-300/50 text-indigo-600 hover:bg-indigo-200/70 hover:border-indigo-500"
                          } disabled:opacity-50`}
                        >
                          Skill Development
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            handleGetRecommendations("productivity")
                          }
                          disabled={isLoading}
                          className={`px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-300 ${
                            isDark
                              ? "bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400"
                              : "bg-indigo-100/50 border border-indigo-300/50 text-indigo-600 hover:bg-indigo-200/70 hover:border-indigo-500"
                          } disabled:opacity-50`}
                        >
                          Productivity
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <AIRecommendations
                    recommendations={recommendations}
                    isLoading={isLoading}
                  />
                )}
              </div>
            )}

            {activeTab === "schedule" && (
              <div>
                {!scheduleSuggestions ? (
                  <div className="text-center py-16 px-4">
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                        isDark
                          ? "bg-gray-800 text-gray-600"
                          : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      <Calendar className="w-10 h-10" />
                    </div>
                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Smart Schedule Generation
                    </h3>
                    <p
                      className={`max-w-md mx-auto mb-8 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Get AI-generated schedule suggestions optimized for your
                      productivity patterns and goals.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGetScheduleSuggestions}
                      disabled={isLoading}
                      className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-emerald-500/20 ${
                        isDark
                          ? "bg-emerald-600 text-white hover:bg-emerald-500"
                          : "bg-emerald-500 text-white hover:bg-emerald-600"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? "Generating..." : "Generate Schedule Ideas"}
                    </motion.button>
                  </div>
                ) : (
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
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h2
                          className={`text-xl font-bold ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Optimized Schedules
                        </h2>
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          AI-suggested daily plans based on your habits
                        </p>
                      </div>
                    </div>
                    <div className="max-w-none">
                      <FormattedMessage
                        content={scheduleSuggestions.suggestions}
                        className="text-base leading-relaxed space-y-6"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "skills" && (
              <div>
                {!skillAnalysis ? (
                  <div className="text-center py-16 px-4">
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                        isDark
                          ? "bg-gray-800 text-gray-600"
                          : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      <BarChart2 className="w-10 h-10" />
                    </div>
                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Skill Gap Analysis
                    </h3>
                    <p
                      className={`max-w-md mx-auto mb-8 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Analyze your current progress and receive a personalized
                      learning path to master your goals.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAnalyzeSkills}
                      disabled={isLoading}
                      className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/20 ${
                        isDark
                          ? "bg-blue-600 text-white hover:bg-blue-500"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? "Analyzing..." : "Analyze Skills"}
                    </motion.button>
                  </div>
                ) : (
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
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        <BarChart2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h2
                          className={`text-xl font-bold ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Skill Development Path
                        </h2>
                        <p
                          className={`text-sm ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Personalized roadmap to master your goals
                        </p>
                      </div>
                    </div>

                    <div className="max-w-none">
                      <FormattedMessage
                        content={skillAnalysis.analysis}
                        className="text-base leading-relaxed space-y-6"
                      />
                    </div>

                    <div
                      className={`mt-8 pt-6 border-t flex items-center justify-between text-sm ${
                        isDark
                          ? "border-gray-700 text-gray-400"
                          : "border-gray-200 text-gray-500"
                      }`}
                    >
                      <span>
                        Skills analyzed:{" "}
                        <span
                          className={isDark ? "text-white" : "text-gray-900"}
                        >
                          {skillAnalysis.skillCount}
                        </span>
                      </span>
                      <span>
                        Analyzed on:{" "}
                        {new Date(
                          skillAnalysis.analyzedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "report" && (
              <div>
                {!weeklyReport ? (
                  <div className="text-center py-16 px-4">
                    <div
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                        isDark
                          ? "bg-gray-800 text-gray-600"
                          : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      <FileText className="w-10 h-10" />
                    </div>
                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Weekly Productivity Report
                    </h3>
                    <p
                      className={`max-w-md mx-auto mb-8 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Generate a comprehensive analysis of your performance,
                      time allocation, and achievements for the week.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGetWeeklyReport}
                      disabled={isLoading}
                      className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-indigo-500/20 ${
                        isDark
                          ? "bg-indigo-600 text-white hover:bg-indigo-500"
                          : "bg-indigo-500 text-white hover:bg-indigo-600"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? "Generating..." : "Generate Weekly Report"}
                    </motion.button>
                  </div>
                ) : (
                  <div
                    className={`rounded-3xl p-8 border ${
                      isDark
                        ? "bg-gray-800/30 border-gray-700/50"
                        : "bg-white border-gray-100 shadow-xl shadow-gray-200/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700 flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isDark
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h2
                            className={`text-xl font-bold ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Weekly Report
                          </h2>
                          <p
                            className={`text-sm ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {new Date(
                              weeklyReport.period.startDate
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              weeklyReport.period.endDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div
                          className={`px-4 py-2 rounded-lg border ${
                            isDark
                              ? "bg-gray-800 border-gray-700"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <span
                            className={`block text-xs ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Schedules
                          </span>
                          <span
                            className={`text-lg font-semibold ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {weeklyReport.stats.schedules}
                          </span>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-lg border ${
                            isDark
                              ? "bg-gray-800 border-gray-700"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <span
                            className={`block text-xs ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Total Hours
                          </span>
                          <span
                            className={`text-lg font-semibold ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {weeklyReport.stats.totalHours}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="max-w-none">
                      <FormattedMessage
                        content={weeklyReport.report}
                        className="text-base leading-relaxed space-y-6"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default AIPage;
