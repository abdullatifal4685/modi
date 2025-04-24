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

// Webhook endpoint
app.post("/webhook", (req, res) => {
  const intentName = req.body.queryResult.intent.displayName; // Get the intent name
  const userInput = req.body.queryResult.queryText; // Get the user's input

  console.log(`Intent: ${intentName}`);
  console.log(`User Input: ${userInput}`);

  // Friendly and empathetic persona response
  let responseText = "Hmm, let me think... 🤔 ";

  // Add dynamic content based on the intent
  if (intentName === "What_is_Learning_Organization") {
    responseText += "A Learning Organization is a system that helps people grow and learn together. It's all about teamwork and continuous improvement! Let me know if you'd like more details. 😊";
  } else if (intentName === "Knowledge Management") {
    responseText += "Knowledge Management is about sharing and managing knowledge to help everyone succeed. It's like building a library of wisdom for your team! How can I help you with this? 😊";
  } else if (intentName === "Default Welcome Intent") {
    responseText = "Hey there! I'm MODI, your friendly assistant. How can I make your day better? 😊";
  } else {
    // Default fallback response
    responseText = "I'm here to help! 😊 Could you tell me a bit more about what you're looking for?";
  }

  // Send the response back to Dialogflow
  res.json({
    fulfillmentText: responseText,
  });
});

// Example endpoint
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
