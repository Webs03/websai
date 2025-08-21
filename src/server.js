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
const PROVIDER = process.env.PROVIDER || "gemini";

// API keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 🧠 In-memory chat + cache storage (resets when server restarts)
const conversations = {}; // { sessionId: [{role, content}, ...] }
const cache = {}; // { messageText: reply }
const messageLimits = {}; // { sessionId: count }

const MAX_MESSAGES = 5; // limit per session

// Phrases for custom creator response
const creatorPhrases = [
  "who created you", "who are you", "describe yourself", "tell me about yourself",
  "introduce yourself", "i want to know more about you", "who made you",
  "who built you", "who developed you", "who invented you", "who designed you",
  "who programmed you", "who is your creator", "who trained you", "so whats the story behind you",
  "who is your owner", "who is your founder", "where do you come from", "so its Edison Chazumbwa who made you",
  "who is Edison Chazumbwa", "do you know Edison Chazumbwa", "who runs you",
  "who produced you", "who authored you", "who is webs ai", "who coded you"
];

// --- Routes ---

app.get("/", (req, res) => {
  res.json({ status: "✅ Backend running", provider: PROVIDER });
});

app.post("/api/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || !sessionId) {
    return res.status(400).json({ reply: "⚠️ Please enter a message before sending." });
  }

  // initialize session if new
  if (!conversations[sessionId]) conversations[sessionId] = [];
  if (!messageLimits[sessionId]) messageLimits[sessionId] = 0;

  // ✅ Rate limit check
  if (messageLimits[sessionId] >= MAX_MESSAGES) {
    return res.json({
      reply: "⚠️ Demo limit reached (5 free messages). Please come back later or contact Edison Chazumbwa for more."
    });
  }

  const lowerMsg = message.toLowerCase();

  // ✅ Handle creator questions
  const match = creatorPhrases.some(phrase => {
    if (lowerMsg.includes(phrase)) return true;
    const similarity = stringSimilarity.compareTwoStrings(lowerMsg, phrase);
    return similarity >= 0.7;
  });

  if (match) {
    conversations[sessionId].push({ role: "user", content: message });
    const reply = "I am Webs, created by Edison Chazumbwa, a student at the University of Malawi. For more, check the ABOUT section.";
    conversations[sessionId].push({ role: "assistant", content: reply });
    messageLimits[sessionId]++;
    return res.json({ reply });
  }

  // ✅ Check cache first
  if (cache[lowerMsg]) {
    conversations[sessionId].push({ role: "user", content: message });
    conversations[sessionId].push({ role: "assistant", content: cache[lowerMsg] });
    messageLimits[sessionId]++;
    return res.json({ reply: cache[lowerMsg] });
  }

  try {
    let aiReply = "";

    // Push user message into conversation
    conversations[sessionId].push({ role: "user", content: message });

    if (PROVIDER === "gemini") {
      // --- Google Gemini ---
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: conversations[sessionId].map(msg => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }]
            })),
            generationConfig: {
              maxOutputTokens: 150, // keep responses short = save tokens
              temperature: 0.7
            }
          })
        }
      );

      const data = await response.json();
      aiReply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ Sorry, I couldn’t generate a response. Please try again.";
    } else if (PROVIDER === "openai") {
      // --- OpenAI GPT ---
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // cheaper for demo
          messages: conversations[sessionId],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      const data = await response.json();
      aiReply =
        data?.choices?.[0]?.message?.content?.trim() ||
        "⚠️ Sorry, I couldn’t generate a response. Please try again.";
    } else {
      aiReply = "⚠️ Service is temporarily unavailable. Please try again later.";
    }

    // Save assistant response + update cache + increment limit
    conversations[sessionId].push({ role: "assistant", content: aiReply });
    cache[lowerMsg] = aiReply;
    messageLimits[sessionId]++;

    // ✅ Add demo banner to all AI replies
    const finalReply = `${aiReply}\n\n---\n🧪 *Demo powered by Gemini 1.5 Flash (5 free messages per session).*`;

    res.json({ reply: finalReply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ reply: "⚠️ Something went wrong while processing your request. Please try again." });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🤖 Active provider: ${PROVIDER}`);
});
