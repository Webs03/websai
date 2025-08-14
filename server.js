const express = require("express");
const fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();
const stringSimilarity = require("string-similarity");

const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());


// List of free models to try in order
const MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "nousresearch/nous-capybara-7b:free"
];

async function getAIResponse(message) {
  for (const model of MODELS) {
    try {
      console.log(`🔍 Trying model: ${model}`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: message }]
        })
      });

      const data = await response.json();

      if (data?.choices?.[0]?.message?.content) {
        console.log(`✅ Success with model: ${model}`);
        return data.choices[0].message.content;
      } else {
        console.warn(`⚠️ Model ${model} failed, trying next...`);
      }
    } catch (err) {
      console.error(`❌ Error with model ${model}:`, err.message);
    }
  }

  throw new Error("All models failed");
}

// Chat route
// Chat route
// Install this first if you don't have it: npm install string-similarity

// Chat route
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const lowerMsg = message.toLowerCase();

  // ✅ Core "meaning" triggers
  const creatorPhrases = [
    "who created you",
    "who are you",
    "describe yourself",
    "tell me about yourself",
    "introduce yourself",
    "i want to know more about you",
    "who made you",
    "who built you",
    "who developed you",
    "who invented you",
    "who designed you",
    "who programmed you",
    "who is your creator",
    "who is your owner",
    "who is your founder",
    "where do you come from",
    "so its Edison Chazumbwa who made you",
    "Who is Edison Chazumbwa",
    "Do you know Edison Chazumbwa",
    "who runs you",
    "who produced you",
    "who authored you",
    "who coded you"
  ];

  // Check exact or fuzzy match
  const match = creatorPhrases.some(phrase => {
    // ✅ Exact substring match
    if (lowerMsg.includes(phrase)) return true;

    // ✅ Fuzzy match threshold (0.7 = 70% similarity)
    const similarity = stringSimilarity.compareTwoStrings(lowerMsg, phrase);
    return similarity >= 0.7;
  });

  if (match) {
    return res.json({
      reply: "I am Webs, created and trained by Edison Chazumbwa. He is currently a student at the University of Malawi. If you want to know more about him go to the ABOUT section at the top left corner."
    });
  }

  // If not a match, continue to AI model
  try {
    const reply = await getAIResponse(message);
    res.json({ reply });
  } catch (error) {
    console.error("OpenRouter Error:", error);
    res.status(500).json({ reply: "All AI models failed. Please try again later." });
  }
});

// Start server
app.listen(5000, () => console.log("✅ Server running on port 5000"));
