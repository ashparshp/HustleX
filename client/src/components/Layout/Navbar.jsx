import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  Home,
  Clock,
  Award,
  Calendar,
  Target,
  Layout,
  MoreHorizontal,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  // Handle scroll event to add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user menu when clicking outside
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }

      // Close more menu when clicking outside
      if (
        showMoreMenu &&
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target)
      ) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showMoreMenu]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Close all menus on Escape
      if (event.key === "Escape") {
        setShowUserMenu(false);
        setShowMoreMenu(false);
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closeMenu = () => {
    setIsOpen(false);
    setShowMoreMenu(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      setShowUserMenu(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation links with icons - split into primary and secondary for responsive design
  const primaryNavLinks = [
    {
      text: "Working Hours",
      path: "/working-hours",
      icon: <Clock size={16} />,
      authRequired: true,
    },
    {
      text: "Skills",
      path: "/skills",
      icon: <Award size={16} />,
      authRequired: true,
    },
    {
      text: "Timetable",
      path: "/timetable",
      icon: <Layout size={16} />,
      authRequired: true,
    },
  ];

  const secondaryNavLinks = [
    {
      text: "Schedule",
      path: "/schedule",
      icon: <Calendar size={16} />,
      authRequired: true,
    },
    {
      text: "Contest",
      path: "/contests",
      icon: <Home size={16} />,
      authRequired: true,
    },
    {
      text: "LeetCode",
      path: "/leetcode",
      icon: <Target size={16} />,
      authRequired: true,
    },
  ];

  // Theme specific styling with added shadow on scroll
  const navbarClass = isDark
    ? `bg-gray-900/95 text-white border-gray-800 backdrop-blur-md ${
        scrolled ? "shadow-lg shadow-black/20" : ""
      }`
    : `bg-white/95 text-gray-900 border-gray-200 backdrop-blur-md ${
        scrolled ? "shadow-lg shadow-black/5" : ""
      }`;

  const generateLinkClass = (active) => {
    const baseClasses =
      "transition-all duration-300 rounded-md flex items-center gap-2";

    if (isDark) {
      return active
        ? `${baseClasses} text-indigo-300 bg-indigo-500/15 font-medium`
        : `${baseClasses} text-gray-300 hover:text-indigo-300 hover:bg-indigo-500/10`;
    } else {
      return active
        ? `${baseClasses} text-indigo-600 bg-indigo-50 font-medium`
        : `${baseClasses} text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/70`;
    }
  };

  const buttonClass = isDark
    ? "transition-colors duration-300 rounded-full hover:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-gray-900"
    : "transition-colors duration-300 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 focus:ring-offset-white";

  const dropdownMenuClass = isDark
    ? "absolute mt-2 py-2 rounded-lg shadow-lg border border-gray-700 bg-gray-900 z-50 transform origin-top-right transition-all duration-200 ease-out"
    : "absolute mt-2 py-2 rounded-lg shadow-lg border border-gray-200 bg-white z-50 transform origin-top-right transition-all duration-200 ease-out";

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${navbarClass}`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="flex justify-between h-14 md:h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link
              to={isAuthenticated ? "/working-hours" : "/login"}
              className="flex-shrink-0 flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-md"
              aria-label="Hustle X Homepage"
            >
              {/* SVG Logo */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 300 80"
                className="h-9 w-auto transition-transform duration-300 hover:scale-105"
              >
                {/* Background shapes */}
                <g opacity="0.2">
                  <path
                    d="M20,40 L60,15 A30,30 0 0,1 90,40 L50,65 A30,30 0 0,1 20,40 Z"
                    fill="#4f46e5"
                    opacity="0.4"
                  />
                  <path
                    d="M40,40 L80,15 A30,30 0 0,1 110,40 L70,65 A30,30 0 0,1 40,40 Z"
                    fill="#4f46e5"
                    opacity="0.2"
                  />
                  <path
                    d="M60,40 L100,15 A30,30 0 0,1 130,40 L90,65 A30,30 0 0,1 60,40 Z"
                    fill="#4f46e5"
                    opacity="0.4"
                  />
                </g>

                {/* Enhanced abstract productivity arrow */}
                <g transform="translate(40, 40) scale(0.9)">
                  <path
                    d="M0,0 L20,0 L20,10 L30,5 L20,0 L20,0"
                    fill="#4f46e5"
                    transform="rotate(45)"
                  />
                  <circle cx="0" cy="0" r="3.5" fill="#818cf8" />
                  {/* Added subtle pulse circle */}
                  <circle
                    cx="0"
                    cy="0"
                    r="8"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="0.8"
                    opacity="0.4"
                  />
                </g>

                {/* "Hustle" text */}
                <text
                  x="80"
                  y="52"
                  fontFamily="Arial, sans-serif"
                  fontWeight="700"
                  fontSize="36"
                  fill={isDark ? "#ffffff" : "#4f46e5"}
                >
                  Hustle
                </text>

                {/* "X" with enhanced special styling */}
                <g>
                  <text
                    x="190"
                    y="52"
                    fontFamily="Arial, sans-serif"
                    fontWeight="700"
                    fontSize="36"
                    fill="#4338ca"
                  >
                    X
                  </text>
                </g>

                {/* Additional decorative elements */}
                <line
                  x1="80"
                  y1="58"
                  x2="215"
                  y2="58"
                  stroke="#818cf8"
                  strokeWidth="1"
                  opacity="0.3"
                />
              </svg>
            </Link>
          </div>

          {/* Desktop nav links - primary always visible on md+, secondary in dropdown on md, visible on lg+ */}
          <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-2">
            {isAuthenticated &&
              primaryNavLinks
                .filter((link) => link.authRequired === isAuthenticated)
                .map((link) => (
                  <div key={link.path}>
                    <Link
                      to={link.path}
                      className={`px-2 lg:px-3 py-2 ${generateLinkClass(
                        isActive(link.path)
                      )}`}
                      title={link.text}
                      aria-current={isActive(link.path) ? "page" : undefined}
                    >
                      <span className="md:mr-1">{link.icon}</span>
                      <span className="hidden md:inline-block">
                        {link.text}
                      </span>
                    </Link>
                  </div>
                ))}

            {/* More menu for medium screens */}
            {isAuthenticated &&
              secondaryNavLinks.some(
                (link) => link.authRequired === isAuthenticated
              ) && (
                <div className="relative md:block lg:hidden" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className={`px-2 py-2 rounded-md ${generateLinkClass(
                      false
                    )}`}
                    aria-label="More navigation options"
                    aria-expanded={showMoreMenu}
                    aria-haspopup="true"
                    title="More"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {showMoreMenu && (
                    <div
                      className={`${dropdownMenuClass} right-0 w-48`}
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="more-menu-button"
                    >
                      {secondaryNavLinks
                        .filter((link) => link.authRequired === isAuthenticated)
                        .map((link) => (
                          <Link
                            key={link.path}
                            to={link.path}
                            className={`block px-4 py-2 ${generateLinkClass(
                              isActive(link.path)
                            )}`}
                            onClick={closeMenu}
                            role="menuitem"
                            aria-current={
                              isActive(link.path) ? "page" : undefined
                            }
                          >
                            {link.icon}
                            <span className="ml-2">{link.text}</span>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              )}

            {/* Secondary links visible on large screens */}
            <div className="hidden lg:flex lg:items-center lg:space-x-2">
              {isAuthenticated &&
                secondaryNavLinks
                  .filter((link) => link.authRequired === isAuthenticated)
                  .map((link) => (
                    <div key={link.path}>
                      <Link
                        to={link.path}
                        className={`px-3 py-2 ${generateLinkClass(
                          isActive(link.path)
                        )}`}
                        aria-current={isActive(link.path) ? "page" : undefined}
                      >
                        {link.icon}
                        <span className="ml-1">{link.text}</span>
                      </Link>
                    </div>
                  ))}
            </div>
          </div>

          {/* Right side - theme toggle & user menu */}
          <div className="flex items-center space-x-1 md:space-x-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 ${buttonClass}`}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? (
                <Sun size={18} className="text-yellow-300" />
              ) : (
                <Moon size={18} className="text-indigo-600" />
              )}
            </button>

            {isAuthenticated ? (
              /* User menu (desktop) */
              <div className="hidden md:relative md:block" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 p-1.5 rounded-full ${
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  } transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-1 ${
                    isDark
                      ? "focus:ring-offset-gray-900"
                      : "focus:ring-offset-white"
                  }`}
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <div
                    className={`h-8 w-8 rounded-full grid place-items-center transition-all duration-300 ${
                      isDark
                        ? "bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30"
                        : "bg-indigo-100 border border-indigo-200/50 hover:bg-indigo-200"
                    }`}
                  >
                    <User
                      size={16}
                      className={isDark ? "text-indigo-300" : "text-indigo-600"}
                    />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p
                      className={`text-sm font-medium ${
                        isDark ? "text-gray-200" : "text-gray-900"
                      }`}
                    >
                      {currentUser?.name || "User"}
                    </p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Account
                    </p>
                  </div>
                  <div>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${
                        showUserMenu ? "rotate-180" : ""
                      } ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    />
                  </div>
                </button>

                {showUserMenu && (
                  <div
                    className={`${dropdownMenuClass} right-0 w-56`}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <div
                      className={`px-4 py-2 mb-1 border-b ${
                        isDark ? "border-gray-800" : "border-gray-100"
                      }`}
                    >
                      <p
                        className={`text-sm font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {currentUser?.name || "User"}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {currentUser?.email || "user@example.com"}
                      </p>
                    </div>

                    <div role="none">
                      <Link
                        to="/profile"
                        className={`block px-4 py-2 text-sm ${
                          isDark
                            ? "hover:bg-gray-800 text-gray-300"
                            : "hover:bg-gray-50 text-gray-700"
                        } transition-colors duration-200`}
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2">
                          <User size={16} />
                          <span>Your Profile</span>
                        </div>
                      </Link>
                    </div>

                    <div
                      className={`mt-1 pt-1 border-t ${
                        isDark ? "border-gray-800" : "border-gray-100"
                      }`}
                      role="none"
                    >
                      <button
                        onClick={handleLogout}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          isDark
                            ? "hover:bg-red-900/20 text-red-400"
                            : "hover:bg-red-50 text-red-600"
                        } transition-colors duration-200`}
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut size={16} />
                          <span>Sign out</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Login / Register buttons (desktop) */
              <div className="hidden md:flex md:items-center md:space-x-2">
                <div>
                  <Link
                    to="/login"
                    className={`px-3 py-1.5 md:py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      isDark
                        ? "text-indigo-300 hover:bg-indigo-900/30 border border-indigo-500/30 hover:border-indigo-500/50"
                        : "text-indigo-600 hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300"
                    }`}
                  >
                    Sign in
                  </Link>
                </div>
                <div>
                  <Link
                    to="/register"
                    className={`px-3 py-1.5 md:py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      isDark
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    } hover:scale-105 transform`}
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-md ${
                  isDark
                    ? "text-gray-400 hover:bg-gray-800"
                    : "text-gray-700 hover:bg-gray-100"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300`}
                aria-expanded={isOpen ? "true" : "false"}
                aria-controls="mobile-menu"
                aria-label="Toggle mobile menu"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
        id="mobile-menu"
      >
        <div className={`${isDark ? "bg-gray-900" : "bg-white"} p-3`}>
          {/* User info block for mobile (when authenticated) */}
          {isAuthenticated && (
            <div
              className={`px-4 py-4 mb-2 rounded-lg ${
                isDark
                  ? "bg-gray-800/50 border border-gray-700"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-full grid place-items-center ${
                    isDark
                      ? "bg-indigo-500/20 border border-indigo-500/30"
                      : "bg-indigo-100 border border-indigo-200"
                  }`}
                >
                  <User
                    size={18}
                    className={isDark ? "text-indigo-300" : "text-indigo-600"}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {currentUser?.name || "User"}
                  </p>
                  <p
                    className={`text-xs truncate ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {currentUser?.email || "user@example.com"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1 px-2">
            {isAuthenticated ? (
              <>
                {/* Combine primary and secondary nav links for mobile */}
                <div className="grid grid-cols-2 gap-2 pt-1 pb-2">
                  {[...primaryNavLinks, ...secondaryNavLinks]
                    .filter((link) => link.authRequired === isAuthenticated)
                    .map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`px-3 py-2.5 rounded-lg ${generateLinkClass(
                          isActive(link.path)
                        )}`}
                        onClick={closeMenu}
                        aria-current={isActive(link.path) ? "page" : undefined}
                      >
                        <div className="flex items-center">
                          <span className="mr-2">{link.icon}</span>
                          <span>{link.text}</span>
                        </div>
                      </Link>
                    ))}
                </div>

                <div
                  className={`my-2 border-t ${
                    isDark ? "border-gray-800" : "border-gray-100"
                  }`}
                ></div>

                <div>
                  <Link
                    to="/profile"
                    className={`block px-3 py-2.5 rounded-lg ${generateLinkClass(
                      isActive("/profile")
                    )}`}
                    onClick={closeMenu}
                    aria-current={isActive("/profile") ? "page" : undefined}
                  >
                    <div className="flex items-center">
                      <User size={16} className="mr-2" />
                      <span>Profile</span>
                    </div>
                  </Link>
                </div>

                <div
                  className={`my-2 border-t ${
                    isDark ? "border-gray-800" : "border-gray-100"
                  }`}
                ></div>

                <div className="pt-1 pb-3">
                  <button
                    onClick={handleLogout}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg ${
                      isDark
                        ? "text-red-400 bg-red-900/10 hover:bg-red-900/20 border border-red-900/20"
                        : "text-red-600 bg-red-50/50 hover:bg-red-50 border border-red-200/50"
                    } transition-colors duration-200`}
                  >
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="pt-2 pb-1">
                  <Link
                    to="/login"
                    className={`flex items-center justify-center py-2.5 px-4 rounded-lg font-medium ${
                      isDark
                        ? "text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/20"
                        : "text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                    } transition-colors duration-200`}
                    onClick={closeMenu}
                  >
                    Sign in
                  </Link>
                </div>
                <div className="pt-1 pb-3">
                  <Link
                    to="/register"
                    className={`flex items-center justify-center py-2.5 px-4 rounded-lg font-medium ${
                      isDark
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    } transition-colors duration-200`}
                    onClick={closeMenu}
                  >
                    Create an account
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
