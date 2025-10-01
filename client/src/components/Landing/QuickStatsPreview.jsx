import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  TrendingUp,
  Target,
  CheckCircle,
  Zap } from
"lucide-react";
import { useAuth } from "../../context/AuthContext";
import useTimetable from "../../hooks/useTimetable";
import useWorkingHours from "../../hooks/useWorkingHours";
import useSkills from "../../hooks/useSkills";

const QuickStatsPreview = ({ isDark, showWelcomeInstead = false }) => {
  const [realStats, setRealStats] = useState({
    weeklyCompletion: 0,
    hoursThisWeek: 0,
    activeTimetables: 0,
    skillsInProgress: 0,
    hasData: false,
    loading: true
  });

  const { token } = useAuth();


  const { timetables, currentWeek, loading: timetableLoading } = useTimetable();
  const { stats: workingHoursStats, loading: hoursLoading } = useWorkingHours();
  const { skills, loading: skillsLoading } = useSkills();

  useEffect(() => {
    if (!token) return;


    if (timetableLoading || hoursLoading || skillsLoading) {
      return;
    }


    const calculateRealStats = () => {

      let weeklyCompletion = 0;
      if (
      currentWeek &&
      currentWeek.activities &&
      currentWeek.activities.length > 0)
      {
        const totalActivities = currentWeek.activities.length * 7;
        const completedActivities = currentWeek.activities.reduce(
          (total, activity) => {
            return total + activity.dailyStatus.filter(Boolean).length;
          },
          0
        );
        weeklyCompletion =
        totalActivities > 0 ?
        Math.round(completedActivities / totalActivities * 100) :
        0;
      }


      const hoursThisWeek = workingHoursStats?.totalAchievedHours || 0;


      const activeTimetables =
      timetables?.filter((t) => t.isActive)?.length || 0;


      let skillsInProgress = 0;
      if (skills && typeof skills === "object") {
        skillsInProgress = Object.values(skills).
        flat().
        filter(
          (skill) =>
          skill.currentLevel > 0 && skill.currentLevel < skill.targetLevel
        ).length;
      }


      const hasData =
      weeklyCompletion > 0 ||
      hoursThisWeek > 0 ||
      activeTimetables > 0 ||
      skillsInProgress > 0;

      setRealStats({
        weeklyCompletion,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        activeTimetables,
        skillsInProgress,
        hasData,
        loading: false
      });
    };

    calculateRealStats();
  }, [
  token,
  timetables,
  currentWeek,
  workingHoursStats,
  skills,
  timetableLoading,
  hoursLoading,
  skillsLoading]
  );

  const statItems = [
  {
    label: "Weekly Progress",
    value: `${realStats.weeklyCompletion}%`,
    icon: CheckCircle,
    color: "emerald",
    description: "Activities completed"
  },
  {
    label: "Hours",
    value: `${realStats.hoursThisWeek}h`,
    icon: Clock,
    color: "blue",
    description: "Time tracked"
  },
  {
    label: "Active Timetables",
    value: realStats.activeTimetables,
    icon: Calendar,
    color: "indigo",
    description: "Schedules managed"
  },
  {
    label: "Skills in Progress",
    value: realStats.skillsInProgress,
    icon: TrendingUp,
    color: "purple",
    description: "Areas developing"
  }];


  const getColorClasses = (color) => {
    const colors = {
      emerald: isDark ?
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
      "bg-emerald-50 text-emerald-600 border-emerald-200",
      blue: isDark ?
      "bg-blue-500/10 text-blue-400 border-blue-500/20" :
      "bg-blue-50 text-blue-600 border-blue-200",
      indigo: isDark ?
      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
      "bg-indigo-50 text-indigo-600 border-indigo-200",
      purple: isDark ?
      "bg-purple-500/10 text-purple-400 border-purple-500/20" :
      "bg-purple-50 text-purple-600 border-purple-200"
    };
    return colors[color];
  };


  if (showWelcomeInstead) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8">

        <div
          className={`text-center p-8 rounded-xl border ${
          isDark ?
          "bg-indigo-500/5 border-indigo-500/20 text-indigo-300" :
          "bg-indigo-50 border-indigo-200 text-indigo-700"}`
          }>

          <Zap className="w-8 h-8 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Welcome to HustleX!</h3>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>

            Start by creating your first timetable or tracking your working
            hours.
            <br />
            Your productivity journey begins here.
          </p>
        </div>
      </motion.div>);

  }


  if (realStats.loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[1, 2, 3, 4].map((i) =>
        <div
          key={i}
          className={`p-4 rounded-xl border ${
          isDark ?
          "bg-gray-800/50 border-gray-700/50" :
          "bg-gray-50 border-gray-200"}`
          }>

            <div
            className={`w-6 h-6 rounded-lg mb-3 animate-pulse ${
            isDark ? "bg-gray-700/60" : "bg-gray-300/60"}`
            } />

            <div
            className={`h-5 w-12 rounded mb-2 animate-pulse ${
            isDark ? "bg-gray-700/60" : "bg-gray-300/60"}`
            } />

            <div
            className={`h-3 w-16 rounded animate-pulse ${
            isDark ? "bg-gray-700/60" : "bg-gray-300/60"}`
            } />

          </div>
        )}
      </div>);

  }


  if (!realStats.hasData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-8">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          const colorClasses = getColorClasses(item.color);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-xl border transition-all duration-200 hover:scale-105 ${colorClasses}`}>

              <Icon className="w-6 h-6 mb-3" />
              <div className="font-bold text-xl mb-1">{item.value}</div>
              <div className="font-medium text-sm mb-1">{item.label}</div>
              <div className={`text-xs opacity-75`}>{item.description}</div>
            </motion.div>);

        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`mt-4 text-center text-sm ${
        isDark ? "text-gray-400" : "text-gray-600"}`
        }>

        <Zap className="w-4 h-4 inline mr-1" />
        Your productivity at a glance
      </motion.div>
    </motion.div>);

};

export default QuickStatsPreview;