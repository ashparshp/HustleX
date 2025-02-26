import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Tag,
  Clock,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const SkillFilters = ({
  categories,
  selectedCategory,
  selectedStatus,
  searchQuery,
  skills,
  onSelectCategory,
  onSelectStatus,
  onSearchChange,
}) => {
  const { isDark } = useTheme();
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    status: true,
  });

  // Calculate category and status counts based on current skills
  const categoryCounts = useMemo(() => {
    if (!skills) return {};

    return Object.entries(skills).reduce(
      (counts, [category, categorySkills]) => {
        counts[category] = categorySkills.length;
        return counts;
      },
      {}
    );
  }, [skills]);

  // Calculate filtered counts based on current filters
  const filteredCounts = useMemo(() => {
    if (!skills) return {};

    return Object.entries(skills).reduce(
      (counts, [category, categorySkills]) => {
        // Filter skills within the category
        const filteredSkills = categorySkills.filter((skill) => {
          // Category filter
          const categoryMatch =
            !selectedCategory || category === selectedCategory;

          // Status filter
          const statusMatch =
            !selectedStatus || skill.status === selectedStatus;

          // Search filter
          const searchMatch =
            !searchQuery ||
            skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (skill.description &&
              skill.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()));

          return categoryMatch && statusMatch && searchMatch;
        });

        counts[category] = filteredSkills.length;
        return counts;
      },
      {}
    );
  }, [skills, selectedCategory, selectedStatus, searchQuery]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.05,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Status options
  const statuses = [
    {
      value: "completed",
      label: "Completed",
      icon: Award,
      color: isDark ? "text-green-400" : "text-green-600",
    },
    {
      value: "in-progress",
      label: "In Progress",
      icon: Clock,
      color: isDark ? "text-yellow-400" : "text-yellow-600",
    },
    {
      value: "upcoming",
      label: "Upcoming",
      icon: BookOpen,
      color: isDark ? "text-blue-400" : "text-blue-600",
    },
  ];

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Helper to get category color
  const getCategoryColor = (category) => {
    const colorMap = {
      "MERN Stack": isDark ? "text-blue-400" : "text-blue-600",
      "Java & Ecosystem": isDark ? "text-yellow-400" : "text-yellow-600",
      DevOps: isDark ? "text-red-400" : "text-red-600",
      "Data Science & ML": isDark ? "text-purple-400" : "text-purple-600",
      "Mobile Development": isDark ? "text-green-400" : "text-green-600",
      "Go Backend": isDark ? "text-cyan-400" : "text-cyan-600",
    };

    return (
      colorMap[category] || (isDark ? "text-indigo-400" : "text-indigo-600")
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {/* Search Section */}
      <motion.div
        variants={itemVariants}
        className={`p-3 rounded-lg border ${
          isDark
            ? "bg-black/80 border-indigo-500/30 hover:border-indigo-500/60"
            : "bg-white border-indigo-300/30 hover:border-indigo-300/60"
        } transition-all duration-300`}
      >
        <div className="flex items-center gap-1 mb-2">
          <Search
            className={isDark ? "text-indigo-400" : "text-indigo-600"}
            size={14}
          />
          <h3
            className={`text-xs font-medium ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Search Skills
          </h3>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-7 pr-7 py-1.5 text-xs rounded-lg border ${
              isDark
                ? "bg-gray-900 text-white border-gray-700 focus:border-indigo-500"
                : "bg-white text-gray-800 border-gray-300 focus:border-indigo-500"
            } focus:outline-none focus:ring-1 ${
              isDark ? "focus:ring-indigo-500/30" : "focus:ring-indigo-500/30"
            }`}
          />
          <Search
            size={12}
            className={`absolute left-2.5 top-2 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className={`absolute right-2 top-1.5 ${
                isDark
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </motion.div>

      {/* Categories Section */}
      <motion.div
        variants={itemVariants}
        className={`p-3 rounded-lg border ${
          isDark
            ? "bg-black/80 border-indigo-500/30 hover:border-indigo-500/60"
            : "bg-white border-indigo-300/30 hover:border-indigo-300/60"
        } transition-all duration-300`}
      >
        <div
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => toggleSection("categories")}
        >
          <div className="flex items-center gap-1">
            <Tag
              className={isDark ? "text-indigo-400" : "text-indigo-600"}
              size={14}
            />
            <h3
              className={`text-xs font-medium ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Categories
            </h3>
          </div>
          {expandedSections.categories ? (
            <ChevronUp
              size={14}
              className={isDark ? "text-gray-400" : "text-gray-600"}
            />
          ) : (
            <ChevronDown
              size={14}
              className={isDark ? "text-gray-400" : "text-gray-600"}
            />
          )}
        </div>

        {expandedSections.categories && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
            {categories.length > 0 ? (
              categories.map((category, index) => {
                const categoryName =
                  typeof category === "string" ? category : category.name;
                const isSelected = categoryName === selectedCategory;
                const totalCount = categoryCounts[categoryName] || 0;
                const filteredCount = filteredCounts[categoryName] || 0;

                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectCategory(categoryName)}
                    className={`py-1.5 px-2 rounded-md flex items-center justify-between text-xs transition-all duration-200 ${
                      isSelected
                        ? `${
                            isDark
                              ? "bg-indigo-500/20 border-indigo-500/30"
                              : "bg-indigo-100 border-indigo-200"
                          } border`
                        : `${
                            isDark
                              ? "bg-gray-900 hover:bg-gray-800 border-gray-800"
                              : "bg-white hover:bg-gray-50 border-gray-200"
                          } border`
                    }`}
                  >
                    <span
                      className={`font-medium ${
                        isSelected
                          ? `${getCategoryColor(categoryName)}`
                          : `${isDark ? "text-gray-300" : "text-gray-700"}`
                      }`}
                    >
                      {categoryName.length > 15
                        ? categoryName.substring(0, 15) + "..."
                        : categoryName}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-xs rounded-full px-1.5 py-0.5 ${
                          isSelected
                            ? `${
                                isDark
                                  ? "bg-indigo-600/50 text-white"
                                  : "bg-indigo-200 text-indigo-800"
                              }`
                            : `${
                                isDark
                                  ? "bg-gray-800 text-gray-400"
                                  : "bg-gray-100 text-gray-600"
                              }`
                        }`}
                      >
                        {filteredCount}/{totalCount}
                      </span>
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <p
                className={`text-xs ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No categories available
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Status Section */}
      <motion.div
        variants={itemVariants}
        className={`p-3 rounded-lg border ${
          isDark
            ? "bg-black/80 border-indigo-500/30 hover:border-indigo-500/60"
            : "bg-white border-indigo-300/30 hover:border-indigo-300/60"
        } transition-all duration-300`}
      >
        <div
          className="flex items-center justify-between mb-2 cursor-pointer"
          onClick={() => toggleSection("status")}
        >
          <div className="flex items-center gap-1">
            <Filter
              className={isDark ? "text-indigo-400" : "text-indigo-600"}
              size={14}
            />
            <h3
              className={`text-xs font-medium ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Status
            </h3>
          </div>
          {expandedSections.status ? (
            <ChevronUp
              size={14}
              className={isDark ? "text-gray-400" : "text-gray-600"}
            />
          ) : (
            <ChevronDown
              size={14}
              className={isDark ? "text-gray-400" : "text-gray-600"}
            />
          )}
        </div>

        {expandedSections.status && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {statuses.map((status) => {
              const StatusIcon = status.icon;
              const isSelected = status.value === selectedStatus;

              // Calculate status counts
              const totalStatusCount = Object.values(skills || {})
                .flat()
                .filter((skill) => skill.status === status.value).length;

              const filteredStatusCount = Object.values(skills || {})
                .flat()
                .filter(
                  (skill) =>
                    skill.status === status.value &&
                    (!selectedCategory ||
                      skill.category === selectedCategory) &&
                    (!searchQuery ||
                      skill.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      (skill.description &&
                        skill.description
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())))
                ).length;

              return (
                <motion.button
                  key={status.value}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelectStatus(status.value)}
                  className={`py-1.5 px-2 rounded-md flex items-center justify-between text-xs transition-all duration-200 ${
                    isSelected
                      ? `${
                          isDark
                            ? "bg-indigo-500/20 border-indigo-500/30"
                            : "bg-indigo-100 border-indigo-200"
                        } border`
                      : `${
                          isDark
                            ? "bg-gray-900 hover:bg-gray-800 border-gray-800"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        } border`
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <StatusIcon
                      size={12}
                      className={`${
                        isSelected
                          ? status.color
                          : isDark
                          ? "text-gray-500"
                          : "text-gray-400"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        isSelected
                          ? status.color
                          : isDark
                          ? "text-gray-300"
                          : "text-gray-700"
                      }`}
                    >
                      {status.label.length > 10
                        ? status.label.substring(0, 10) + "..."
                        : status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs rounded-full px-1.5 py-0.5 ${
                        isSelected
                          ? `${
                              isDark
                                ? "bg-indigo-600/50 text-white"
                                : "bg-indigo-200 text-indigo-800"
                            }`
                          : `${
                              isDark
                                ? "bg-gray-800 text-gray-400"
                                : "bg-gray-100 text-gray-600"
                            }`
                      }`}
                    >
                      {filteredStatusCount}/{totalStatusCount}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SkillFilters;
