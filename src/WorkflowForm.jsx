import React, { useState, useRef, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { AlertCircle } from 'lucide-react';

// const API = 'http://localhost:3000/api/getNextWorkflow'
const API = 'https://elite-poc.growexx.com/process_task'
// const API = "https://2d4f-2402-3a80-4658-4892-517-d/process_task"

const taskForm = () => {
  const [initialtaskData, setInitialtaskData] = useState({
    task1: {
      question: "Enter your details",
      fields: ["First Name", "Middle Name", "Last Name", "Email", "Issue Description"],
      options: { 'Employment Law': "task2", "Business Contract Dispute": "task3" },
    },
    task2: {
      question: "Employment Law Assistance Request",
      fields: ["Phone Number", "Address", "Employment Status", "Type of Employment Issue", "Date of Incident", "Employer Contacted?", "Case Description"],
      options: { X: "end", Y: "end" },
    },
    task3: {
      question: "Business Contract Dispute Intake Form",
      fields: ["Company Name", "Job Title", "Type of Contract", "Nature of the Dispute", "Date the Dispute Started", "Attempts to Resolve the Dispute", "Upload Contract or Supporting Documents"],
      options: { M: "end", N: "end" },
    },
  });

  const [taskData, settaskData] = useState(initialtaskData);
  const [currenttask, setCurrenttask] = useState("task1");
  const [formData, setFormData] = useState({});
  const [selectedOption, setSelectedOption] = useState("");
  const [selectionPath, setSelectionPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState([]);
  const [showNewOptionInput, setShowNewOptionInput] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [taskReason, settaskReason] = useState("");
  const [taskHistory, settaskHistory] = useState([]);
  const taskRef = useRef(null);

  useEffect(() => {
    if (taskRef.current) {
      taskRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [taskHistory]);

  // Show taskReason as a toast message
  useEffect(() => {
    if (taskReason) {
      toast(
        <div style={{ textAlign: "left" }}>
          {/* Align content to the left */}
          <h3 className="font-semibold">Reason for task:</h3>
          <p className="text-md mt-1">{taskReason}</p>
        </div>,
        {
          duration: 1500000,
          position: "top-left", // Align to the top-left
          style: {
            background: "#432dd7",
            color: "#fff",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            textAlign: "left", // Ensure text alignment is left
            width: "450px", // Increase the width
            maxWidth: "90vw", // Ensure it remains responsive
          },
        }
      );
    }
  }, [taskReason]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const handleNextStep = async () => {
    if (!selectedOption) return;

    setSelectionPath((prev) => [...prev, selectedOption]);

    if (dynamicOptions.includes(selectedOption)) {
      setLoading(true);
      try {
        const response = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ option: selectedOption }),
        });

        const data = await response.json();
        const nexttask = data.nexttask;

        if (nexttask) {
          setCurrenttask(nexttask);
          settaskData((prev) => ({
            ...prev,
            [nexttask]: {
              question: `Dynamic question for ${selectedOption}`,
              fields: ["Dynamic Field 1", "Dynamic Field 2"],
              options: { Continue: "end" },
            },
          }));

          setInitialtaskData((prev) => ({
            ...prev,
            [nexttask]: {
              question: `Dynamic question for ${selectedOption}`,
              fields: ["Dynamic Field 1", "Dynamic Field 2"],
              options: { Continue: "end" },
            },
          }));
        }
      } catch (error) {
        console.error("Error fetching next task:", error);
      } finally {
        setLoading(false);
      }
    } else {
      const nexttask = taskData[currenttask].options[selectedOption];
      if (nexttask) {
        setCurrenttask(nexttask);
        settaskHistory((prev) => [...prev, currenttask]);
      }
    }

    setSelectedOption("");
  };

  const addNewOption = async () => {
    if (!newOptionName.trim()) return;

    setLoading(true);

    const taskWiseData = {};
    Object.keys(initialtaskData).forEach((taskKey) => {
      taskWiseData[taskKey] = {};
      initialtaskData[taskKey].fields.forEach((field) => {
        taskWiseData[taskKey][field] = formData[field] || "";
      });
    });

    const payload = {
      Options: initialtaskData.task1.options,
      tasks: taskWiseData,
      currenttask,
      newOption: newOptionName,
    };

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const [nexttask, reason] = Object.entries(data)[1];
      const conflictCheck = Object.entries(data)[0];

      if (conflictCheck[0] === "Conflict Check" && Array.isArray(conflictCheck[1])) {
        const conflictData = conflictCheck[1];


        toast.custom(
          (t) => (
            <ConflictCheckToast data={conflictData} />
          ),
          { duration: 1500000 }
        );
      }

      settaskData((prev) => {
        const updatedtask = {
          ...prev,
          [currenttask]: {
            ...prev[currenttask],
            options: { ...prev[currenttask].options, [newOptionName]: nexttask },
          },
        };

        setInitialtaskData(updatedtask);
        return updatedtask;
      });

      setDynamicOptions([...dynamicOptions, newOptionName]);
      setNewOptionName("");
      setShowNewOptionInput(false);
      settaskReason(reason);

      setSelectionPath((prev) => [...prev, newOptionName]);
      setCurrenttask(nexttask);
      settaskHistory((prev) => [...prev, currenttask]);

    } catch (error) {
      console.error("Error fetching next task:", error);
    } finally {
      setLoading(false);
    }
  };

  const rendertask = (taskKey) => {
    const task = taskData[taskKey];
    return (
      <div key={taskKey} className="p-8 max-w-lg mx-auto bg-white rounded-2xl shadow-lg mb-6" ref={taskKey === currenttask ? taskRef : null}>
        <h2 className="text-2xl font-extrabold mb-6 text-center">{task.question}</h2>
        <form className="space-y-5">
          {task.fields?.map((field) => (
            <div key={field} className="flex flex-col">
              <label className="text-lg font-medium mb-2">{field}</label>
              <input
                type="text"
                name={field}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          ))}
        </form>

        {taskKey === currenttask && renderOptionsSection()}
      </div>
    );
  };

  const renderOptionsSection = () => {
    if (currenttask === "task1") {
      return (
        <div className="mt-6">
          <label className="block text-lg font-medium mb-2">Choose a legal issue</label>
          <div className="flex gap-2 mb-2">
            <select
              value={selectedOption}
              onChange={handleSelectChange}
              className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select an option</option>
              {Object.keys(taskData[currenttask].options).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewOptionInput(!showNewOptionInput)}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300"
            >
              + Add
            </button>
          </div>

          {showNewOptionInput && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="Enter new option name"
                className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={addNewOption}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300"
              >
                Save
              </button>
            </div>
          )}

          <button
            className="w-full mt-4 px-6 py-3 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition duration-300 disabled:opacity-50"
            onClick={handleNextStep}
            disabled={loading}
          >
            {loading ? "Loading..." : "Next"}
          </button>
        </div>
      );
    }

    if (currenttask === "task2" || currenttask === "task3") {
      return (
        <div className="mt-6">
          <button
            className="w-full mt-4 px-6 py-3 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition duration-300 disabled:opacity-50"
            onClick={handleNextStep}
            disabled={loading}
          >
            {loading ? "Loading..." : "Next"}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-8">
      <Toaster
        position="top-left" // Align toasts to the top-left corner
        toastOptions={{
          style: {
            marginBottom: "20px",
            padding: "16px",
            background: "#FEF3C7", // Background color (yellow-100)
            color: "#92400E", // Text color (yellow-900)
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            textAlign: "left", // Align text to the left
          },
        }}
      /> {/* Add this line to enable toast messages */}
      {taskHistory.map((taskKey) => rendertask(taskKey))}
      {rendertask(currenttask)}
      <div className="mt-6 text-center">
        <h3 className="font-semibold text-lg">Selected Path:</h3>
        <p className="text-md mt-1">{selectionPath.join(" > ")}</p>
      </div>
    </div>
  );
};

const ConflictCheckToast = ({ data }) => {
  const CircularProgress = ({ percentage }) => {
    // Remove % sign if present and convert to number
    const numericPercentage = parseFloat(percentage.replace('%', ''));
    const radius = 30; // Increased from 18
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (numericPercentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-16 h-16 transform -rotate-90"> {/* Increased from w-12 h-12 */}
          <circle
            className="text-gray-200"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="32" // Adjusted center point
            cy="32" // Adjusted center point
          />
          <circle
            className="text-blue-600"
            strokeWidth="4"
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="32" // Adjusted center point
            cy="32" // Adjusted center point
            style={{
              strokeDasharray: `${circumference} ${circumference}`,
              strokeDashoffset: strokeDashoffset
            }}
          />
        </svg>
        <span className="absolute text-base font-semibold text-gray-700"> {/* Increased text size */}
          {numericPercentage.toFixed(1)}%
        </span>
      </div>
    );
  };

  // Skip header row
  const conflictData = data.slice(1);

  return (
    <div className="min-w-[450px] bg-white rounded-lg shadow-lg overflow-hidden"> {/* Increased min-width */}
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-gray-900">Potential Matches Found</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {conflictData.map(([fullName, similarity], index) => (
          <div
            key={index}
            className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0" // Increased padding
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{fullName}</p>
            </div>
            <CircularProgress percentage={similarity} />
          </div>
        ))}
      </div>
    </div>
  );
};
export default taskForm;