/**
 * BandItUp — Baseline Seed Script
 * Run ONCE: node seeds/seedBaseline.js
 * Generates MP3 audio via Azure TTS and stores everything in MongoDB.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const sdk      = require("microsoft-cognitiveservices-speech-sdk");
const fs       = require("fs");
const path     = require("path");
const os       = require("os");
const { v4: uuidv4 } = require("uuid");
const BaselineTest   = require("../models/BaselineTest");

// Supports both MONGO_URI and MONGODB_URI
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// ─── TTS: generates MP3, stores as base64 ─────────────────
async function generateAudioBase64(text) {
  const key    = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) {
    console.warn("⚠️  No Azure keys — seeding without audio.");
    return null;
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisVoiceName = "en-GB-RyanNeural";
  // MP3 = ~10x smaller than WAV
  speechConfig.speechSynthesisOutputFormat =
    sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

  const tmpFile     = path.join(os.tmpdir(), `baseline_${uuidv4()}.mp3`);
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(tmpFile);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  await new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (r) => { synthesizer.close(); resolve(r); },
      (e) => { synthesizer.close(); reject(e); }
    );
  });

  const buffer = fs.readFileSync(tmpFile);
  fs.unlinkSync(tmpFile);
  const kb = Math.round(buffer.length / 1024);
  console.log(`   ✓ Audio: ${kb} KB (MP3)`);
  return `data:audio/mpeg;base64,${buffer.toString("base64")}`;
}

// ─── Listening passage ────────────────────────────────────
const PASSAGE = `
Good morning, City Library. How can I help you?

Hi. I'd like to find out about getting a library membership, please.

Of course. We have two types. The standard membership is free and lets you borrow up to five books at a time. The premium membership costs twelve pounds per year and lets you borrow up to fifteen items, including DVDs and audiobooks.

What do I need to apply?

You'll need proof of address dated within the last three months — a utility bill or bank statement. You'll also need photo ID, such as a passport or driving licence.

How long does it take to process?

Standard membership is online — you get your card the same day. For premium, we post the card within five working days.

Do you have study rooms?

Yes, four rooms seating between two and six people. You can book online up to two weeks in advance. Standard members use two-person rooms free of charge, but larger rooms cost three pounds per hour.

What are your Sunday opening hours?

We open at eleven in the morning and close at four in the afternoon on Sundays.

Perfect, thank you.

You're welcome. Have a great day!
`.trim();

// ─── Seed ─────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

  console.log("🎙  Generating audio...");
  const audioBase64 = await generateAudioBase64(PASSAGE);

  await BaselineTest.deleteMany({});
  console.log("🗑  Cleared old tests");

  await BaselineTest.create({
    version:  1,
    isActive: true,

    listening: {
      title:       "Library Membership Enquiry",
      audioBase64: audioBase64,
      timeLimit:   4 * 60,  // 4 minutes
      questions: [
        {
          questionNumber: 1,
          type:           "multiple_choice",
          prompt:         "How much does a premium membership cost per year?",
          options:        ["A. £8", "B. £10", "C. £12", "D. £15"],
          correctAnswer:  "C. £12",
        },
        {
          questionNumber:  2,
          type:            "form_completion",
          prompt:          "Proof of address must be dated within the last ___ months.",
          options:         [],
          correctAnswer:   "3",
          acceptedAnswers: ["3", "three"],
        },
        {
          questionNumber: 3,
          type:           "multiple_choice",
          prompt:         "How long does premium card delivery take?",
          options:        ["A. Same day", "B. Two working days", "C. Five working days", "D. One week"],
          correctAnswer:  "C. Five working days",
        },
        {
          questionNumber:  4,
          type:            "form_completion",
          prompt:          "Larger study rooms cost ___ pounds per hour.",
          options:         [],
          correctAnswer:   "3",
          acceptedAnswers: ["3", "three"],
        },
        {
          questionNumber: 5,
          type:           "multiple_choice",
          prompt:         "What time does the library close on Sundays?",
          options:        ["A. 3:00 PM", "B. 4:00 PM", "C. 5:00 PM", "D. 6:00 PM"],
          correctAnswer:  "B. 4:00 PM",
        },
      ],
    },

    reading: {
      title:    "The Science of Sleep",
      timeLimit: 6 * 60,
      passage: `Sleep is a fundamental biological process that remains one of science's most intriguing mysteries. Despite spending roughly a third of our lives asleep, researchers are still uncovering why we need it and what precisely happens during those hours of unconsciousness.

Scientists have identified two main types of sleep: REM (Rapid Eye Movement) sleep and non-REM sleep. Non-REM sleep is further divided into three stages, from light sleep to deep sleep. During deep non-REM sleep, the body repairs tissues, builds bone and muscle, and strengthens the immune system. REM sleep, which typically begins about 90 minutes after falling asleep, is associated with dreaming and plays a critical role in emotional regulation and memory consolidation.

Adults generally require between seven and nine hours of sleep per night. Adolescents need more — typically eight to ten hours — because their brains are still developing. Chronic sleep deprivation has been linked to obesity, diabetes, cardiovascular disease, and weakened immune function. Cognitively, insufficient sleep impairs concentration, decision-making, and the ability to form new memories.

The circadian rhythm, often called the body's internal clock, regulates the sleep-wake cycle on a roughly 24-hour basis. It is influenced primarily by light. When light enters the eye, it signals the brain to suppress melatonin, a hormone that promotes sleep. As darkness falls, melatonin rises, triggering sleepiness.

Modern lifestyles increasingly disrupt natural sleep patterns. The blue light emitted by smartphones and computers can delay melatonin production. Sleep researchers recommend avoiding screens for at least one hour before bed and maintaining consistent sleep and wake times, even on weekends.`,
      questions: [
        {
          questionNumber: 1,
          type:           "multiple_choice",
          prompt:         "What happens during deep non-REM sleep?",
          options:        ["A. Dreaming occurs", "B. Melatonin is suppressed", "C. The body repairs tissues and muscles", "D. The circadian rhythm resets"],
          correctAnswer:  "C. The body repairs tissues and muscles",
        },
        {
          questionNumber: 2,
          type:           "multiple_choice",
          prompt:         "When does REM sleep typically begin after falling asleep?",
          options:        ["A. After 30 minutes", "B. After 60 minutes", "C. After 90 minutes", "D. After 120 minutes"],
          correctAnswer:  "C. After 90 minutes",
        },
        {
          questionNumber: 3,
          type:           "true_false_ng",
          prompt:         "Adolescents need less sleep than adults because they are more physically active.",
          options:        ["A. True", "B. False", "C. Not Given"],
          correctAnswer:  "B. False",
        },
        {
          questionNumber:  4,
          type:            "form_completion",
          prompt:          "The body's internal clock operates on a roughly ___-hour cycle.",
          options:         [],
          correctAnswer:   "24",
          acceptedAnswers: ["24", "twenty-four", "twenty four"],
        },
        {
          questionNumber: 5,
          type:           "multiple_choice",
          prompt:         "What do sleep researchers recommend to improve sleep quality?",
          options:        ["A. Using blue light filters", "B. Sleeping longer on weekends", "C. Avoiding screens for at least one hour before bed", "D. Taking melatonin supplements daily"],
          correctAnswer:  "C. Avoiding screens for at least one hour before bed",
        },
      ],
    },

    writing: {
      title:    "Writing Task",
      timeLimit: 20 * 60,  // 20 minutes
      minWords: 120,
      maxWords: 150,
      prompt: `Some people think that the best way to improve public health is by increasing the number of sports facilities. Others, however, believe that this would have little effect on public health and that other measures are required.

Discuss both views and give your own opinion. Write at least 120 words.`,
    },

    speaking: {
      title:        "Speaking Assessment",
      question:     "Describe a place you enjoy visiting in your free time. You should say: where it is, how often you go there, what you do there, and explain why you enjoy visiting this place.",
      responseTime: 30,   // 30 seconds to record
      timeLimit:    60,
    },
  });

  console.log("✅ Baseline test seeded successfully");
  console.log(`   Audio: ${audioBase64 ? "✓ stored" : "✗ missing (add Azure keys and re-run)"}`);
  await mongoose.disconnect();
  console.log("Done.\n");
}

seed().catch((err) => { console.error(err); process.exit(1); });