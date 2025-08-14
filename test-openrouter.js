// test-openrouter.js
import fetch from "node-fetch";

const API_KEY = process.env.OPENROUTER_API_KEY;

async function test() {
  try {
    console.log("🔍 Testing connection to OpenRouter...");
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Status:", response.status);
    const data = await response.json();
    console.log("📦 Response sample:", data.models ? data.models.slice(0, 3) : data);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

test();
