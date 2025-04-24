const express = require("express");
const cors = require("cors");
const dialogflow = require("@google-cloud/dialogflow");
const uuid = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

// Dialogflow ES setup
const sessionClient = new dialogflow.SessionsClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Use the environment variable
});

const projectId = "chatbotagent-tfft"; // Replace with your Dialogflow ES project ID

// Allow requests from your GitHub Pages domain
const corsOptions = {
  origin: ["https://abdullatifal4685.github.io"], // Add your GitHub Pages URL here
  methods: ["GET", "POST"], // Allow specific HTTP methods
  allowedHeaders: ["Content-Type"], // Allow specific headers
};

app.use(cors(corsOptions));
app.use(express.json());

// Chat endpoint
app.post("/chat", async (req, res) => {
  const userInput = req.body.input;
  const userId = req.body.userId || uuid.v4(); // Generate a unique session ID if not provided

  console.log("User Input:", userInput);

  if (!userInput || typeof userInput !== "string") {
    return res.status(400).json({ error: "Invalid input. Please provide a valid message." });
  }

  try {
    // Create a session path
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, userId);

    // Send the user input to Dialogflow ES
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: userInput,
          languageCode: "en", // Set the language code
        },
      },
    };

    const [response] = await sessionClient.detectIntent(request);
    const botResponse = response.queryResult.fulfillmentText || "I'm sorry, I couldn't process your request.";

    console.log("Dialogflow ES Response:", botResponse);

    res.json({ reply: botResponse });
  } catch (error) {
    console.error("Dialogflow ES Error:", error);
    res.status(500).json({ error: "Failed to fetch response from Dialogflow ES." });
  }
});

// Example endpoint
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});