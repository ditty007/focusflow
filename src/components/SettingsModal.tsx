import { useState, useEffect } from "react";
import type { SchedulingRules, DailyLimits } from "../types";
import { X, RotateCcw } from "lucide-react";
import { loadSchedulingRules, saveSchedulingRules, resetSchedulingRules, DEFAULT_SCHEDULING_RULES } from "../utils/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const DAY_NAMES: Array<keyof SchedulingRules> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

const SettingsModal = ({ isOpen, onClose, onSave }: SettingsModalProps) => {
  const [rules, setRules] = useState<SchedulingRules>(loadSchedulingRules());

  useEffect(() => {
    if (isOpen) {
      setRules(loadSchedulingRules());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveSchedulingRules(rules);
    onSave();
    onClose();
  };

  const handleReset = () => {
    if (confirm("Reset all settings to defaults?")) {
      resetSchedulingRules();
      setRules(DEFAULT_SCHEDULING_RULES);
    }
  };

  const updateDayLimit = (
    day: keyof SchedulingRules,
    field: keyof DailyLimits,
    value: number
  ) => {
    setRules((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Daily Limits</h3>
            <p className="text-sm text-gray-600 mb-4">
              Configure how many tasks and hours you can schedule per day.
            </p>

            <div className="space-y-4">
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <h4 className="font-medium capitalize">{day}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Hours
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        step="0.5"
                        value={rules[day].totalHours}
                        onChange={(e) =>
                          updateDayLimit(
                            day,
                            "totalHours",
                            parseFloat(e.target.value) || 1
                          )
                        }
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Important Tasks
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={rules[day].importantTasks}
                        onChange={(e) =>
                          updateDayLimit(
                            day,
                            "importantTasks",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Urgent & Important
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={rules[day].urgentImportantTasks}
                        onChange={(e) =>
                          updateDayLimit(
                            day,
                            "urgentImportantTasks",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
