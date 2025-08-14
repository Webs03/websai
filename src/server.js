import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import stringSimilarity from "string-similarity";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// ✅ Only free models are listed first
const MODELS = [
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free"
];

// Log key and models to verify Railway deployment
console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY ? "✅ Loaded" : "❌ Missing");
console.log("MODELS array:", MODELS);

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
      console.log("Raw response:", JSON.stringify(data));

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

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const lowerMsg = message.toLowerCase();

  const creatorPhrases = [
    "who created you", "who are you", "describe yourself", "tell me about yourself",
    "introduce yourself", "i want to know more about you", "who made you",
    "who built you", "who developed you", "who invented you", "who designed you",
    "who programmed you", "who is your creator", "who is your owner",
    "who is your founder", "where do you come from", "so its Edison Chazumbwa who made you",
    "Who is Edison Chazumbwa", "Do you know Edison Chazumbwa", "who runs you",
    "who produced you", "who authored you", "who coded you"
  ];

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

  try {
    const reply = await getAIResponse(message);
    res.json({ reply });
  } catch (error) {
    console.error("OpenRouter Error:", error);
    res.status(500).json({ reply: "All AI models failed. Please try again later." });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
