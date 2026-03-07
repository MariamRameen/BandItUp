const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, unique: true, trim: true },
    bandLevel: { type: Number, required: true, enum: [6, 7, 8, 9] },
    topics: [{ type: String }],
    meaning: { type: String, required: true },
    exampleSentence: { type: String, required: true },
    collocations: [{ type: String }],
    cefrLevel: { type: String },
  },
  { timestamps: true }
);

wordSchema.index({ bandLevel: 1 });
wordSchema.index({ topics: 1 });

module.exports = mongoose.model("Word", wordSchema);