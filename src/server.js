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
const PROVIDER = process.env.PROVIDER || "openrouter";

const creatorPhrases = [
  "who created you", "who are you", "describe yourself", "tell me about yourself",
  "introduce yourself", "i want to know more about you", "who made you",
  "who built you", "who developed you", "who invented you", "who designed you",
  "who programmed you", "who is your creator", "who is your owner",
  "who is your founder", "where do you come from", "so its Edison Chazumbwa who made you",
  "who is Edison Chazumbwa", "do you know Edison Chazumbwa", "who runs you",
  "who produced you", "who authored you", "who coded you"
];

// Function to call AI depending on provider
async function getAIResponse(message) {
  if (PROVIDER === "groq") {
    console.log("🔗 Using Groq API");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = await res.json();
    console.log("Groq Raw:", data);
    return data.choices?.[0]?.message?.content || "Daily free limit reached. Please try again later";
  }

  // Default: OpenRouter
  console.log("🔗 Using OpenRouter API");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [{ role: "user", content: message }],
    }),
  });
  const data = await res.json();
  console.log("OpenRouter Raw:", data);
  return data.choices?.[0]?.message?.content || "Daily free limit reached. Please try again later";
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const lowerMsg = message.toLowerCase();

    // ✅ Handle "creator" questions before calling AI
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

    // Otherwise, call AI provider
    const reply = await getAIResponse(message);
    res.json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`👉 Active provider: ${PROVIDER}`);
});
