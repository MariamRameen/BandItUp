const mongoose = require("mongoose");

const SpeakingSessionSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  mode:      { type: String, enum: ["free", "ielts_part1", "ielts_part2", "ielts_part3"], required: true },
  prompt:    { type: String, required: true },
  transcript:{ type: String, default: "" },
  duration:  { type: Number, default: 30 }, // seconds recorded

  // GPT scores (all 1-9)
  fluencyCoherence:  { type: Number, default: 0 },
  lexicalResource:   { type: Number, default: 0 },
  grammaticalRange:  { type: Number, default: 0 },
  pronunciation:     { type: Number, default: 0 },
  band:              { type: Number, default: 0 },

  feedback:     { type: String, default: "" },
  strengths:    [String],
  improvements: [String],

 
  azureAccuracy:     { type: Number, default: 0 },
  azureFluency:      { type: Number, default: 0 },
  azureCompleteness: { type: Number, default: 0 },
  azureProsody:      { type: Number, default: 0 },

  userBandAtTime: { type: Number, default: 0 }, // user's avg band when session was taken
}, { timestamps: true });

module.exports = mongoose.model("SpeakingSession", SpeakingSessionSchema);