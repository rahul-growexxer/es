import React, { useState, useRef, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";

// const API = 'https://elite-poc.growexx.com/process_workflow'
// const API = 'https://5ad5-120-72-93-82.ngrok-free.app/process_task'
const API = "http://localhost:3000/api/getNextWorkflow"

const taskForm = () => {
  const [initialtaskData, setInitialtaskData] = useState({
    task1: {
      question: "Enter your details",
      fields: ["First Name", "Middle Name", "Last Name", "Email", "Issue Description"],
      options: { 'Employment Law': "task2", "Business Contract Dispute": "task3" },
    },
    task2: {
      question: "Enter additional personal details",
      fields: ["Phone Number", "Address", "Employment Status", "Type of Employment Issue", "Date of Incident", "Employer Contacted?", "Case Description"],
      options: { X: "end", Y: "end" },
    },
    task3: {
      question: "Enter company details",
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
        <div style={{ textAlign: "left" }}> {/* Align content to the left */}
          <h3 className="font-semibold">Reason for task:</h3>
          <p className="text-md mt-1">{taskReason}</p>
        </div>,
        {
          duration: 50000,
          position: "top-left", // Align to the top-left
          style: {
            background: "#432dd7",
            color: "#fff",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            textAlign: "left", // Ensure text alignment is left
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

      console.log(conflictCheck, "dhyey");

      if (conflictCheck[0] === "Conflict Check" && Array.isArray(conflictCheck[1])) {

        const conflictData = conflictCheck[1].slice(1);

        conflictData.forEach(([fullName, similarity]) => {
          toast(
            `${fullName} - Similarity: ${similarity}`,
            {
              icon: "⚠️",
              style: {
                borderRadius: "8px",
                background: "#333",
                color: "#fff",
              },
              duration: 30000,
            }
          );
        })
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
            margin: "16px", // Add some margin
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

export default taskForm;