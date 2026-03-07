

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const KB_PATH = path.join(__dirname, "../data/knowledgeBase.json");
const OUT_PATH = path.join(__dirname, "../data/embeddings.json");

async function generateEmbeddings() {
  const knowledgeBase = JSON.parse(fs.readFileSync(KB_PATH, "utf-8"));
  console.log(`Generating embeddings for ${knowledgeBase.length} Q&A pairs...`);

  const results = [];

  for (let i = 0; i < knowledgeBase.length; i++) {
    const item = knowledgeBase[i];
    
    const text = `${item.question} ${item.answer}`;

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    results.push({
      question: item.question,
      answer: item.answer,
      embedding: response.data[0].embedding,
    });

    if ((i + 1) % 50 === 0) {
      console.log(`Progress: ${i + 1}/${knowledgeBase.length}`);
    }

   
    await new Promise((r) => setTimeout(r, 50));
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(`✅ Done! Embeddings saved to ${OUT_PATH}`);
  console.log(`Total pairs embedded: ${results.length}`);
  console.log(`Estimated cost: $${((results.length * 0.00000002) * 1).toFixed(8)} (essentially free)`);
}

generateEmbeddings().catch(console.error);