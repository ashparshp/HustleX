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
import AnimatedHero from "./AnimatedHero";
import QuickStatsPreview from "./QuickStatsPreview";

const LandingPage = () => {
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
    ? {
        background: "linear-gradient(180deg, #000000 0%, #121212 100%)",
        color: "white",
        fontFamily: "'Eugene', serif",
        minHeight: "100vh",
      }
    : {
        background:
          "radial-gradient(ellipse 70% 60% at 35% 10%, #d0d8f7 0%, #e9edf9 60%, #fefefe 90%)",
        color: "#1a202c",
        fontFamily: "'Eugene', serif",
        minHeight: "100vh",
      };

  const textColorMuted = isDark ? "text-gray-400" : "text-gray-700";
  const headingColor = isDark ? "text-indigo-300" : "text-indigo-700";

  const buttonPrimaryBg = isDark
    ? "bg-gradient-to-r from-gray-800 via-gray-900 to-black hover:from-gray-900 hover:via-black hover:to-black"
    : "bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:via-indigo-700 hover:to-indigo-800";

  const buttonPrimaryText = "text-white";

  const buttonSecondaryBorder = isDark
    ? "border-gray-700 hover:border-gray-600"
    : "border-indigo-700 hover:border-indigo-900";

  const buttonSecondaryText = isDark
    ? "text-gray-300 hover:text-white"
    : "text-indigo-700 hover:text-indigo-900";

  // New Landing Page styles for non-authenticated user
  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black font-['Inter'] text-white">
        {/* Grid Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px),
              linear-gradient(to bottom, #333 1px, transparent 1px)`,
              backgroundSize: "6rem 6rem",
              maskImage:
                "radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 100%)",
              opacity: 0.2,
            }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-6 text-center">
          {/* Neon Logo */}
          <h1
            className="text-7xl md:text-8xl lg:text-9xl mb-8"
            style={{
              fontFamily: "'Great Vibes', cursive",
              color: "#3b82f6",
              textShadow:
                "0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 40px #2563eb",
            }}
          >
            HustleX
          </h1>

          {/* Subtitle */}
          <p
            className="text-2xl md:text-4xl mb-12 text-gray-400 font-light"
            style={{
              fontFamily: "'Sacramento', cursive",
              letterSpacing: "0.05em",
            }}
          >
            Take Full Control Of Your Time
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col w-full max-w-md gap-4">
            <Link
              to="/login"
              className="w-full py-3.5 rounded-2xl text-lg font-medium bg-blue-100 hover:bg-blue-200 text-blue-900 transition-colors duration-200 flex items-center justify-center group"
            >
              <span className="mr-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              Login to Continue
            </Link>

            <Link
              to="/register"
              className="w-full py-3.5 rounded-2xl text-lg font-medium border border-gray-700 bg-black hover:bg-gray-900 text-white transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 15.75A7.5 7.5 0 0115.25 21H3.75a7.5 7.5 0 010-15.25z"
                />
              </svg>
              Create Your Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated View (Keep original layout)
  return (
    <div style={containerStyle}>
      <section className="flex flex-col lg:flex-row items-center max-w-7xl mx-auto px-6 py-20 gap-16">
        <div className="w-full lg:w-1/2 flex justify-center">
          <AnimatedHero />
        </div>
        <div className="lg:w-1/2">
          <div className="mb-4">
            <span
              className={`text-sm font-medium ${
                isDark ? "text-indigo-400" : "text-indigo-600"
              }`}
            >
              Welcome back!
            </span>
          </div>
          <h1
            className={`text-5xl font-bold mb-6 leading-tight ${headingColor}`}
          >
            {currentUser?.name
              ? `Hi ${currentUser.name.split(" ")[0]}!`
              : "Ready to Hustle?"}
          </h1>
          <p
            className={`text-lg mb-10 max-w-lg leading-relaxed ${textColorMuted}`}
          >
            Your productivity empire awaits. Craft perfect schedules, master
            your time, and unlock your full potential in one unified space.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colorClasses = {
                indigo: isDark
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                  : "bg-indigo-50 text-indigo-600 border-indigo-200",
                blue: isDark
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-blue-50 text-blue-600 border-blue-200",
                emerald: isDark
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200",
                purple: isDark
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  : "bg-purple-50 text-purple-600 border-purple-200",
              };

              return (
                <Link
                  key={index}
                  to={action.link}
                  className={`p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-md ${colorClasses[action.color]}`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                  <p
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>

          <div className="flex gap-4">
            <Link
              to="/timetable"
              className={`${buttonPrimaryBg} ${buttonPrimaryText} font-semibold py-3 px-8 rounded-xl shadow-md transition flex items-center gap-2`}
            >
              <Zap className="w-5 h-5" />
              Continue Journey
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/working-hours"
              className={`border-2 py-3 px-8 rounded-xl font-semibold transition ${buttonSecondaryBorder} ${buttonSecondaryText} flex items-center gap-2`}
            >
              <BarChart3 className="w-4 h-4" />
              View Progress
            </Link>
          </div>

          <QuickStatsPreview isDark={isDark} showWelcomeInstead={false} />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            className={`text-4xl font-bold mb-4 ${headingColor}`}
            style={{
              fontFamily: "'Great Vibes', cursive",
              position: "relative",
              display: "inline-block",
            }}
          >
            Everything You Need to Stay Productive
          </h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 300 20"
            className="mx-auto mt-4 w-64"
          >
            <path
              d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className={`${headingColor}`}
            />
          </svg>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
