// src/components/Timetable/ManageActivitiesModal.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  X,
  Save,
  Edit,
  Trash2,
  Clock,
  Target,
  Layers,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const DragVertical = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 4h6M9 8h6M9 12h6M9 16h6" />
  </svg>
);

const ManageActivitiesModal = ({
  isOpen,
  onClose,
  activities,
  onSubmit,
  onDelete,
  categories = [],
}) => {
  const { isDark } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [managedActivities, setManagedActivities] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    time: "",
    category: "",
  });

  useEffect(() => {
    if (activities && activities.length > 0) {
      setManagedActivities([...activities]);
    } else {
      setManagedActivities([]);
    }
  }, [activities]);

  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditFormData({
      name: managedActivities[index].name,
      time: managedActivities[index].time,
      category: managedActivities[index].category,
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditFormData({
      name: "",
      time: "",
      category: "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = () => {
    if (!editFormData.name.trim()) {
      setError("Activity name is required");
      return;
    }

    // Validate time format
    const timePattern =
      /^([0-1][0-9]|2[0-3]):([0-5][0-9])-([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timePattern.test(editFormData.time)) {
      setError("Please enter a valid time format (HH:MM-HH:MM)");
      return;
    }

    setError(null);

    const updatedActivities = [...managedActivities];
    updatedActivities[editingIndex] = {
      ...updatedActivities[editingIndex],
      ...editFormData,
    };

    setManagedActivities(updatedActivities);
    setEditingIndex(null);
  };

  const handleDeleteActivity = (index) => {
    if (onDelete) {
      onDelete(index);
    } else {
      const updatedActivities = [...managedActivities];
      updatedActivities.splice(index, 1);
      setManagedActivities(updatedActivities);
    }
  };

  const handleMoveActivity = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === managedActivities.length - 1)
    ) {
      return;
    }

    const updatedActivities = [...managedActivities];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    // Swap activities
    [updatedActivities[index], updatedActivities[newIndex]] = [
      updatedActivities[newIndex],
      updatedActivities[index],
    ];

    setManagedActivities(updatedActivities);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(managedActivities);
    } catch (err) {
      setError(err.message || "Failed to save activities");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3
          className={`text-xl font-bold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Manage Activities
        </h3>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg ${
            isDark
              ? "hover:bg-gray-800 text-gray-400"
              : "hover:bg-gray-100 text-gray-600"
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div
          className={`p-3 mb-4 rounded-lg flex items-start gap-2 ${
            isDark
              ? "bg-red-900/30 text-red-300 border border-red-900/50"
              : "bg-red-50 text-red-800 border border-red-100"
          }`}
        >
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <AnimatePresence mode="popLayout">
            {managedActivities.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center py-6 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No activities found. Add some activities first.
              </motion.div>
            ) : (
              <Reorder.Group
                values={managedActivities}
                onReorder={setManagedActivities}
                className="space-y-3"
              >
                {managedActivities.map((activity, index) => (
                  <Reorder.Item
                    key={`${activity.name}-${index}`}
                    value={activity}
                    as="div"
                  >
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`border rounded-lg overflow-hidden ${
                        isDark ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      {editingIndex === index ? (
                        <div
                          className={`p-4 ${
                            isDark ? "bg-gray-800" : "bg-gray-50"
                          }`}
                        >
                          <div className="grid grid-cols-1 gap-3">
                            {/* Activity Name */}
                            <div>
                              <label
                                className={`block text-xs font-medium mb-1 ${
                                  isDark ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Activity Name
                              </label>
                              <div className="relative">
                                <Target
                                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                    isDark
                                      ? "text-indigo-400"
                                      : "text-indigo-600"
                                  }`}
                                />
                                <input
                                  type="text"
                                  name="name"
                                  value={editFormData.name}
                                  onChange={handleEditChange}
                                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border ${
                                    isDark
                                      ? "bg-gray-700 border-gray-600 text-white"
                                      : "bg-white border-gray-300 text-gray-900"
                                  } focus:ring-2 focus:border-transparent ${
                                    isDark
                                      ? "focus:ring-indigo-500/50"
                                      : "focus:ring-indigo-500/50"
                                  }`}
                                  placeholder="Enter activity name"
                                  required
                                />
                              </div>
                            </div>

                            {/* Time */}
                            <div>
                              <label
                                className={`block text-xs font-medium mb-1 ${
                                  isDark ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Time (HH:MM-HH:MM)
                              </label>
                              <div className="relative">
                                <Clock
                                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                    isDark
                                      ? "text-indigo-400"
                                      : "text-indigo-600"
                                  }`}
                                />
                                <input
                                  type="text"
                                  name="time"
                                  value={editFormData.time}
                                  onChange={handleEditChange}
                                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border ${
                                    isDark
                                      ? "bg-gray-700 border-gray-600 text-white"
                                      : "bg-white border-gray-300 text-gray-900"
                                  } focus:ring-2 focus:border-transparent ${
                                    isDark
                                      ? "focus:ring-indigo-500/50"
                                      : "focus:ring-indigo-500/50"
                                  }`}
                                  placeholder="HH:MM-HH:MM"
                                  required
                                />
                              </div>
                            </div>

                            {/* Category */}
                            <div>
                              <label
                                className={`block text-xs font-medium mb-1 ${
                                  isDark ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Category
                              </label>
                              <div className="relative">
                                <Layers
                                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                                    isDark
                                      ? "text-indigo-400"
                                      : "text-indigo-600"
                                  }`}
                                />
                                <select
                                  name="category"
                                  value={editFormData.category}
                                  onChange={handleEditChange}
                                  className={`w-full pl-10 pr-4 py-2 text-sm rounded-lg border appearance-none ${
                                    isDark
                                      ? "bg-gray-700 border-gray-600 text-white"
                                      : "bg-white border-gray-300 text-gray-900"
                                  } focus:ring-2 focus:border-transparent ${
                                    isDark
                                      ? "focus:ring-indigo-500/50"
                                      : "focus:ring-indigo-500/50"
                                  }`}
                                  required
                                >
                                  {categories.length > 0 ? (
                                    categories.map((category) => (
                                      <option key={category} value={category}>
                                        {category}
                                      </option>
                                    ))
                                  ) : (
                                    // Default categories if none provided
                                    <>
                                      <option value="Career">Career</option>
                                      <option value="Backend">Backend</option>
                                      <option value="Core">Core</option>
                                      <option value="Frontend">Frontend</option>
                                      <option value="Mobile">Mobile</option>
                                    </>
                                  )}
                                </select>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className={`px-3 py-1.5 text-xs rounded-lg ${
                                  isDark
                                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveEdit}
                                className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 ${
                                  isDark
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                              >
                                <Save size={14} />
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`p-4 flex justify-between items-center ${
                            isDark ? "bg-gray-800" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-grow">
                            <div className="touch-none cursor-grab active:cursor-grabbing">
                              <DragVertical
                                className={`w-5 h-5 ${
                                  isDark ? "text-gray-500" : "text-gray-400"
                                }`}
                              />
                            </div>
                            <div>
                              <h4
                                className={`font-medium ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {activity.name}
                              </h4>
                              <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center">
                                  <Clock
                                    className={`w-3.5 h-3.5 mr-1 ${
                                      isDark ? "text-gray-400" : "text-gray-500"
                                    }`}
                                  />
                                  <span
                                    className={`text-xs ${
                                      isDark ? "text-gray-400" : "text-gray-500"
                                    }`}
                                  >
                                    {activity.time}
                                  </span>
                                </div>
                                <div
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    isDark
                                      ? "bg-gray-700 text-indigo-300"
                                      : "bg-indigo-50 text-indigo-700"
                                  }`}
                                >
                                  {activity.category}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <button
                              type="button"
                              onClick={() => handleMoveActivity(index, "up")}
                              disabled={index === 0}
                              className={`p-1.5 rounded-lg ${
                                isDark
                                  ? "hover:bg-gray-700 text-gray-400 disabled:text-gray-700"
                                  : "hover:bg-gray-100 text-gray-600 disabled:text-gray-300"
                              } disabled:cursor-not-allowed`}
                              title="Move up"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveActivity(index, "down")}
                              disabled={index === managedActivities.length - 1}
                              className={`p-1.5 rounded-lg ${
                                isDark
                                  ? "hover:bg-gray-700 text-gray-400 disabled:text-gray-700"
                                  : "hover:bg-gray-100 text-gray-600 disabled:text-gray-300"
                              } disabled:cursor-not-allowed`}
                              title="Move down"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(index)}
                              className={`p-1.5 rounded-lg ${
                                isDark
                                  ? "hover:bg-gray-700 text-indigo-400"
                                  : "hover:bg-gray-100 text-indigo-600"
                              }`}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(index)}
                              className={`p-1.5 rounded-lg ${
                                isDark
                                  ? "hover:bg-gray-700 text-red-400"
                                  : "hover:bg-gray-100 text-red-600"
                              }`}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border ${
              isDark
                ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-100"
            }`}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={
              isSubmitting ||
              managedActivities.length === 0 ||
              editingIndex !== null
            }
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              isDark
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Save size={16} />
            {isSubmitting ? "Saving..." : "Save Activities"}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default ManageActivitiesModal;
