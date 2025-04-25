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
  const userId = req.body.sessionId || uuid.v4(); // Use sessionId from frontend or generate one
  const contexts = req.body.contexts || []; // Get active contexts from the request

  console.log("User Input:", userInput);
  console.log("Received Contexts:", contexts);

  if (!userInput || typeof userInput !== "string") {
    return res.status(400).json({ error: "Invalid input. Please provide a valid message." });
  }

  try {
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, userId);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: userInput,
          languageCode: "en",
        },
      },
    };

    if (contexts.length > 0) {
      request.queryParams = {
        contexts: contexts.map((context) => ({
          name: `${sessionPath}/contexts/${context.name}`,
          lifespanCount: context.lifespanCount,
        })),
      };
    }

    console.log("Dialogflow Request:", JSON.stringify(request, null, 2));

    const [response] = await sessionClient.detectIntent(request);
    const botResponse = response.queryResult.fulfillmentText || "I'm sorry, I couldn't process your request.";

    const updatedContexts = response.queryResult.outputContexts.map((context) => ({
      name: context.name.split("/").pop(),
      lifespanCount: context.lifespanCount,
    }));

    console.log("Dialogflow Response:", botResponse);
    console.log("Updated Contexts:", updatedContexts);

    res.json({
      reply: botResponse,
      contexts: updatedContexts, // Ensure updated contexts are sent back
    });
  } catch (error) {
    console.error("Dialogflow Error:", error);
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
