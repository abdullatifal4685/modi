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

// Allow requests from all origins
const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST"], // Allow specific HTTP methods
  allowedHeaders: ["Content-Type"], // Allow specific headers
};

app.use(cors(corsOptions)); // Use the updated CORS options
app.use(express.json()); // Parse JSON requests

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
  let responseText = "";

  // Add dynamic content based on the intent
  if (intentName === "What_is_Learning_Organization") {
    responseText = "Oh, that's a great question! 🌟 A Learning Organization is a system that helps people grow and learn together. It's all about teamwork and continuous improvement! Let me know if you'd like more details. 😊";
  } else if (intentName === "Knowledge Management") {
    responseText = "I'm glad you asked! 📚 Knowledge Management is about sharing and managing knowledge to help everyone succeed. It's like building a library of wisdom for your team! How can I assist you further? 😊";
  } else if (intentName === "Default Welcome Intent") {
    responseText = "Hi there! 👋 I'm MODI, your friendly assistant. How can I brighten your day today? 😊";
  } else {
    // Default fallback response
    responseText = "Hmm, I’m not sure about that, but I’d love to help! Could you try rephrasing your question? 💡";
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
