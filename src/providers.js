import fetch from "node-fetch";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
//const HF_API_KEY = process.env.HF_API_KEY;

// --- GROQ PROVIDER ---
export async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error("Groq failed " + res.status);
  const data = await res.json();
  return data.choices[0].message.content;
}



  if (!res.ok) throw new Error("TogetherAI failed " + res.status);
  const data = await res.json();
  return data.choices[0].message.content;

