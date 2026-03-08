
require("dotenv").config();
const mongoose = require("mongoose");
const sdk      = require("microsoft-cognitiveservices-speech-sdk");
const fs       = require("fs");
const path     = require("path");
const os       = require("os");
const { v4: uuidv4 } = require("uuid");
const BaselineTest   = require("../models/BaselineTest");

const MONGO_URI = process.env.MONGODB_URI;

// ─────────────────────────────────────────────
// TTS helper — same as before, run at seed time
// ─────────────────────────────────────────────
async function synthesizeAudio(text, voice = "en-GB-RyanNeural") {
  const key    = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    console.warn("⚠️  AZURE_SPEECH_KEY or AZURE_SPEECH_REGION not set — skipping audio generation.");
    return null;
  }

  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisVoiceName = voice;

  const tmpFile     = path.join(os.tmpdir(), `seed_audio_${uuidv4()}.wav`);
  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(tmpFile);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  await new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      (result) => { synthesizer.close(); resolve(result); },
      (err)    => { synthesizer.close(); reject(err); }
    );
  });

  const buffer = fs.readFileSync(tmpFile);
  fs.unlinkSync(tmpFile);

  const base64 = `data:audio/wav;base64,${buffer.toString("base64")}`;
  console.log(`   Audio generated: ${Math.round(buffer.length / 1024)} KB`);
  return base64;
}

// ─────────────────────────────────────────────
// PASSAGE TEXT — used for TTS
// ─────────────────────────────────────────────
const LISTENING_PASSAGE = `
Good morning, City Library. How can I help you?

Hi, yes. I'd like to find out about getting a library membership, please.

Of course. We have two types of membership. The standard membership is free and gives you access to borrow up to five books at a time. The premium membership costs twelve pounds per year and lets you borrow up to fifteen items, including DVDs and audiobooks.

That sounds good. What do I need to apply?

You'll need a proof of address, something like a utility bill or a bank statement dated within the last three months. You'll also need a form of photo ID — a passport or driving licence is fine.

And how long does it take to process?

For standard membership, you can register online and get your card the same day. For premium, we post the card to your address within five working days.

Actually, can I ask — do you have any study rooms available?

Yes, we have four study rooms. They seat between two and six people. You can book them online up to two weeks in advance. There's no charge for standard members for rooms seating two people, but larger rooms cost three pounds per hour.

Great. One more thing — what are your opening hours on Sundays?

On Sundays we open at eleven in the morning and close at four in the afternoon.

Perfect, thank you so much.

You're welcome. Have a great day!
`.trim();

// ─────────────────────────────────────────────
// THE PREDEFINED TEST
// ─────────────────────────────────────────────
async function buildTestData(audioBase64) {
  return {
    version:  1,
    isActive: true,

    listening: {
      title:        "Library Membership Enquiry",
      topic:        "everyday social",
      passageText:  LISTENING_PASSAGE,
      audioBase64:  audioBase64,           // stored permanently in DB
      audioDuration: 90,
      timeLimit:    4 * 60,
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
      title:     "The Science of Sleep",
      timeLimit: 6 * 60,
      passage: `Sleep is a fundamental biological process that remains one of science's most intriguing mysteries. Despite spending roughly a third of our lives asleep, researchers are still uncovering why we need it and what precisely happens during those hours of unconsciousness.

Scientists have identified two main types of sleep: REM (Rapid Eye Movement) sleep and non-REM sleep. Non-REM sleep is further divided into three stages, ranging from light sleep to deep sleep. During deep non-REM sleep, the body repairs tissues, builds bone and muscle, and strengthens the immune system. REM sleep, which typically begins about 90 minutes after falling asleep, is associated with dreaming and plays a critical role in emotional regulation and memory consolidation.

Adults generally require between seven and nine hours of sleep per night, although this varies by individual. Adolescents need more — typically eight to ten hours — because their brains are still developing. Chronic sleep deprivation has been linked to a wide range of health problems including obesity, diabetes, cardiovascular disease, and weakened immune function. Cognitively, insufficient sleep impairs concentration, decision-making, and the ability to form new memories.

The circadian rhythm, often called the body's internal clock, regulates the sleep-wake cycle. This roughly 24-hour cycle is influenced primarily by light exposure. When light enters the eye, it signals the brain's suprachiasmatic nucleus to suppress the production of melatonin, a hormone that promotes sleep. As darkness falls, melatonin levels rise, triggering sleepiness.

Modern lifestyles increasingly disrupt natural sleep patterns. Artificial lighting, particularly the blue light emitted by smartphones and computers, can delay melatonin production and shift the circadian rhythm. Sleep researchers recommend avoiding screens for at least one hour before bed and maintaining consistent sleep and wake times, even on weekends, as key strategies for improving sleep quality.`,
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
      timeLimit: 7 * 60,
      prompt:   `The chart below shows the percentage of people in three age groups who used social media daily in 2023.

Age 18–24: 89%
Age 35–44: 67%
Age 55–64: 41%

Write a short paragraph (80–120 words) summarising the main features of the data and making comparisons where relevant.`,
      minWords: 80,
      maxWords: 120,
    },

    speaking: {
      title:     "Speaking Assessment",
      timeLimit: 5 * 60,
      prompts: [
        {
          promptNumber: 1,
          type:         "part1",
          title:        "Personal Questions",
          question:     "Tell me about your hometown. What do you like most about living there? Has it changed much in recent years?",
          prepTime:     0,
          responseTime: 60,
          guidance:     "Speak naturally for about 1 minute.",
        },
        {
          promptNumber: 2,
          type:         "part2",
          title:        "Describe a Person",
          question:     "Describe a person you admire. You should say: who this person is, how you know them, what they have achieved, and explain why you admire them.",
          prepTime:     30,
          responseTime: 90,
          guidance:     "Use your 30 seconds to prepare notes. Then speak for up to 1.5 minutes.",
        },
      ],
    },
  };
}

// ─────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  console.log("🎙  Generating listening audio via Azure TTS...");
  const audioBase64 = await synthesizeAudio(LISTENING_PASSAGE, "en-GB-RyanNeural");

  if (!audioBase64) {
    console.log("⚠️  Seeding without audio (Azure keys missing). You can re-run after adding keys.");
  }

  await BaselineTest.deleteMany({});
  console.log("🗑  Cleared existing baseline tests");

  const testData = await buildTestData(audioBase64);
  const test     = await BaselineTest.create(testData);

  console.log(`\n✅ Baseline test seeded successfully`);
  console.log(`   ID:        ${test._id}`);
  console.log(`   Audio:     ${audioBase64 ? "✓ stored in DB" : "✗ not generated"}`);
  console.log(`   Listening: ${test.listening.questions.length} questions`);
  console.log(`   Reading:   ${test.reading.questions.length} questions`);
  console.log(`   Writing:   1 task`);
  console.log(`   Speaking:  ${test.speaking.prompts.length} prompts`);
  console.log(`\n   Run this script again only if you want to reset the test.`);

  await mongoose.disconnect();
  console.log("Done.\n");
}

seed().catch((err) => { console.error(err); process.exit(1); });