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

          {/* Bottom fade gradient */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent ${
              isDark ? "from-black" : "from-slate-50"
            }`}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 pb-32">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-20"
            >
              <div className="mb-6">
                <span
                  className={`text-sm font-medium uppercase tracking-wider ${
                    isDark ? "text-indigo-400" : "text-indigo-600"
                  }`}
                >
                  Welcome back!
                </span>
              </div>
              <h1
                className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent`}
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

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
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
          </div>
        </section>
      )}
    </div>
  );
};

export default AlternateLandingPage;
