require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDINGS_PATH = path.join(__dirname, "../data/embeddings.json");
const COST_LOG_PATH = path.join(__dirname, "../data/costLog.json");

const PRICES = {
  "text-embedding-3-small": { input: 0.02 / 1_000_000 },
  "gpt-4o-mini": { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
};
const COST_ALERT_THRESHOLD = 3.0; // $3

function loadCostLog() {
  if (!fs.existsSync(COST_LOG_PATH)) {
    return { totalCost: 0, alertSent: false, history: [] };
  }
  return JSON.parse(fs.readFileSync(COST_LOG_PATH, "utf-8"));
}

function saveCostLog(log) {
  fs.writeFileSync(COST_LOG_PATH, JSON.stringify(log, null, 2));
}

async function trackCost(model, inputTokens, outputTokens = 0) {
  const log = loadCostLog();
  const price = PRICES[model];
  const cost = price.input * inputTokens + (price.output || 0) * outputTokens;
  log.totalCost += cost;
  log.history.push({
    model,
    inputTokens,
    outputTokens,
    cost,
    timestamp: new Date().toISOString(),
  });
  saveCostLog(log);

 
  if (log.totalCost >= COST_ALERT_THRESHOLD && !log.alertSent) {
    await sendCostAlert(log.totalCost);
    log.alertSent = true;
    saveCostLog(log);
  }

  return cost;
}

async function sendCostAlert(totalCost) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ALERT_EMAIL_FROM,
        pass: process.env.ALERT_EMAIL_PASSWORD, 
      },
    });

    await transporter.sendMail({
      from: process.env.ALERT_EMAIL_FROM,
      to: process.env.ALERT_EMAIL_TO,
      subject: "⚠️ BandItUp - OpenAI Cost Alert",
      html: `
        <h2>OpenAI API Cost Alert</h2>
        <p>Your BandItUp chatbot has exceeded the <strong>$${COST_ALERT_THRESHOLD}</strong> usage threshold.</p>
        <p>Current total cost: <strong>$${totalCost.toFixed(4)}</strong></p>
        <p>Please review your OpenAI usage at <a href="https://platform.openai.com/usage">platform.openai.com/usage</a></p>
        <p><small>This alert will only be sent once.</small></p>
      `,
    });
    console.log("Cost alert email sent.");
  } catch (err) {
    console.error("Failed to send cost alert email:", err.message);
  }
}


let embeddingsCache = null;

function loadEmbeddings() {
  if (embeddingsCache) return embeddingsCache;
  if (!fs.existsSync(EMBEDDINGS_PATH)) {
    throw new Error("Embeddings file not found. Run: node scripts/generateEmbeddings.js");
  }
  embeddingsCache = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, "utf-8"));
  console.log(`Loaded ${embeddingsCache.length} embeddings into memory.`);
  return embeddingsCache;
}

// ─── Cosine similarity ────────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}


function findTopMatches(queryEmbedding, topK = 3) {
  const embeddings = loadEmbeddings();
  const scored = embeddings.map((item) => ({
    question: item.question,
    answer: item.answer,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const chatHandler = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    if (wordCount(message) > 50) {
      return res.status(400).json({
        success: false,
        message: "Please keep your message under 50 words.",
      });
    }

    
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message,
    });
    await trackCost("text-embedding-3-small", embeddingResponse.usage.prompt_tokens);
    const queryEmbedding = embeddingResponse.data[0].embedding;

 
    const topMatches = findTopMatches(queryEmbedding, 3);
    const bestScore = topMatches[0].score;

    console.log(`Query: "${message}" | Best similarity: ${bestScore.toFixed(3)}`);

   

    if (bestScore >= 0.85) {
      console.log("→ Direct KB answer (no GPT)");
      return res.json({
        success: true,
        reply: topMatches[0].answer,
        source: "knowledge_base",
      });
    }

    
    const useContext = bestScore >= 0.55;
    let systemPrompt = `You are IELTS Buddy, a helpful assistant for IELTS exam preparation inside the BandItUp app. 
Be concise, accurate, and encouraging. 
IMPORTANT: Your response must be 80 words or fewer. Do not exceed this limit.`;

    if (useContext) {
      console.log("→ Hybrid: KB context + GPT");
      const contextBlock = topMatches
        .filter((m) => m.score >= 0.55)
        .map((m) => `Q: ${m.question}\nA: ${m.answer}`)
        .join("\n\n");
      systemPrompt += `\n\nUse this relevant knowledge to help answer:\n${contextBlock}`;
    } else {
      console.log("→ Pure GPT (no relevant KB match)");
    }

    // Build messages array with history (last 4 exchanges for context)
    const recentHistory = history.slice(-8); // 4 user + 4 assistant
    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory,
      { role: "user", content: message },
    ];

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 150, 
      temperature: 0.7,
    });

    const reply = gptResponse.choices[0].message.content.trim();
    await trackCost(
      "gpt-4o-mini",
      gptResponse.usage.prompt_tokens,
      gptResponse.usage.completion_tokens
    );

    return res.json({
      success: true,
      reply,
      source: useContext ? "hybrid" : "gpt",
    });

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
};

const getCostStats = (req, res) => {
  const log = loadCostLog();
  res.json({
    success: true,
    totalCost: parseFloat(log.totalCost.toFixed(6)),
    totalRequests: log.history.length,
    alertThreshold: COST_ALERT_THRESHOLD,
    alertSent: log.alertSent,
  });
};

module.exports = { chatHandler, getCostStats };