import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  TrendingUp,
  Target,
  BarChart3,
  ArrowRight,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import AlternateHero from "./AlternateHero";
import QuickStatsPreview from "./QuickStatsPreview";

const AlternateLandingPage = () => {
  const { isDark } = useTheme();
  const { isAuthenticated, currentUser } = useAuth();

  const quickActions = [
    {
      title: "View Timetables",
      description: "Check your weekly schedules",
      icon: Calendar,
      link: "/timetable",
      color: "indigo",
    },
    {
      title: "Track Working Hours",
      description: "Log your productive time",
      icon: Clock,
      link: "/working-hours",
      color: "blue",
    },
    {
      title: "Skills Progress",
      description: "Monitor your development",
      icon: TrendingUp,
      link: "/skills",
      color: "emerald",
    },
    {
      title: "Schedule Management",
      description: "Organize your activities",
      icon: Target,
      link: "/schedule",
      color: "purple",
    },
  ];

  const containerStyle = isDark
    ? "bg-black min-h-screen"
    : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen";

  const textColorMuted = isDark ? "text-gray-400" : "text-gray-700";

  const buttonPrimaryBg = isDark
    ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-700 hover:via-indigo-800 hover:to-indigo-900"
    : "bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800";

  const buttonSecondaryBorder = isDark
    ? "border-gray-700 hover:border-gray-600"
    : "border-indigo-700 hover:border-indigo-900";

  const buttonSecondaryText = isDark
    ? "text-gray-300 hover:text-white"
    : "text-indigo-700 hover:text-indigo-900";

  return (
    <div className={containerStyle}>
      {/* Hero Section - Always show for unauthenticated users */}
      {!isAuthenticated && <AlternateHero />}

      {/* Authenticated User Dashboard */}
      {isAuthenticated && (
        <section
          className={`min-h-screen w-full overflow-hidden ${
            isDark
              ? "bg-black"
              : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
          }`}
        >
          {/* Background Overlay (grid texture) */}
          <div
            className={`absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_20%,#000_70%,transparent_110%)] ${
              isDark ? "opacity-100" : "opacity-30"
            }`}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="mb-4">
                <span
                  className={`text-sm font-medium uppercase tracking-wider ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  Welcome back!
                </span>
              </div>
              <h1
                className={`text-5xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent`}
                style={{
                  fontFamily: "'Allura', 'Pacifico', 'Dancing Script', cursive",
                }}
              >
                {currentUser?.name
                  ? `Hi ${currentUser.name.split(" ")[0]}!`
                  : "Ready to Hustle?"}
              </h1>
              <p
                className={`text-lg md:text-xl max-w-2xl mx-auto leading-relaxed ${textColorMuted}`}
                style={{ fontFamily: "'Caveat', cursive", fontSize: "1.5rem" }}
              >
                Jump back into your productivity journey. Check your timetables,
                track your hours, or continue developing your skills.
              </p>
            </motion.div>

            {/* Quick Actions Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            >
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                const colorClasses = {
                  indigo: isDark
                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/40"
                    : "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300",
                  blue: isDark
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40"
                    : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300",
                  emerald: isDark
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300",
                  purple: isDark
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40"
                    : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300",
                };

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={action.link}
                      className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl block ${
                        colorClasses[action.color]
                      }`}
                    >
                      <Icon className="w-8 h-8 mb-3" />
                      <h3 className="font-semibold text-lg mb-2">
                        {action.title}
                      </h3>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {action.description}
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Link
                to="/timetable"
                className={`${buttonPrimaryBg} text-white font-semibold py-4 px-10 rounded-xl shadow-lg transition flex items-center gap-3 hover:shadow-xl transform hover:scale-105`}
              >
                <Zap className="w-5 h-5" />
                Continue Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/working-hours"
                className={`border-2 py-4 px-10 rounded-xl font-semibold transition ${buttonSecondaryBorder} ${buttonSecondaryText} flex items-center gap-3 transform hover:scale-105 ${
                  isDark ? "bg-gray-900/50" : "bg-white/50"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                View Progress
              </Link>
            </motion.div>

            {/* Quick Stats Preview */}
            <QuickStatsPreview isDark={isDark} showWelcomeInstead={false} />
          </div>
        </section>
      )}
    </div>
  );
};

export default AlternateLandingPage;
