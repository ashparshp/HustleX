import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Calendar,
  Plus,
  Edit,
  Trash2,
  PlusCircle,
  Tag,
  ChevronDown,
  X,
  Settings,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import useTimetable from "../hooks/useTimetable";
import useCategories from "../hooks/useCategories";
import { toast } from "react-hot-toast";

import TimetableHistory from "../components/Timetable/TimetableHistory";
import TimetableStats from "../components/Timetable/TimetableStats";
import AddActivityModal from "../components/Timetable/AddActivityModal";
import SkeletonTimetable from "../components/Timetable/SkeletonTimetable";
import TimetableTable from "../components/Timetable/TimetableTable";
import TimeBlockHighlight from "../components/Timetable/TimeBlockHighlight";
import CollapsibleTimetableButtons from "../components/Timetable/CollapsibleTimetableButtons";
import CreateTimetableModal from "../components/Timetable/CreateTimetableModal";
import CategoryManagement from "../components/Categories/CategoryManagement";
import TimetableError from "../components/Timetable/TimetableError";
import ManageActivitiesModal from "../components/Timetable/ManageActivitiesModal";
import DeleteTimetableModal from "../components/Timetable/DeleteTimetableModal";

const API_URL = import.meta.env.VITE_API_URL;

const EnhancedDateDisplay = ({ dateString, isDark }) => {
  const date = new Date(dateString);

  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const dayOfMonth = date.getDate();

  const colors = isDark
    ? {
        background: "bg-indigo-900/30",
        text: "text-indigo-200",
        shadow: "shadow-indigo-900/40",
        day: "text-indigo-300",
        date: "text-white",
      }
    : {
        background: "bg-indigo-100",
        text: "text-indigo-800",
        shadow: "shadow-indigo-200",
        day: "text-indigo-600",
        date: "text-gray-900",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`inline-flex items-center space-x-2 ${colors.background} ${colors.text} px-3 py-1.5 rounded-lg ${colors.shadow} border border-opacity-20`}
    >
      <div className="flex flex-col items-center">
        <span
          className={`text-xs font-medium uppercase tracking-wider ${colors.day}`}
        >
          {dayOfWeek}
        </span>
        <span className={`text-lg font-bold font-['Inter'] ${colors.date}`}>
          {dayOfMonth}
        </span>
        <span className={`text-xs uppercase tracking-wider ${colors.day}`}>
          {month}
        </span>
      </div>
    </motion.div>
  );
};

const TimetablePage = () => {
  const { isDark } = useTheme();
  const {
    timetables,
    currentTimetable,
    currentWeek,
    loading,
    error,
    fetchTimetables,
    createTimetable,
    updateTimetable,
    deleteTimetable,
    fetchCurrentWeek,
    toggleActivityStatus,
    fetchHistory,
    getStats,
    getCategories: getTimetableCategories,
    updateDefaultActivities,
  } = useTimetable();

  const {
    categories,
    defaultCategories,
    loading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,
  } = useCategories("timetable");

  const [pageReady, setPageReady] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [timetableCategories, setTimetableCategories] = useState([]);
  const [showTimetableSelector, setShowTimetableSelector] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [localCurrentTimetable, setLocalCurrentTimetable] = useState(null);
  const [timetableToDelete, setTimetableToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);

  const stableRefreshRef = useRef(0);

  // Helper function to get auth headers
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    };
  }, []);

  useEffect(() => {
    if (!loading && (currentWeek || error || (timetables && timetables.length === 0))) {
      let isMounted = true;
  
      const timer = setTimeout(() => {
        if (isMounted) {
          setPageReady(true);
        }
      }, 300);
  
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
  }, [loading, currentWeek, error, timetables]);

  useEffect(() => {
    if (timetables.length > 0 && currentTimetable) {
      const matchingTimetable = timetables.find(
        (t) => t.id === currentTimetable.id
      );

      if (matchingTimetable) {
        if (
          !localCurrentTimetable ||
          localCurrentTimetable.id !== matchingTimetable.id
        ) {
          setLocalCurrentTimetable(matchingTimetable);
        }
      }

      forceUpdate();
    }
  }, [timetables, currentTimetable]);

  useEffect(() => {
    if (localCurrentTimetable && timetables.length > 0) {
      const updatedTimetable = timetables.find(
        (t) => t.id === localCurrentTimetable.id
      );

      if (
        updatedTimetable &&
        (updatedTimetable.name !== localCurrentTimetable.name ||
          updatedTimetable.isActive !== localCurrentTimetable.isActive)
      ) {
        setLocalCurrentTimetable(updatedTimetable);
      }
    }
  }, [timetables, localCurrentTimetable]);

  useEffect(() => {
    if (currentWeek && currentWeek.activities) {
      const extractedActivities = currentWeek.activities.map((item) => ({
        name: item.activity.name,
        time: item.activity.time,
        category: item.activity.category,
      }));

      setActivities(extractedActivities);
    }
  }, [currentWeek]);

  // Update activities when switching timetables
  useEffect(() => {
    if (currentTimetable) {
      fetchCurrentTimetableActivities(currentTimetable.id)
        .then((fetchedActivities) => {
          if (fetchedActivities) {
            setActivities(fetchedActivities);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch activities for new timetable:", err);
        });
    }
  }, [currentTimetable]);

  useEffect(() => {
    if (currentTimetable) {
      setTimetableCategories([]);
      setIsCategoryLoading(true);

      getTimetableCategories()
        .then((categories) => {
          setTimetableCategories(categories || []);
          setIsCategoryLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load categories:", err);
          setIsCategoryLoading(false);
        });
    }
  }, [currentTimetable, getTimetableCategories]);

  useEffect(() => {
    const refreshCategoriesInBackground = async () => {
      if (!activeModal) {
        try {
          const categories = await getTimetableCategories();
          if (categories && categories.length > 0) {
            setTimetableCategories(categories);
          }
        } catch (err) {
          console.error("Background category refresh failed:", err);
        }
      }
    };

    const intervalId = setInterval(refreshCategoriesInBackground, 300000);

    return () => clearInterval(intervalId);
  }, [getTimetableCategories, activeModal]);

  // New function to fetch activities directly from the server
  const fetchCurrentTimetableActivities = async (timetableId) => {
    if (!timetableId) return [];

    try {
      // Fetch the timetable data to get the most up-to-date activities
      const response = await fetch(`${API_URL}/api/timetables/${timetableId}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch timetable data");
      }

      const data = await response.json();
      return data.data?.defaultActivities || [];
    } catch (error) {
      console.error("Error fetching current timetable activities:", error);
      return [];
    }
  };

  const forceUpdate = useCallback(() => {
    stableRefreshRef.current += 1;
    setRefreshKey(stableRefreshRef.current);
  }, []);

  const refreshTimetableData = async () => {
    try {
      setPageReady(false);

      await fetchTimetables();

      if (localCurrentTimetable) {
        await fetchCurrentWeek(localCurrentTimetable.id);

        // Also update the activities state with fresh data
        const currentActivities = await fetchCurrentTimetableActivities(
          localCurrentTimetable.id
        );
        setActivities(currentActivities);
      }

      forceUpdate();

      setTimeout(() => {
        setPageReady(true);
      }, 200);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setPageReady(true);
    }
  };

  const closeAllModals = () => {
    setActiveModal(null);
    setEditingActivity(null);
  };

  const openAddActivityModal = () => {
    setActiveModal("add");
    setEditingActivity(null);
  };

  const refreshTimetableCategories = async () => {
    try {
      setIsCategoryLoading(true);
      const cats = await getTimetableCategories();
      setTimetableCategories((prevCats) => [...(cats || [])]);
      setIsCategoryLoading(false);
    } catch (err) {
      console.error("Failed to refresh timetable categories:", err);
      setIsCategoryLoading(false);
    }
  };

  const openManageActivitiesModal = () => {
    setActiveModal("manage");
  };

  const openHistoryModal = () => {
    setActiveModal("history");
  };

  const openStatsModal = async () => {
    try {
      const statsData = await getStats();
      setStats(statsData);
      setActiveModal("stats");
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const openCreateTimetableModal = (mode) => {
    setActiveModal(mode === "edit" ? "editTimetable" : "createTimetable");
  };

  const openCategoryManagementModal = () => {
    setActiveModal("categoryManagement");
  };

  const handleAddActivity = async (activityData) => {
    try {
      setIsSubmitting(true);
      closeAllModals();

      if (!localCurrentTimetable) {
        throw new Error("No timetable selected");
      }

      const currentActivities = await fetchCurrentTimetableActivities(
        localCurrentTimetable.id
      );

      const updatedActivities = [...currentActivities, activityData];

      await updateDefaultActivities(updatedActivities, {
        silent: true,
        id: localCurrentTimetable.id,
      });

      setActivities(updatedActivities);

      toast.success("Added");

      fetchCurrentWeek(localCurrentTimetable.id).catch((err) => {
        console.error("Error refreshing week data:", err);
      });
    } catch (error) {
      console.error("Error adding activity:", error);
      toast.error("Failed to add activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageActivities = async (updatedActivities) => {
    try {
      setIsSubmitting(true);
      closeAllModals();

      if (!localCurrentTimetable) {
        throw new Error("No timetable selected");
      }

      await updateDefaultActivities(updatedActivities, {
        silent: true,
        id: localCurrentTimetable.id,
      });

      setActivities(updatedActivities);
      toast.success("Updated");

      fetchCurrentWeek(localCurrentTimetable.id).catch((err) => {
        console.error("Error refreshing week data:", err);
      });
    } catch (error) {
      console.error("Error managing activities:", error);
      toast.error("Failed to update activities");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (index) => {
    try {
      if (!localCurrentTimetable) {
        throw new Error("No timetable selected");
      }

      const currentActivities = await fetchCurrentTimetableActivities(
        localCurrentTimetable.id
      );

      const updatedActivities = [...currentActivities];
      updatedActivities.splice(index, 1);

      await updateDefaultActivities(updatedActivities, {
        silent: true,
        id: localCurrentTimetable.id,
      });

      await fetchCurrentWeek(localCurrentTimetable.id);
      setActivities(updatedActivities);

      return updatedActivities;
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
      throw error;
    }
  };

  const handleCreateTimetable = async (data) => {
    try {
      setIsSubmitting(true);

      closeAllModals();

      const createdTimetable = await createTimetable(data);

      const fetchedTimetables = await fetchTimetables();

      const newTimetable = fetchedTimetables.find(
        (t) => t.id === createdTimetable?.id || t.id === createdTimetable?._id
      );

      if (newTimetable) {
        setLocalCurrentTimetable(newTimetable);

        if (data.isActive) {
          fetchCurrentWeek(newTimetable.id).catch((err) => {
            console.error("Error loading new timetable week:", err);
          });

          const timetableActivities = await fetchCurrentTimetableActivities(
            newTimetable.id
          );
          setActivities(timetableActivities);
        }
      }

      toast.success("Timetable created successfully");

      return createdTimetable;
    } catch (error) {
      console.error("Error creating timetable:", error);
      toast.error("Failed to create timetable");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTimetable = async (id, data) => {
    try {
      setIsSubmitting(true);

      closeAllModals();

      await updateTimetable(id, data);
      const updatedTimetables = await fetchTimetables();

      if (localCurrentTimetable && localCurrentTimetable.id === id) {
        const updatedTimetable = updatedTimetables.find((t) => t.id === id);
        if (updatedTimetable) {
          setLocalCurrentTimetable(updatedTimetable);
        }
      }

      toast.success("Timetable updated successfully");
    } catch (error) {
      console.error("Error updating timetable:", error);
      toast.error("Failed to update timetable");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTimetable = async (id) => {
    try {
      const timetableToDelete = timetables.find((t) => t.id === id);
      if (timetableToDelete) {
        setTimetableToDelete(timetableToDelete);
        setActiveModal("deleteTimetable");
      } else {
        toast.error("Timetable not found");
        refreshTimetableData();
      }
    } catch (error) {
      console.error("Error preparing delete:", error);
      toast.error("Failed to prepare deletion");
    }
  };

  const confirmDeleteTimetable = async () => {
    try {
      setIsSubmitting(true);
      setPageReady(false);

      closeAllModals();

      if (!timetableToDelete) return;

      const deletedTimetableId = timetableToDelete.id;

      const isDeletingCurrentTimetable =
        localCurrentTimetable &&
        localCurrentTimetable.id === deletedTimetableId;

      await deleteTimetable(deletedTimetableId, { silent: true });

      const updatedTimetables = await fetchTimetables();

      setTimetableToDelete(null);

      if (isDeletingCurrentTimetable) {
        if (updatedTimetables.length > 0) {
          const newCurrentTimetable =
            updatedTimetables.find((t) => t.isActive) || updatedTimetables[0];

          setLocalCurrentTimetable(newCurrentTimetable);

          await fetchCurrentWeek(newCurrentTimetable.id);

          const currentActivities = await fetchCurrentTimetableActivities(
            newCurrentTimetable.id
          );
          setActivities(currentActivities);

          forceUpdate();
        } else {
          setLocalCurrentTimetable(null);
          setCurrentWeek(null);
          setActivities([]);
        }
      } else {
        forceUpdate();
      }

      toast.success("Timetable deleted successfully");

      setTimeout(() => setPageReady(true), 200);
    } catch (error) {
      console.error("Error deleting timetable:", error);
      toast.error("Failed to delete timetable");
      setPageReady(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimetableChange = async (id) => {
    try {
      setIsSubmitting(true);
      setPageReady(false);

      const selected = timetables.find((t) => t.id === id);

      if (selected) {
        setLocalCurrentTimetable(selected);
        setShowTimetableSelector(false);

        if (!selected.isActive) {
          await updateTimetable(id, { isActive: true });
        }

        const weekData = await fetchCurrentWeek(id);

        const timetableActivities = await fetchCurrentTimetableActivities(id);
        setActivities(timetableActivities);

        forceUpdate();

        setTimeout(() => setPageReady(true), 200);
      }
    } catch (error) {
      console.error("Error changing timetable:", error);
      toast.error("Failed to change timetable");
      setPageReady(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeRange = (timeRange) => {
    if (!timeRange) return "N/A";
    const times = timeRange.split("-");
    if (times.length !== 2) return "Invalid Time";
    const format = (timeStr) => {
      const [hour, minute] = timeStr.split(":").map(Number);
      if (isNaN(hour) || isNaN(minute)) return "Invalid Time";
      return new Date(1970, 0, 1, hour, minute).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };
    return `${format(times[0])} - ${format(times[1])}`;
  };

  const getCategoryStyle = () => {
    return isDark
      ? {
          bg: "bg-black hover:bg-gray-950",
          text: "text-gray-300",
          border: "border-gray-900",
        }
      : {
          bg: "bg-gray-50 hover:bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
        };
  };

  const ActivityButton = ({ onClick, icon: Icon, children, type }) => {
    const getColorClasses = () => {
      if (type === "add") {
        return isDark
          ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40"
          : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 border-emerald-300";
      }
      return isDark
        ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30"
        : "bg-indigo-100 border-indigo-300 text-indigo-600 hover:bg-indigo-200";
    };

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border
          backdrop-blur-sm transition-all duration-300 shadow-sm ${getColorClasses()}`}
        disabled={isSubmitting}
      >
        <Icon className="w-3.5 h-3.5" />
        {children}
      </motion.button>
    );
  };

  const ModalWrapper = ({ isOpen, onClose, children }) => {
    const modalVariants = {
      hidden: {
        opacity: 0,
        scale: 0.98,
        transition: {
          duration: 0.1,
        },
      },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          type: "tween",
          duration: 0.15,
        },
      },
    };

    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={modalVariants}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm bg-black/50"
          >
            <div
              className={`relative w-full max-w-lg rounded-xl shadow-2xl border 
                ${
                  isDark
                    ? "bg-black/90 border-gray-800"
                    : "bg-white/90 border-gray-200"
                }`}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (!pageReady) {
    return <SkeletonTimetable />;
  }

  if (error && !loading && !currentWeek) {
    return (
      <TimetableError
        error={error}
        onRetry={() => {
          setPageReady(false);
          fetchCurrentWeek().finally(() => {
            setTimeout(() => setPageReady(true), 300);
          });
        }}
        retryText="Retry"
      />
    );
  }

  return (
    <section
      className={`py-6 lg:px-3 relative ${isDark ? "bg-black" : "bg-white"}`}
    >
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

      <div className="mx-auto px-4 relative z-10 sm:py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <h2
                  className={`text-2xl font-bold ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Timetable
                </h2>
                <div
                  className={`w-24 h-1 bg-gradient-to-r ${
                    isDark
                      ? "from-white to-gray-500"
                      : "from-indigo-600 to-indigo-300"
                  } rounded-full`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshTimetableData}
                className={`flex items-center justify-center p-2 rounded-lg ${
                  isDark
                    ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                    : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                }`}
                disabled={isSubmitting}
                title="Refresh Data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.button>

              <ActivityButton
                type="add"
                onClick={openAddActivityModal}
                icon={Plus}
              >
                Add Activity
              </ActivityButton>
              <motion.button
                onClick={openCreateTimetableModal}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${
                  isDark
                    ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                }`}
                disabled={isSubmitting}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Timetable
              </motion.button>
              <CollapsibleTimetableButtons
                isDark={isDark}
                onHistory={openHistoryModal}
                onStats={openStatsModal}
                onCategories={openCategoryManagementModal}
              />
            </div>
          </div>
        </div>

        {currentWeek && (
          <TimeBlockHighlight
            isDark={isDark}
            toggleActivityStatus={toggleActivityStatus}
            getCategoryStyle={getCategoryStyle}
            formatTimeRange={formatTimeRange}
            currentWeek={currentWeek}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
          className="relative group"
        >
          <div
            className={`relative rounded-xl p-5 backdrop-blur-sm border shadow-xl 
              ${
                isDark
                  ? "bg-indigo-950/20 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
                <div className="w-full sm:w-auto">
                  <button
                    onClick={() =>
                      setShowTimetableSelector(!showTimetableSelector)
                    }
                    aria-expanded={showTimetableSelector}
                    aria-controls="timetable-dropdown"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isDark
                        ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 shadow-md shadow-indigo-900/20"
                        : "bg-indigo-50 border border-indigo-300/70 text-indigo-700 hover:bg-indigo-100 shadow-sm"
                    }`}
                    disabled={isSubmitting}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="truncate max-w-[150px] font-semibold">
                      {localCurrentTimetable
                        ? localCurrentTimetable.name
                        : "Select Timetable"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 ml-1.5 transition-transform ${
                        showTimetableSelector ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {showTimetableSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        id="timetable-dropdown"
                        className={`absolute mt-2 py-2 w-80 rounded-lg shadow-xl border z-50 ${
                          isDark
                            ? "bg-gray-900/95 border-gray-700 shadow-black/50"
                            : "bg-white/95 border-gray-200 shadow-gray-200/70"
                        }`}
                      >
                        <div
                          className={`px-4 py-2.5 mb-1 border-b ${
                            isDark ? "border-gray-800" : "border-gray-100"
                          }`}
                        >
                          <h3
                            className={`font-medium ${
                              isDark ? "text-gray-200" : "text-gray-700"
                            }`}
                          >
                            Your Timetables
                          </h3>
                        </div>

                        <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
                          {timetables && timetables.length > 0 ? (
                            timetables.map((timetable) => (
                              <button
                                key={timetable.id}
                                onClick={() => {
                                  handleTimetableChange(timetable.id);
                                }}
                                className={`w-full px-4 py-3 text-left transition-colors ${
                                  isDark
                                    ? "hover:bg-gray-800"
                                    : "hover:bg-gray-50"
                                } flex justify-between items-center ${
                                  timetable.isActive
                                    ? isDark
                                      ? "bg-indigo-900/30 text-indigo-200"
                                      : "bg-indigo-50 text-indigo-700"
                                    : isDark
                                    ? "text-gray-300"
                                    : "text-gray-700"
                                }`}
                                disabled={isSubmitting}
                              >
                                <span className="truncate font-medium">
                                  {timetable.name}
                                </span>
                                {timetable.isActive && (
                                  <CheckCircle
                                    className={`w-4 h-4 flex-shrink-0 ml-2 ${
                                      isDark
                                        ? "text-indigo-400"
                                        : "text-indigo-600"
                                    }`}
                                  />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-center text-gray-500 italic text-sm">
                              No timetables found
                            </div>
                          )}
                        </div>

                        <div
                          className={`border-t mt-1 pt-3 px-3 ${
                            isDark ? "border-gray-800" : "border-gray-200"
                          }`}
                        >
                          <button
                            onClick={() => {
                              openCreateTimetableModal();
                              setShowTimetableSelector(false);
                            }}
                            className={`w-full px-3 py-2.5 rounded-lg text-center text-sm font-medium transition-colors flex items-center justify-center ${
                              isDark
                                ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                            disabled={isSubmitting}
                          >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Create New Timetable
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {currentWeek &&
                  currentWeek.overallCompletionRate !== undefined && (
                    <>
                      <div
                        className={`hidden sm:flex items-center gap-1.5 mr-3 ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <EnhancedDateDisplay
                          dateString={currentWeek.weekStartDate}
                          isDark={isDark}
                        />
                        <span
                          className={`${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          -
                        </span>
                        <EnhancedDateDisplay
                          dateString={currentWeek.weekEndDate}
                          isDark={isDark}
                        />
                      </div>

                      <div className="flex items-center gap-2 mr-1">
                        <div
                          className={`relative h-8 rounded-xl overflow-hidden w-32 border shadow-sm
                          ${
                            isDark
                              ? "border-indigo-500/30"
                              : "border-indigo-200"
                          }`}
                        >
                          <div
                            className={`absolute inset-0 h-full bg-gradient-to-r ${
                              currentWeek.overallCompletionRate >= 80
                                ? isDark
                                  ? "from-emerald-600/80 to-emerald-400/80"
                                  : "from-emerald-600 to-emerald-400"
                                : currentWeek.overallCompletionRate >= 60
                                ? isDark
                                  ? "from-teal-600/80 to-teal-400/80"
                                  : "from-teal-600 to-teal-400"
                                : currentWeek.overallCompletionRate >= 40
                                ? isDark
                                  ? "from-blue-600/80 to-blue-400/80"
                                  : "from-blue-600 to-blue-400"
                                : currentWeek.overallCompletionRate >= 20
                                ? isDark
                                  ? "from-amber-600/80 to-amber-400/80"
                                  : "from-amber-600 to-amber-400"
                                : isDark
                                ? "from-red-600/80 to-red-400/80"
                                : "from-red-600 to-red-400"
                            }`}
                            style={{
                              width:
                                currentWeek.overallCompletionRate === 0
                                  ? "0%"
                                  : `${Math.max(
                                      3,
                                      currentWeek.overallCompletionRate || 0
                                    )}%`,
                            }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className={`text-sm font-bold ${
                                isDark
                                  ? "text-white"
                                  : currentWeek.overallCompletionRate > 40
                                  ? "text-white"
                                  : "text-gray-800"
                              }`}
                            >
                              {currentWeek.overallCompletionRate?.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                {localCurrentTimetable && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openManageActivitiesModal}
                      className={`p-2.5 rounded-lg inline-flex items-center transition-colors ${
                        isDark
                          ? "bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30"
                          : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                      }`}
                      title="Manage Activities"
                      aria-label="Manage Activities"
                      disabled={isSubmitting}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1" />
                      <span className="font-medium text-xs hidden sm:inline">
                        Manage
                      </span>
                    </button>

                    <button
                      onClick={() => openCreateTimetableModal("edit")}
                      className={`p-2.5 rounded-lg inline-flex items-center transition-colors ${
                        isDark
                          ? "bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30"
                          : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                      }`}
                      title="Edit Timetable"
                      aria-label="Edit Timetable"
                      disabled={isSubmitting}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      <span className="font-medium text-xs hidden sm:inline">
                        Edit
                      </span>
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteTimetable(localCurrentTimetable.id)
                      }
                      className={`p-2.5 rounded-lg inline-flex items-center transition-colors ${
                        isDark
                          ? "bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30"
                          : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      }`}
                      title="Delete Timetable"
                      aria-label="Delete Timetable"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span className="font-medium text-xs hidden sm:inline">
                        Delete
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {currentWeek ? (
              <TimetableTable
                currentWeek={currentWeek}
                isDark={isDark}
                toggleActivityStatus={toggleActivityStatus}
                getCategoryStyle={getCategoryStyle}
                formatTimeRange={formatTimeRange}
              />
            ) : (
              <div className="text-center py-12 px-4">
                <div
                  className={`mb-4 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-60" />
                  <p className="text-lg font-medium">No activities found</p>
                  <p className="text-sm mt-1 opacity-80">
                    Add some activities to get started with your schedule
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openAddActivityModal}
                  className={`mt-2 px-4 py-2 rounded-lg shadow-md ${
                    isDark
                      ? "bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40 border border-indigo-500/40"
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300"
                  }`}
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add First Activity
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        <ModalWrapper isOpen={activeModal === "add"} onClose={closeAllModals}>
          <AddActivityModal
            isOpen={activeModal === "add"}
            onClose={closeAllModals}
            onSubmit={handleAddActivity}
            initialData={editingActivity}
            categories={timetableCategories}
            isLoading={isCategoryLoading}
            isSubmitting={isSubmitting}
          />
        </ModalWrapper>

        <ModalWrapper
          isOpen={activeModal === "manage"}
          onClose={closeAllModals}
        >
          <ManageActivitiesModal
            isOpen={activeModal === "manage"}
            onClose={closeAllModals}
            activities={activities}
            onSubmit={handleManageActivities}
            isSubmitting={isSubmitting}
            onDelete={handleDeleteActivity}
            categories={timetableCategories}
            isLoading={isCategoryLoading}
          />
        </ModalWrapper>

        <ModalWrapper
          isOpen={activeModal === "history"}
          onClose={closeAllModals}
        >
          <TimetableHistory
            onClose={closeAllModals}
            fetchHistory={fetchHistory}
            currentTimetable={localCurrentTimetable || currentTimetable}
          />
        </ModalWrapper>

        <ModalWrapper isOpen={activeModal === "stats"} onClose={closeAllModals}>
          {stats && <TimetableStats stats={stats} onClose={closeAllModals} />}
        </ModalWrapper>

        <ModalWrapper
          isOpen={
            activeModal === "createTimetable" || activeModal === "editTimetable"
          }
          onClose={closeAllModals}
        >
          <CreateTimetableModal
            onClose={closeAllModals}
            onSubmit={
              activeModal === "editTimetable" && localCurrentTimetable
                ? (data) =>
                    handleUpdateTimetable(localCurrentTimetable.id, data)
                : handleCreateTimetable
            }
            initialData={
              activeModal === "editTimetable" && localCurrentTimetable
                ? localCurrentTimetable
                : null
            }
            isSubmitting={isSubmitting}
          />
        </ModalWrapper>

        <AnimatePresence>
          {activeModal === "categoryManagement" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
            >
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={closeAllModals}
              ></div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative w-full max-w-4xl p-6 rounded-lg shadow-xl border ${
                  isDark
                    ? "bg-gray-900 border-indigo-500/30"
                    : "bg-white border-indigo-300/50"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2
                    className={`text-xl font-bold flex items-center gap-2 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <Tag
                      size={20}
                      className={isDark ? "text-indigo-400" : "text-indigo-600"}
                    />
                    Manage Categories
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeAllModals}
                    className={`p-2 rounded-full transition-colors ${
                      isDark
                        ? "hover:bg-gray-700 text-gray-400"
                        : "hover:bg-gray-200 text-gray-500"
                    }`}
                  >
                    <X size={20} />
                  </motion.button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                  <CategoryManagement
                    categories={categories}
                    defaultCategories={defaultCategories}
                    loading={categoriesLoading}
                    onAdd={async (data) => {
                      try {
                        await addCategory(data);
                        await refreshTimetableCategories();
                      } catch (err) {
                        console.error("Error adding category:", err);
                      }
                    }}
                    onUpdate={async (id, data) => {
                      try {
                        await updateCategory(id, data);
                        await refreshTimetableCategories();
                      } catch (err) {
                        console.error("Error updating category:", err);
                      }
                    }}
                    onDelete={async (id) => {
                      try {
                        await deleteCategory(id);
                        await refreshTimetableCategories();
                      } catch (err) {
                        console.error("Error deleting category:", err);
                      }
                    }}
                    onRefresh={async () => {
                      await fetchCategories();
                      await refreshTimetableCategories();
                    }}
                    type="timetable"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ModalWrapper
        isOpen={activeModal === "deleteTimetable"}
        onClose={closeAllModals}
      >
        <DeleteTimetableModal
          isOpen={activeModal === "deleteTimetable"}
          onClose={closeAllModals}
          onConfirm={confirmDeleteTimetable}
          timetableName={timetableToDelete?.name || ""}
          isSubmitting={isSubmitting}
        />
      </ModalWrapper>
    </section>
  );
};

export default TimetablePage;
