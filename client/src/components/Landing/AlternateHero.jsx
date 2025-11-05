import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const AlternateHero = () => {
  const { isDark } = useTheme();

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden flex items-center justify-center ${
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

      {/* Content */}
      <div className="relative z-10 px-6 text-center flex flex-col items-center">
        {/* Signature-style heading */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16 relative"
        >
          <h1
            className="text-7xl md:text-8xl lg:text-9xl font-bold bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent relative inline-block"
            style={{
              fontFamily: "'Allura', 'Pacifico', 'Dancing Script', cursive",
              textShadow: "0 0 30px rgba(59, 130, 246, 0.3)",
              letterSpacing: "0.08em",
              filter: "drop-shadow(0 4px 30px rgba(59, 130, 246, 0.3))",
            }}
          >
            HustleX
          </h1>

          {/* Underline */}
          <motion.svg
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.6 }}
            transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
            className="absolute left-1/2 -translate-x-1/2 -bottom-4 md:-bottom-6"
            width="400"
            height="30"
            viewBox="0 0 400 30"
          >
            <motion.path
              d="M 10 20 Q 50 10, 100 18 T 200 15 Q 250 12, 300 20 T 390 18"
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        </motion.div>

        {/* Subheading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-20 max-w-4xl mx-auto"
        >
          <div className="space-y-6">
            <motion.p
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className={`text-xl md:text-2xl ${
                isDark ? "text-slate-500" : "text-slate-600"
              }`}
              style={{ fontFamily: "'Caveat', cursive", fontSize: "1.8rem" }}
            >
              Take Full Control Of Your Time
            </motion.p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 w-full max-w-2xl"
        >
          {/* Login Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Link to="/login" className="w-full">
              <button className="w-full sm:min-w-[240px] flex items-center justify-center gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-indigo-100 px-8 py-4 text-lg font-semibold text-indigo-700 shadow-md transition-all duration-300 hover:shadow-lg hover:from-indigo-100 hover:to-indigo-200">
                <LogIn className="w-5 h-5" />
                <span>Login to Continue</span>
              </button>
            </Link>
          </motion.div>

          {/* Sign Up Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Link to="/register" className="w-full">
              <button className={`w-full sm:min-w-[240px] flex items-center justify-center gap-3 rounded-xl bg-black px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl ${
                isDark ? "border-2 border-gray-700 hover:border-gray-500" : ""
              }`}>
                <UserPlus className="w-5 h-5" />
                <span>Create Your Account</span>
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AlternateHero;
