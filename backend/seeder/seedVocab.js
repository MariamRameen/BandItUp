
require("dotenv").config(); 
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Word = require("../models/Word");

const VOCAB_FILE = path.join(__dirname, "../data/vocab.json");

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");

    // Load JSON
    if (!fs.existsSync(VOCAB_FILE)) {
      console.error(`❌  File not found: ${VOCAB_FILE}`);
      console.error("    Create backend/data/vocab.json with your word array.");
      process.exit(1);
    }

    const raw = fs.readFileSync(VOCAB_FILE, "utf-8");
    const words = JSON.parse(raw);

    if (!Array.isArray(words) || words.length === 0) {
      console.error("❌  vocab.json must be a non-empty array.");
      process.exit(1);
    }

    // Validate band levels
    const validBands = [6, 7, 8, 9];
    const invalid = words.filter((w) => !validBands.includes(w.bandLevel));
    if (invalid.length > 0) {
      console.warn(`⚠️   ${invalid.length} words have invalid bandLevel (must be 6/7/8/9). They will be skipped.`);
    }

    const validWords = words.filter((w) => validBands.includes(w.bandLevel));

    console.log(`\nSeeding ${validWords.length} words...`);

    // Upsert (update if exists, insert if new) — safe to run multiple times
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const wordData of validWords) {
      try {
        const result = await Word.findOneAndUpdate(
          { word: wordData.word.toLowerCase().trim() },
          {
            word: wordData.word.trim(),
            bandLevel: wordData.bandLevel,
            topics: wordData.topics || [],
            meaning: wordData.meaning,
            exampleSentence: wordData.exampleSentence,
            collocations: wordData.collocations || [],
            cefrLevel: wordData.cefrLevel || "",
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (result.createdAt?.getTime() === result.updatedAt?.getTime()) {
          inserted++;
        } else {
          updated++;
        }
      } catch (e) {
        errors++;
        console.error(`  Error on word "${wordData.word}": ${e.message}`);
      }
    }

    // Print band summary
    const bandCounts = await Word.aggregate([
      { $group: { _id: "$bandLevel", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    console.log("\n✅  Seeding complete!");
    console.log(`   Inserted: ${inserted} | Updated: ${updated} | Errors: ${errors}`);
    console.log("\nWords in DB by band:");
    bandCounts.forEach((b) => console.log(`   Band ${b._id}: ${b.count} words`));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeder failed:", err);
    process.exit(1);
  }
}

seed();