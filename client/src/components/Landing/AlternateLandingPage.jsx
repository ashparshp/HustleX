import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { BarChart3, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import AlternateHero from "./AlternateHero";

const AlternateLandingPage = () => {
  const { isDark } = useTheme();
  const { isAuthenticated, currentUser } = useAuth();

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
          className={`min-h-screen w-full overflow-hidden relative ${
            isDark
              ? "bg-black"
              : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
          }`}
        >
          {/* Zigzag Pattern Background */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <svg
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="zigzag-dashboard"
                  x="0"
                  y="0"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M0 20 L10 10 L20 20 L30 10 L40 20"
                    stroke={isDark ? "#4f4f4f" : "#cbd5e1"}
                    strokeWidth="1"
                    fill="none"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#zigzag-dashboard)" />
            </svg>
          </div>

          {/* Bottom fade gradient */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t to-transparent pointer-events-none ${
              isDark ? "from-black" : "from-slate-50"
            }`}
          />

          {/* Top fade gradient */}
          <div
            className={`absolute top-0 left-0 right-0 h-40 bg-gradient-to-b to-transparent pointer-events-none ${
              isDark ? "from-black" : "from-slate-50"
            }`}
          />

          <div className="relative z-10 w-full">
            {/* Container with better spacing */}
            <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
              {/* Welcome Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center pt-24 md:pt-32 lg:pt-40 pb-16 md:pb-20 lg:pb-24"
              >
                {/* Welcome Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mb-6 md:mb-8"
                >
                  <span
                    className={`inline-block text-xs md:text-sm font-medium uppercase tracking-widest px-4 py-2 rounded-full ${
                      isDark
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                    }`}
                  >
                    Welcome back!
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8 md:mb-12 leading-tight bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent px-4"
                  style={{
                    fontFamily:
                      "'Allura', 'Pacifico', 'Dancing Script', cursive",
                  }}
                >
                  {currentUser?.name
                    ? `Hi ${currentUser.name.split(" ")[0]}!`
                    : "Ready to Hustle?"}
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className={`text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed px-4 ${textColorMuted}`}
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "clamp(1.25rem, 2.5vw, 1.8rem)",
                  }}
                >
                  Jump back into your productivity journey. Check your
                  timetables, track your hours, or continue developing your
                  skills.
                </motion.p>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center pb-24 md:pb-32 lg:pb-40 px-4"
              >
                <Link
                  to="/timetable"
                  className={`w-full sm:w-auto ${buttonPrimaryBg} text-white font-semibold py-4 md:py-5 px-10 md:px-12 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 hover:shadow-2xl transform hover:scale-105`}
                >
                  <Zap className="w-5 md:w-6 h-5 md:h-6" />
                  <span className="text-base md:text-lg">Continue Journey</span>
                  <ArrowRight className="w-4 md:w-5 h-4 md:h-5" />
                </Link>
                <Link
                  to="/working-hours"
                  className={`w-full sm:w-auto border-2 py-4 md:py-5 px-10 md:px-12 rounded-xl font-semibold transition-all duration-300 ${buttonSecondaryBorder} ${buttonSecondaryText} flex items-center justify-center gap-3 transform hover:scale-105 hover:shadow-xl ${
                    isDark ? "bg-gray-900/50" : "bg-white/50"
                  }`}
                >
                  <BarChart3 className="w-5 md:w-6 h-5 md:h-6" />
                  <span className="text-base md:text-lg">View Progress</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AlternateLandingPage;
