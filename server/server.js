// Import the required modules
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import the cors middleware
 
// Create an express application
const app = express();
 
// Enable CORS for all routes
app.use(cors());
 
// Middleware to parse JSON request bodies
app.use(bodyParser.json());
 
// Define the POST endpoint
app.post("/api/getNextWorkflow", (req, res) => {
  const { option } = req.body; // Extract `option` from the request body
  const nextWorkflows = ["workflow2", "workflow3"]; // List of possible workflows
  const randomWorkflow = nextWorkflows[Math.floor(Math.random() * nextWorkflows.length)]; // Randomly select a workflow
 
  res.json({
  "Conflict Check": [
    [
      "Full Name",
      "Similarity Percentage"
    ],
    [
      "Matthew Samuel Rodriguez",
      "38.71%"
    ],
    [
      "George Benjamin Moore",
      "36.81%"
    ],
    [
      "Steven Matthew Anderson",
      "33.81%"
    ],
    [
      "Jacob Douglas Thompson",
      "31.14%"
    ],
    [
      "David Edward Brown",
      "30.80%"
    ]
  ],
  "task3": "The user has an employment issue related to not receiving their final paycheck, which requires additional details about their employment status and the specifics of the issue."
});
 
// {
//   "workflow2": "The user has a specific employment issue regarding their final paycheck, and this workflow is designed to gather detailed information about their employment status and the nature of the issue."
// }
});
 
// Start the server
const PORT = 3000; // Port to listen on
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});