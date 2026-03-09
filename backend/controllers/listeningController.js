const ListeningSession = require("../models/ListeningSession");
const ListeningProgress = require("../models/ListeningProgress");
const { autoCompleteTaskBySkill } = require("./studyPlannerController");
const OpenAI = require("openai");
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const os = require("os");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AZURE_KEY    = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_SPEECH_REGION;

// ─────────────────────────────────────────────
// IELTS band conversion table (scaled 0–40)
// ─────────────────────────────────────────────
function scaledScoreToBand(scaled) {
  if (scaled >= 39) return 9.0;
  if (scaled >= 37) return 8.5;
  if (scaled >= 35) return 8.0;
  if (scaled >= 33) return 7.5;
  if (scaled >= 30) return 7.0;
  if (scaled >= 27) return 6.5;
  if (scaled >= 23) return 6.0;
  if (scaled >= 20) return 5.5;
  if (scaled >= 16) return 5.0;
  if (scaled >= 13) return 4.5;
  if (scaled >= 10) return 4.0;
  return 3.5;
}

// ─────────────────────────────────────────────
// Skill label from overall band
// ─────────────────────────────────────────────
function bandToSkillLabel(band) {
  if (band >= 8.0) return "Advanced";
  if (band >= 7.0) return "Upper-Intermediate";
  if (band >= 6.0) return "Intermediate";
  if (band >= 5.0) return "Elementary";
  return "Beginner";
}

// ─────────────────────────────────────────────
// Adaptive difficulty — rolling window of 5
// UP:   rolling avg score >= 0.80 AND all 5 slots filled
// DOWN: rolling avg score < 0.40
// Prevents false boosts — needs full 5-session window to go up
// ─────────────────────────────────────────────
const DIFFICULTY_LEVELS = ["easy", "medium", "hard", "advanced"];

function computeNewDifficulty(partState, newScoreRatio) {
  const window = [...(partState.rollingWindow || [])];

  // Add new session to window, cap at 5
  window.push({ score: newScoreRatio });
  if (window.length > 5) window.shift();

  const avg = window.reduce((s, e) => s + e.score, 0) / window.length;
  const current = partState.currentDifficulty || "easy";
  const idx = DIFFICULTY_LEVELS.indexOf(current);

  let next = current;
  if (window.length === 5 && avg >= 0.80 && idx < DIFFICULTY_LEVELS.length - 1) {
    next = DIFFICULTY_LEVELS[idx + 1];
  } else if (avg < 0.40 && idx > 0) {
    next = DIFFICULTY_LEVELS[idx - 1];
  }

  return { next, window, avg };
}

// ─────────────────────────────────────────────
// Time limit per session (seconds)
// Real IELTS: ~30 seconds per question to answer after hearing
// We add a 30s reading phase before audio + 30s per question after
// audioDuration is passed in from actual TTS estimated length
// ─────────────────────────────────────────────
function getTimeLimit(sessionType, audioDurationSeconds) {
  // Both practice and mock:
  // 30s reading + actual audio duration + 30s review buffer
  // No per-question multiplier — user answers WHILE listening (real IELTS)
  const readingPhase = 30;
  const reviewBuffer = 30;
  return readingPhase + audioDurationSeconds + reviewBuffer;
}

// ─────────────────────────────────────────────
// GPT: generate passage + questions
// ─────────────────────────────────────────────
async function generatePassageAndQuestions({ part, difficulty, accent, questionTypes, maxQuestions, weaknesses }) {
  const partDescriptions = {
    1: "a conversation between two people in an everyday social context (e.g. booking, enquiry, registration)",
    2: "a monologue in an everyday social context (e.g. a speech about local facilities, a tour guide)",
    3: "a conversation between up to four people in an educational or training context (e.g. university tutorial, seminar discussion)",
    4: "a monologue on an academic subject (e.g. a university lecture)",
  };

  const difficultyGuide = {
    easy:     "simple vocabulary, slow pace, clear structure, straightforward facts",
    medium:   "moderate vocabulary, some distractors, moderate pace",
    hard:     "academic vocabulary, distractors present, faster pace, complex sentences",
    advanced: "high academic vocabulary, strong distractors, complex information, dense content",
  };

  const accentNote = accent === "australian"
    ? "Write in a natural Australian English style (use Australian spellings and expressions where appropriate)."
    : "Write in a natural American English style.";

  const weaknessNote = weaknesses && weaknesses.length > 0
    ? `User's known weak areas: ${weaknesses.map(w => w.label).join(", ")}. Include content that gently challenges these.`
    : "";

  const qtypes = questionTypes.join(", ");

  const systemPrompt = `You are an expert IELTS listening test creator. Generate realistic, authentic IELTS-style content strictly following the format requested. Return ONLY valid JSON, no markdown, no extra text.`;

  const userPrompt = `Generate an IELTS Listening Part ${part} exercise.

Context: ${partDescriptions[part]}
Difficulty: ${difficulty} — ${difficultyGuide[difficulty]}
Accent style: ${accentNote}
Question types to include: ${qtypes}
Number of questions: ${maxQuestions}
${weaknessNote}

PASSAGE LENGTH: Write EXACTLY 180 words for passageText — not 179, not 181, exactly 180.
Count every word carefully before returning.
At 130 words/minute TTS this gives exactly ~83 seconds of audio — consistent every session.
Each of the ${maxQuestions} questions maps to roughly ${Math.round(83/maxQuestions)} seconds of audio.
The passage must contain clear, inferable answers to ALL ${maxQuestions} questions spread evenly.

Rules:
- Passage must be a realistic spoken transcript (include natural speech markers like "uh", "right", "so" where appropriate for parts 1-3)
- Part 4 should be more formal lecture style
- Answers must be clearly inferable from the passage — no ambiguity
- For form_completion: include a realistic form context (name, date, address, reference number etc)
- For multiple_choice: include 4 options with realistic distractors
- For matching: provide 4-5 items to match against 4-5 descriptions
- Do NOT include any map or diagram labelling questions
- You MUST generate EXACTLY ${maxQuestions} questions — no more, no less
- Distribute question types evenly across the ${maxQuestions} questions

Return this exact JSON structure with EXACTLY ${maxQuestions} questions in the array:
{
  "passageTitle": "short descriptive title",
  "topic": "main topic in 2-3 words",
  "passageText": "full spoken transcript here — exactly 180 words",
  "passageWordCount": 180,
  "estimatedDurationSeconds": 83,
  "questions": [
    {
      "questionNumber": 1,
      "type": "multiple_choice",
      "prompt": "question text",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "correctAnswer": "A. option1"
    },
    {
      "questionNumber": 2,
      "type": "form_completion",
      "prompt": "Complete the form: Customer surname: ______",
      "options": [],
      "correctAnswer": "exact answer from passage"
    },
    {
      "questionNumber": 3,
      "type": "matching",
      "prompt": "Match each speaker to their opinion",
      "matchingPairs": [
        { "label": "Speaker 1", "options": ["agrees with proposal", "disagrees with timeline", "is undecided", "supports budget"] },
        { "label": "Speaker 2", "options": ["agrees with proposal", "disagrees with timeline", "is undecided", "supports budget"] }
      ],
      "correctAnswer": { "Speaker 1": "agrees with proposal", "Speaker 2": "disagrees with timeline" }
    },
    {
      "questionNumber": 4,
      "type": "multiple_choice",
      "prompt": "another question from the passage",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "correctAnswer": "A. option1"
    },
    {
      "questionNumber": 5,
      "type": "form_completion",
      "prompt": "Complete the form: Reference number: ______",
      "options": [],
      "correctAnswer": "exact answer from passage"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 2000,
    temperature: 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices[0].message.content.trim();
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─────────────────────────────────────────────
// GPT: generate feedback
// ─────────────────────────────────────────────
async function generateFeedback({ passageText, questions, userAnswers, part, difficulty, bandEstimate }) {
  const answeredSummary = questions.map((q, i) => ({
    questionNumber: q.questionNumber,
    type: q.type,
    correct: q.isCorrect,
    userAnswer: userAnswers[i] || "(no answer)",
    correctAnswer: q.correctAnswer,
  }));

  const prompt = `You are an IELTS examiner evaluating a student's listening performance.

Part: ${part} | Difficulty: ${difficulty} | Band estimate: ${bandEstimate}

Questions summary:
${JSON.stringify(answeredSummary, null, 2)}

Based on the errors made, identify:
1. Strengths (what they did well)
2. Weak question types (e.g. "struggling with matching questions")
3. Listening skill issues (choose from: number_recognition, distractor_confusion, academic_vocabulary, fast_speech_processing, proper_noun_spelling, inference_difficulty, form_completion_accuracy)
4. Specific improvement tips (practical, actionable, max 2 tips)

Return ONLY valid JSON:
{
  "strengths": ["..."],
  "weakQuestionTypes": ["..."],
  "listeningIssues": ["number_recognition", "distractor_confusion"],
  "improvementTips": ["...", "..."],
  "summary": "one sentence motivational summary"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 600,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.choices[0].message.content.trim();
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Azure TTS — synthesize audio, return base64 data URL
// No storage bucket needed — audio served directly from DB
// ─────────────────────────────────────────────
async function synthesizeAudio(text, accent) {
  // Check for Azure credentials
  if (!AZURE_KEY || !AZURE_REGION) {
    throw new Error("Azure Speech credentials not configured");
  }
  
  // Azure voice names for each accent
  const voiceMap = {
    american:   "en-US-BrianNeural",    // Natural American male
    australian: "en-AU-WilliamNeural",  // Natural Australian male
    british:    "en-GB-RyanNeural",     // Natural British male
    British:    "en-GB-RyanNeural",     // Handle capitalized version
  };
  const voiceName = voiceMap[accent] || voiceMap.american;

  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

    // Write to a temp file
    const tmpFile = path.join(os.tmpdir(), `${uuidv4()}.mp3`);
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(tmpFile);
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
      text,
      (result) => {
        synthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          // Read file and convert to base64 data URL
          const audioBuffer = fs.readFileSync(tmpFile);
          fs.unlinkSync(tmpFile); // clean up temp file
          const base64 = audioBuffer.toString("base64");
          resolve(`data:audio/mp3;base64,${base64}`);
        } else {
          fs.existsSync(tmpFile) && fs.unlinkSync(tmpFile);
          reject(new Error(`Azure TTS failed: ${result.errorDetails}`));
        }
      },
      (err) => {
        synthesizer.close();
        fs.existsSync(tmpFile) && fs.unlinkSync(tmpFile);
        reject(new Error(`Azure TTS error: ${err}`));
      }
    );
  });
}

// ─────────────────────────────────────────────
// Ensure progress document exists for user
// ─────────────────────────────────────────────
async function ensureProgress(userId) {
  let progress = await ListeningProgress.findOne({ userId });
  if (!progress) {
    progress = new ListeningProgress({
      userId,
      partStates: [1, 2, 3, 4].map((p) => ({
        part: p,
        currentDifficulty: "easy",
        totalSessions: 0,
        rollingWindow: [],
        avgScore: 0,
        avgBand: 0,
      })),
      weaknesses: [],
    });
    await progress.save();
  }
  return progress;
}

// ─────────────────────────────────────────────
// Update weakness profile
// ─────────────────────────────────────────────
function updateWeaknesses(existingWeaknesses, newIssues) {
  const WEAKNESS_LABELS = {
    number_recognition:       "Number Recognition",
    distractor_confusion:     "Distractor Confusion",
    academic_vocabulary:      "Academic Vocabulary",
    fast_speech_processing:   "Fast Speech Processing",
    proper_noun_spelling:     "Proper Noun Spelling",
    inference_difficulty:     "Inference Difficulty",
    form_completion_accuracy: "Form Completion Accuracy",
  };

  const updated = [...existingWeaknesses];
  (newIssues || []).forEach((issue) => {
    const idx = updated.findIndex((w) => w.type === issue);
    if (idx >= 0) {
      updated[idx].hitCount += 1;
      updated[idx].lastSeenAt = new Date();
    } else {
      updated.push({
        type: issue,
        label: WEAKNESS_LABELS[issue] || issue,
        hitCount: 1,
        lastSeenAt: new Date(),
      });
    }
  });

  // Sort by hitCount desc, keep top 10
  return updated.sort((a, b) => b.hitCount - a.hitCount).slice(0, 10);
}

// ─────────────────────────────────────────────
// POST /api/listening/generate
// Body: { part, accent, sessionType? }
// ─────────────────────────────────────────────
exports.generateSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { part, accent, sessionType = "practice" } = req.body;

    if (!part || !accent) {
      return res.status(400).json({ success: false, message: "part and accent are required" });
    }

    const progress = await ensureProgress(userId);

    // Set first practice timestamp
    if (!progress.firstPracticeAt) {
      progress.firstPracticeAt = new Date();
      progress.nextMockDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Get part state
    const partState = progress.partStates.find((p) => p.part === parseInt(part));
    const difficulty = sessionType === "mock"
      ? (partState?.currentDifficulty || "medium")
      : (partState?.currentDifficulty || "easy");

    // Question count
    const maxQuestions = sessionType === "mock" ? 2 : 5;

    // Question types to use
    const allTypes = ["multiple_choice", "form_completion", "matching"];
    // Rotate through types, bias toward weak types for mock
    let questionTypes = allTypes;
    if (sessionType === "mock" && progress.weaknesses.length > 0) {
      // Map weakness types to question types
      const weakQTypes = progress.weaknesses
        .filter(w => ["form_completion_accuracy"].includes(w.type))
        .map(() => "form_completion");
      questionTypes = [...new Set([...weakQTypes, ...allTypes])].slice(0, 3);
    }

    // Generate passage and questions via GPT
    const generated = await generatePassageAndQuestions({
      part: parseInt(part),
      difficulty,
      accent,
      questionTypes,
      maxQuestions,
      weaknesses: progress.weaknesses.slice(0, 3),
    });

    // Synthesize audio via Google Cloud TTS
    let audioUrl = null;
    try {
      audioUrl = await synthesizeAudio(generated.passageText, accent);
    } catch (ttsErr) {
      console.error("TTS error (non-fatal):", ttsErr.message);
      // Continue without audio — frontend handles gracefully
    }

    const estimatedAudioDuration = generated.estimatedDurationSeconds || 80;
    const timeLimit = getTimeLimit(sessionType, estimatedAudioDuration);

    // Create session document — audioUrl NOT stored to save MongoDB space
    const session = new ListeningSession({
      userId,
      sessionType,
      part: parseInt(part),
      accent,
      difficulty,
      passageText:  generated.passageText,
      passageTitle: generated.passageTitle,
      topic:        generated.topic,
      questions:    generated.questions,
      audioUrl:     null,
      audioDuration: estimatedAudioDuration,
      maxReplays: sessionType === "mock" ? 0 : 1,
      timeLimitSeconds: timeLimit,
      totalQuestions: generated.questions.length,
    });

    await session.save();

    // Update progress
    progress.totalSessions += 1;
    await progress.save();

    res.json({
      success: true,
      sessionId: session._id,
      part: session.part,
      accent: session.accent,
      difficulty: session.difficulty,
      sessionType: session.sessionType,
      passageTitle: session.passageTitle,
      topic: session.topic,
      passageText: session.passageText,
      audioUrl,              // sent to frontend only, NOT stored in DB
      audioDuration: session.audioDuration,
      maxReplays: session.maxReplays,
      timeLimitSeconds: session.timeLimitSeconds,
      totalQuestions: session.totalQuestions,
      questions: session.questions.map((q) => ({
        questionNumber: q.questionNumber,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        matchingPairs: q.matchingPairs,
      })),
    });
  } catch (err) {
    console.error("generateSession:", err);
    res.status(500).json({ success: false, message: "Failed to generate session", error: err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/listening/submit/:sessionId
// Body: { answers: [{questionNumber, userAnswer}], timeUsed, autoSubmitted }
// ─────────────────────────────────────────────
exports.submitSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.params;
    const { answers, timeUsed = 0, autoSubmitted = false } = req.body;

    const session = await ListeningSession.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    if (session.completed) return res.json({ success: true, message: "Already submitted", alreadySubmitted: true });

    // Grade answers
    let correctCount = 0;
    session.questions.forEach((q) => {
      const submitted = answers.find((a) => a.questionNumber === q.questionNumber);
      const userAnswer = submitted?.userAnswer ?? null;
      q.userAnswer = userAnswer;

      // Matching: compare object keys
      if (q.type === "matching" && typeof q.correctAnswer === "object") {
        const correct = JSON.stringify(q.correctAnswer) === JSON.stringify(userAnswer);
        q.isCorrect = correct;
      } else {
        const correct = userAnswer !== null &&
          String(userAnswer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        q.isCorrect = correct;
      }

      if (q.isCorrect) correctCount++;
    });

    const scoreRatio = session.totalQuestions > 0 ? correctCount / session.totalQuestions : 0;
    const scaledScore = parseFloat((scoreRatio * 40).toFixed(1));
    const bandEstimate = scaledScoreToBand(scaledScore);

    session.correctCount   = correctCount;
    session.scaledScore    = scaledScore;
    session.bandEstimate   = bandEstimate;
    session.timeUsedSeconds = timeUsed;
    session.autoSubmitted  = autoSubmitted;
    session.completed      = true;
    session.submittedAt    = new Date();

    // Generate feedback
    try {
      const feedbackData = await generateFeedback({
        passageText: session.passageText,
        questions: session.questions,
        userAnswers: answers.map(a => a.userAnswer),
        part: session.part,
        difficulty: session.difficulty,
        bandEstimate,
      });
      session.feedback = {
        strengths:         feedbackData.strengths || [],
        weakQuestionTypes: feedbackData.weakQuestionTypes || [],
        listeningIssues:   feedbackData.listeningIssues || [],
        improvementTips:   feedbackData.improvementTips || [],
        rawText:           feedbackData.summary || "",
      };
    } catch (fbErr) {
      console.error("Feedback generation error (non-fatal):", fbErr.message);
    }

    await session.save();

    // Update progress
    const progress = await ensureProgress(userId);
    const partState = progress.partStates.find((p) => p.part === session.part);

    if (partState) {
      const { next, window: newWindow, avg } = computeNewDifficulty(partState, scoreRatio);
      partState.currentDifficulty = next;
      partState.rollingWindow = newWindow;
      partState.avgScore = parseFloat(avg.toFixed(3));
      partState.totalSessions += 1;

      // Update avg band for this part
      const prevAvg = partState.avgBand || 0;
      const count = partState.totalSessions;
      partState.avgBand = parseFloat(((prevAvg * (count - 1) + bandEstimate) / count).toFixed(2));
    }

    // Update weaknesses
    if (session.feedback?.listeningIssues?.length > 0) {
      progress.weaknesses = updateWeaknesses(progress.weaknesses, session.feedback.listeningIssues);
    }

    // Update overall band (avg of all part avg bands)
    const validParts = progress.partStates.filter((p) => p.totalSessions > 0);
    if (validParts.length > 0) {
      progress.overallBand = parseFloat(
        (validParts.reduce((s, p) => s + p.avgBand, 0) / validParts.length).toFixed(2)
      );
    }

    // Update overall accuracy
    const allSessions = await ListeningSession.find({ userId, completed: true });
    const totalQ = allSessions.reduce((s, se) => s + se.totalQuestions, 0);
    const totalC = allSessions.reduce((s, se) => s + se.correctCount, 0);
    progress.overallAccuracy = totalQ > 0 ? parseFloat(((totalC / totalQ) * 100).toFixed(1)) : 0;

    // Skill label
    progress.skillLabel = bandToSkillLabel(progress.overallBand);

    // Mock test tracking
    if (session.sessionType === "mock") {
      progress.totalMockTests += 1;
      progress.lastMockAt = new Date();
      progress.nextMockDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      progress.mockAvailable = false;
    } else {
      // Check if mock is due
      if (progress.nextMockDue && new Date() >= progress.nextMockDue) {
        progress.mockAvailable = true;
      }
    }

    // Track recent sessions (keep last 10)
    progress.recentSessions = [session._id, ...progress.recentSessions].slice(0, 10);

    await progress.save();

    // Auto-complete study plan task for listening
    await autoCompleteTaskBySkill(userId, "listening", session._id);

    res.json({
      success: true,
      sessionId: session._id,
      correctCount,
      totalQuestions: session.totalQuestions,
      scaledScore,
      bandEstimate,
      scoreRatio: parseFloat(scoreRatio.toFixed(2)),
      autoSubmitted,
      feedback: session.feedback,
      questions: session.questions, // now includes correctAnswer and userAnswer
      currentDifficulty: partState?.currentDifficulty,
      mockAvailable: progress.mockAvailable,
    });
  } catch (err) {
    console.error("submitSession:", err);
    res.status(500).json({ success: false, message: "Failed to submit session", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/listening/progress
// ─────────────────────────────────────────────
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user._id;
    const progress = await ensureProgress(userId);

    // Recent 10 sessions for chart
    const recentSessions = await ListeningSession.find({ userId, completed: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("part difficulty bandEstimate scaledScore correctCount totalQuestions sessionType createdAt");

    // Weekly trend: last 4 weeks
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const weeklyRaw = await ListeningSession.find({
      userId, completed: true, createdAt: { $gte: fourWeeksAgo }
    }).select("bandEstimate createdAt");

    const weeklyData = [0, 1, 2, 3].map((i) => {
      const start = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const end   = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
      const inWeek = weeklyRaw.filter((s) => s.createdAt >= start && s.createdAt < end);
      const avg = inWeek.length > 0
        ? parseFloat((inWeek.reduce((s, se) => s + se.bandEstimate, 0) / inWeek.length).toFixed(2))
        : null;
      return { week: `Week ${4 - i}`, avgBand: avg, sessions: inWeek.length };
    }).reverse();

    res.json({
      success: true,
      overallBand: progress.overallBand,
      overallAccuracy: progress.overallAccuracy,
      totalSessions: progress.totalSessions,
      totalMockTests: progress.totalMockTests,
      skillLabel: progress.skillLabel,
      partStates: progress.partStates,
      weaknesses: progress.weaknesses,
      mockAvailable: progress.mockAvailable,
      nextMockDue: progress.nextMockDue,
      recentSessions,
      weeklyData,
    });
  } catch (err) {
    console.error("getProgress:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/listening/session/:sessionId
// Fetch completed session results
// ─────────────────────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const session = await ListeningSession.findOne({ _id: req.params.sessionId, userId });
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/listening/mock/generate
// Generates a full mock test: 2 questions per part (parts 1-4)
// Each part gets its own session document
// ─────────────────────────────────────────────
exports.generateMockTest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { accent } = req.body;

    if (!accent) return res.status(400).json({ success: false, message: "accent is required" });

    const progress = await ensureProgress(userId);
    const mockId = uuidv4(); // group all 4 parts under one mock ID
    const sessionIds = [];

    for (const part of [1, 2, 3, 4]) {
      const partState = progress.partStates.find((p) => p.part === part);
      const difficulty = partState?.currentDifficulty || "medium";

      const generated = await generatePassageAndQuestions({
        part,
        difficulty,
        accent,
        questionTypes: ["multiple_choice", "form_completion", "matching"],
        maxQuestions: 2,
        weaknesses: progress.weaknesses.slice(0, 3),
      });

      let audioUrl = null;
      try {
        audioUrl = await synthesizeAudio(generated.passageText, accent);
      } catch (e) {
        console.error(`TTS error part ${part}:`, e.message);
      }

      const session = new ListeningSession({
        userId,
        sessionType: "mock",
        part,
        accent,
        difficulty,
        passageText:  generated.passageText,
        passageTitle: generated.passageTitle,
        topic:        generated.topic,
        questions:    generated.questions,
        audioUrl:     null,   // not stored in DB
        audioDuration: 120,
        maxReplays: 0,
        timeLimitSeconds: getTimeLimit(part, "mock", 2),
        totalQuestions: generated.questions.length,
      });

      await session.save();
      sessionIds.push({
        part,
        sessionId: session._id,
        // send audio + questions in response only
        audioUrl,
        passageTitle: generated.passageTitle,
        topic: generated.topic,
        passageText: generated.passageText,
        audioDuration: 120,
        maxReplays: 0,
        timeLimitSeconds: getTimeLimit(part, "mock", 2),
        totalQuestions: generated.questions.length,
        questions: generated.questions.map((q) => ({
          questionNumber: q.questionNumber,
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          matchingPairs: q.matchingPairs,
        })),
      });
    }

    res.json({
      success: true,
      mockId,
      accent,
      parts: sessionIds,
      message: "Mock test generated. Complete all 4 parts.",
    });
  } catch (err) {
    console.error("generateMockTest:", err);
    res.status(500).json({ success: false, message: "Failed to generate mock test", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/listening/history
// ─────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sessionType, part } = req.query;

    const filter = { userId, completed: true };
    if (sessionType) filter.sessionType = sessionType;
    if (part) filter.part = parseInt(part);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [sessions, total] = await Promise.all([
      ListeningSession.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("part accent difficulty sessionType bandEstimate scaledScore correctCount totalQuestions passageTitle topic autoSubmitted createdAt"),
      ListeningSession.countDocuments(filter),
    ]);

    res.json({
      success: true,
      sessions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};