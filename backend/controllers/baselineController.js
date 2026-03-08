/**
 * BandItUp — Baseline Controller (v3)
 *
 * Key fixes:
 * 1. Listening audio served from DB (generated at seed time) — no runtime TTS
 * 2. Speaking audio uploaded as multipart/form-data files — no base64 in JSON
 * 3. All other answers sent as regular JSON fields in the same FormData
 * 4. Single generic loading screen on frontend while everything grades
 */

const OpenAI  = require("openai");
const sdk     = require("microsoft-cognitiveservices-speech-sdk");
const fs      = require("fs");
const path    = require("path");
const os      = require("os");
const { v4: uuidv4 }   = require("uuid");
const BaselineTest      = require("../models/BaselineTest");
const BaselineResult    = require("../models/BaselineResult");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────────────────
// AZURE PRONUNCIATION ASSESSMENT
// Accepts a Buffer of audio data
// ─────────────────────────────────────────────────────────
async function azurePronunciationAssessment(audioBuffer, referenceText) {
  const tmpFile = path.join(os.tmpdir(), `speaking_${uuidv4()}.wav`);
  fs.writeFileSync(tmpFile, audioBuffer);

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION
  );
  speechConfig.speechRecognitionLanguage = "en-US";

  const audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(tmpFile));

  const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
    referenceText,
    sdk.PronunciationAssessmentGradingSystem.HundredMark,
    sdk.PronunciationAssessmentGranularity.Phoneme,
    true
  );
  pronunciationConfig.enableProsodyAssessment = true;

  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
  pronunciationConfig.applyTo(recognizer);

  return new Promise((resolve) => {
    recognizer.recognizeOnceAsync((result) => {
      recognizer.close();
      try { fs.unlinkSync(tmpFile); } catch (_) {}

      if (result.reason === sdk.ResultReason.RecognizedSpeech) {
        const a = sdk.PronunciationAssessmentResult.fromResult(result);
        resolve({
          transcript:        result.text,
          accuracyScore:     Math.round(a.accuracyScore     ?? 0),
          fluencyScore:      Math.round(a.fluencyScore      ?? 0),
          completenessScore: Math.round(a.completenessScore ?? 0),
          prosodyScore:      Math.round(a.prosodyScore      ?? 0),
        });
      } else {
        resolve({ transcript: "", accuracyScore: 0, fluencyScore: 0, completenessScore: 0, prosodyScore: 0 });
      }
    }, () => {
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      resolve({ transcript: "", accuracyScore: 0, fluencyScore: 0, completenessScore: 0, prosodyScore: 0 });
    });
  });
}

// ─────────────────────────────────────────────────────────
// GPT — speaking
// ─────────────────────────────────────────────────────────
async function evaluateSpeaking({ promptType, question, transcript, azureScores }) {
  if (!transcript) {
    return { fluencyCoherence: 3, lexicalResource: 3, grammaticalRange: 3, pronunciation: 3, band: 3.0, feedback: "No speech detected.", strengths: [], improvements: ["Ensure microphone is working and try again."] };
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini", max_tokens: 500,
    messages: [{
      role: "user",
      content: `You are an IELTS examiner. Evaluate this speaking response.
PROMPT TYPE: ${promptType === "part1" ? "Part 1 (short answer)" : "Part 2 (long turn)"}
QUESTION: ${question}
TRANSCRIPT: "${transcript}"
AZURE SCORES (0-100): Accuracy ${azureScores.accuracyScore}, Fluency ${azureScores.fluencyScore}, Completeness ${azureScores.completenessScore}, Prosody ${azureScores.prosodyScore}
Score on 4 IELTS Speaking criteria (1-9). Return ONLY valid JSON:
{"fluencyCoherence":<1-9>,"lexicalResource":<1-9>,"grammaticalRange":<1-9>,"pronunciation":<1-9>,"band":<1-9 nearest 0.5>,"feedback":"<2 sentences>","strengths":["<s1>"],"improvements":["<i1>"]}`,
    }],
  });
  return JSON.parse(res.choices[0].message.content.replace(/```json|```/g, "").trim());
}

// ─────────────────────────────────────────────────────────
// GPT — writing
// ─────────────────────────────────────────────────────────
async function evaluateWriting({ writingPrompt, response }) {
  const wordCount = response.trim().split(/\s+/).length;
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini", max_tokens: 600,
    messages: [{
      role: "user",
      content: `You are an IELTS examiner. Evaluate this Task 1 Writing response.
TASK: ${writingPrompt}
RESPONSE (${wordCount} words): "${response}"
TARGET: 80-120 words.
Score on 4 IELTS Writing Task 1 criteria (1-9). Return ONLY valid JSON:
{"taskAchievement":<1-9>,"coherenceCohesion":<1-9>,"lexicalResource":<1-9>,"grammaticalRange":<1-9>,"band":<average nearest 0.5>,"feedback":"<3 sentences>","strengths":["<s1>","<s2>"],"improvements":["<i1>","<i2>"]}`,
    }],
  });
  return JSON.parse(res.choices[0].message.content.replace(/```json|```/g, "").trim());
}

// ─────────────────────────────────────────────────────────
// GPT — diagnostic report
// ─────────────────────────────────────────────────────────
async function generateDiagnosticReport({ listeningBand, readingBand, writingBand, speakingBand, overallBand, writingFeedback, speakingFeedback }) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini", max_tokens: 700,
    messages: [{
      role: "user",
      content: `You are an IELTS expert. Generate a personalised diagnostic report.
Scores — Listening: ${listeningBand}, Reading: ${readingBand}, Writing: ${writingBand}, Speaking: ${speakingBand}, Overall: ${overallBand}
Writing notes: ${writingFeedback}
Speaking notes: ${speakingFeedback}
Return ONLY valid JSON:
{"strengths":["<s1>","<s2>"],"weaknesses":["<w1>","<w2>"],"advice":["<a1>","<a2>","<a3>"],"studyPlanSummary":"<2-3 sentences>"}`,
    }],
  });
  return JSON.parse(res.choices[0].message.content.replace(/```json|```/g, "").trim());
}

// ─────────────────────────────────────────────────────────
// Static grading
// ─────────────────────────────────────────────────────────
function gradeObjectiveSection(questions, userAnswers) {
  let correct = 0;
  const normalize = (s) => (s || "").replace(/^[a-d]\.\s*/i, "").trim().toLowerCase();

  const details = questions.map((q) => {
    const userAns  = normalize(userAnswers[q.questionNumber]);
    const accepted = [q.correctAnswer, ...(q.acceptedAnswers || [])].map(normalize);
    const isCorrect = accepted.some((a) => userAns === a);
    if (isCorrect) correct++;
    return { questionNumber: q.questionNumber, userAnswer: userAnswers[q.questionNumber] || "", isCorrect };
  });

  const bandTable = [3.0, 4.0, 5.0, 6.0, 7.5, 9.0];
  return {
    band:     bandTable[correct] ?? 3.0,
    rawScore: correct,
    maxScore: questions.length,
    details,
    feedback: `${correct} / ${questions.length} correct.`,
  };
}

function roundHalf(n)      { return Math.round(n * 2) / 2; }
function bandToLabel(band) {
  if (band >= 8.5) return "Expert";
  if (band >= 7.5) return "Very Good";
  if (band >= 6.5) return "Competent";
  if (band >= 5.5) return "Modest";
  if (band >= 4.5) return "Limited";
  return "Beginner";
}

// ─────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────

/**
 * GET /api/baseline/test
 * Returns test structure WITHOUT audio (small, fast, cacheable in sessionStorage).
 * Audio is fetched separately by the browser via /api/baseline/audio
 */
exports.getTest = async (req, res) => {
  try {
    const test = await BaselineTest.findOne({ isActive: true })
      .select("-listening.audioBase64 -listening.passageText")
      .lean();
    if (!test) {
      return res.status(404).json({ success: false, message: "No active baseline test. Run: node seeds/seedBaseline.js" });
    }

    res.json({
      success: true,
      test: {
        _id:       test._id,
        listening: {
          title:     test.listening.title,
          timeLimit: test.listening.timeLimit,
          questions: test.listening.questions,
        },
        reading:  test.reading,
        writing:  test.writing,
        speaking: test.speaking,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/baseline/audio
 * Serves listening audio as audio/wav binary stream.
 * Browser <audio> tag handles it natively — no base64, no size limits.
 */
exports.getAudio = async (req, res) => {
  try {
    const test = await BaselineTest.findOne({ isActive: true })
      .select("listening.audioBase64")
      .lean();

    if (!test || !test.listening || !test.listening.audioBase64) {
      return res.status(404).json({ success: false, message: "Audio not found. Re-run seed script." });
    }

    const base64Data  = test.listening.audioBase64.replace(/^data:audio\/[^;]+;base64,/, "");
    const audioBuffer = Buffer.from(base64Data, "base64");

    // Detect format from stored data URI prefix
    const isMp3 = test.listening.audioBase64.startsWith("data:audio/mp3");
    res.set({
      "Content-Type":        isMp3 ? "audio/mpeg" : "audio/wav",
      "Content-Length":      audioBuffer.length,
      "Accept-Ranges":       "bytes",
      "Cache-Control":       "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    });

    // Handle range requests so browser can seek + get duration
    const range = req.headers.range;
    if (range) {
      const parts  = range.replace(/bytes=/, "").split("-");
      const start  = parseInt(parts[0], 10);
      const end    = parts[1] ? parseInt(parts[1], 10) : audioBuffer.length - 1;
      const chunk  = audioBuffer.slice(start, end + 1);
      res.status(206).set({
        "Content-Range":  `bytes ${start}-${end}/${audioBuffer.length}`,
        "Content-Length": chunk.length,
      });
      res.send(chunk);
    } else {
      res.status(200).send(audioBuffer);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/baseline/status
 */
exports.getStatus = async (req, res) => {
  try {
    const result = await BaselineResult.findOne({ userId: req.user._id }).lean();
    res.json({
      success:   true,
      completed: !!result,
      result: result
        ? { overallBand: result.overallBand, skillLabel: result.skillLabel, completedAt: result.completedAt }
        : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/baseline/submit
 *
 * Accepts multipart/form-data:
 *   Fields (JSON strings):
 *     testId, timeUsed, listeningAnswers, readingAnswers, writingResponse,
 *     speakingMeta  (JSON array: [{promptNumber, promptType, question}])
 *   Files (one per speaking prompt):
 *     speaking_1  (audio file for prompt 1)
 *     speaking_2  (audio file for prompt 2)
 *
 * multer must be configured in routes/baseline.js
 */
exports.submitTest = async (req, res) => {
  try {
    const userId = req.user._id;

    // One-time check
    const existing = await BaselineResult.findOne({ userId });
    if (existing) {
      return res.json({ success: true, alreadyCompleted: true, resultId: existing._id, overallBand: existing.overallBand });
    }

    // Parse fields from FormData (all come as strings)
    const testId           = req.body.testId;
    const timeUsed         = parseInt(req.body.timeUsed || "0", 10);
    const listeningAnswers = JSON.parse(req.body.listeningAnswers || "{}");
    const readingAnswers   = JSON.parse(req.body.readingAnswers   || "{}");
    const writingResponse  = req.body.writingResponse || "";
    const speakingMeta     = JSON.parse(req.body.speakingMeta     || "[]");

    const test = await BaselineTest.findById(testId).lean();
    if (!test) return res.status(404).json({ success: false, message: "Test not found." });

    // ── 1. Grade listening + reading (instant) ──
    const listeningResult = gradeObjectiveSection(test.listening.questions, listeningAnswers);
    const readingResult   = gradeObjectiveSection(test.reading.questions,   readingAnswers);

    // ── 2. Grade writing (GPT) ──
    let writingResult = { band: 4.0, rawScore: 4.0, maxScore: 9, feedback: "No response provided.", details: {} };
    if (writingResponse.trim().split(/\s+/).length >= 10) {
      const gpt = await evaluateWriting({ writingPrompt: test.writing.prompt, response: writingResponse });
      writingResult = { band: gpt.band, rawScore: gpt.band, maxScore: 9, feedback: gpt.feedback, details: gpt };
    }

    // ── 3. Grade speaking — uploaded files via multer ──
    let speakingBand            = 4.0;
    let speakingFeedbackSummary = "No speaking responses submitted.";
    let speakingResultsStored   = [];

    const uploadedFiles = req.files || {};

    if (speakingMeta.length > 0) {
      const evaluated = await Promise.all(
        speakingMeta.map(async (meta) => {
          const fileKey  = `speaking_${meta.promptNumber}`;
          const fileObj  = uploadedFiles[fileKey]?.[0];

          let azureScores = { transcript: "", accuracyScore: 0, fluencyScore: 0, completenessScore: 0, prosodyScore: 0 };
          if (fileObj) {
            azureScores = await azurePronunciationAssessment(fileObj.buffer, meta.question);
          }

          const gptResult = await evaluateSpeaking({
            promptType:  meta.promptType,
            question:    meta.question,
            transcript:  azureScores.transcript,
            azureScores,
          });

          return {
            promptNumber: meta.promptNumber,
            azureScores,
            transcript:   azureScores.transcript,
            gptFeedback:  gptResult.feedback,
            band:         gptResult.band,
          };
        })
      );

      const bands             = evaluated.map((e) => Number(e.band) || 4.0);
      speakingBand            = roundHalf(bands.reduce((a, b) => a + b, 0) / bands.length);
      speakingFeedbackSummary = evaluated.map((e) => e.gptFeedback).filter(Boolean).join(" ");
      speakingResultsStored   = evaluated;
    }

    // ── 4. Overall band ──
    const overallBand = roundHalf(
      (listeningResult.band + readingResult.band + writingResult.band + speakingBand) / 4
    );

    // ── 5. Diagnostic report ──
    const diagnostic = await generateDiagnosticReport({
      listeningBand:   listeningResult.band,
      readingBand:     readingResult.band,
      writingBand:     writingResult.band,
      speakingBand,
      overallBand,
      writingFeedback:  writingResult.feedback,
      speakingFeedback: speakingFeedbackSummary,
    });

    // ── 6. Store result ──
    const result = await BaselineResult.create({
      userId, testId, timeUsed,
      listening: { band: listeningResult.band, rawScore: listeningResult.rawScore, maxScore: listeningResult.maxScore, feedback: listeningResult.feedback },
      reading:   { band: readingResult.band,   rawScore: readingResult.rawScore,   maxScore: readingResult.maxScore,   feedback: readingResult.feedback },
      writing:   { band: writingResult.band,   rawScore: writingResult.rawScore,   maxScore: writingResult.maxScore,   feedback: writingResult.feedback, details: writingResult.details },
      speaking:  { band: speakingBand, rawScore: speakingBand, maxScore: 9, feedback: speakingFeedbackSummary },
      overallBand,
      skillLabel: bandToLabel(overallBand),
      diagnosticReport: diagnostic,
      listeningAnswers: listeningResult.details,
      readingAnswers:   readingResult.details,
      writingResponse,
      speakingResults:  speakingResultsStored,
    });

    res.json({ success: true, resultId: result._id, overallBand, skillLabel: result.skillLabel });

  } catch (err) {
    console.error("Baseline submit error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/baseline/result
 */
exports.getResult = async (req, res) => {
  try {
    const result = await BaselineResult.findOne({ userId: req.user._id }).lean();
    if (!result) return res.status(404).json({ success: false, message: "No baseline result found." });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};