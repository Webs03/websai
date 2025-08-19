// src/server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import stringSimilarity from "string-similarity";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// ✅ Choose provider (set in .env as PROVIDER=gemini or openrouter)
const PROVIDER = process.env.PROVIDER || "gemini";

// API keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const creatorPhrases = [
  "who created you", "who are you", "describe yourself", "tell me about yourself",
  "introduce yourself", "i want to know more about you", "who made you",
  "who built you", "who developed you", "who invented you", "who designed you",
  "who programmed you", "who is your creator", "who is your owner",
  "who is your founder", "where do you come from", "so its Edison Chazumbwa who made you",
  "who is Edison Chazumbwa", "do you know Edison Chazumbwa", "who runs you",
  "who produced you", "who authored you", "who coded you"
];


// --- Routes ---

// Test route
app.get("/", (req, res) => {
  res.json({ status: "✅ Backend running", provider: PROVIDER });
});

// Chat route
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  const lowerMsg = message.toLowerCase();
  // ✅ Handle creator questions
    const match = creatorPhrases.some(phrase => {
      if (lowerMsg.includes(phrase)) return true;
      const similarity = stringSimilarity.compareTwoStrings(lowerMsg, phrase);
      return similarity >= 0.7;
    });

    if (match) {
      return res.json({
        reply: "I am Webs, created and trained by Edison Chazumbwa. He is currently a student at the University of Malawi. If you want to know more about him go to the ABOUT section at the top left corner."
      });
    }

  if (!message) {
    return res.status(400).json({ reply: "⚠️ No message provided." });
  }

  try {
    let aiReply = "";

    if (PROVIDER === "gemini") {
      // --- Google Gemini ---
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
          }),
        }
      );

      const data = await response.json();
      aiReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response from Gemini.";
    } 
    
    else if (PROVIDER === "openrouter") {
      // --- OpenRouter ---
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo", // change model if needed
          messages: [{ role: "user", content: message }],
        }),
      });

      const data = await response.json();
      aiReply =
        data?.choices?.[0]?.message?.content?.trim() ||
        "⚠️ No response from OpenRouter.";
    } 
    
    else {
      aiReply = "⚠️ Invalid provider selected in .env (use 'gemini' or 'openrouter').";
    }
    

    // ✅ Always return in the same format
    res.json({ reply: aiReply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ reply: "⚠️ Error connecting to AI provider." });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🤖 Active provider: ${PROVIDER}`);
});
