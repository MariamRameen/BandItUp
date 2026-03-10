const OpenAI   = require("openai");
const fs       = require("fs");
const path     = require("path");
const os       = require("os");
const { v4: uuidv4 } = require("uuid");
const ffmpeg     = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const sdk        = require("microsoft-cognitiveservices-speech-sdk");
ffmpeg.setFfmpegPath(ffmpegPath);
const SpeakingSession = require("../models/SpeakingSession");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Convert webm → WAV 16kHz mono ────────────────────────
function toWav(inputBuffer) {
  return new Promise((resolve, reject) => {
    const tmpIn  = path.join(os.tmpdir(), `spk_in_${uuidv4()}.webm`);
    const tmpOut = path.join(os.tmpdir(), `spk_out_${uuidv4()}.wav`);
    fs.writeFileSync(tmpIn, inputBuffer);
    ffmpeg(tmpIn)
      .audioChannels(1).audioFrequency(16000).audioCodec("pcm_s16le").format("wav")
      .on("end", () => {
        const buf = fs.readFileSync(tmpOut);
        try { fs.unlinkSync(tmpIn);  } catch (_) {}
        try { fs.unlinkSync(tmpOut); } catch (_) {}
        resolve(buf);
      })
      .on("error", (err) => {
        try { fs.unlinkSync(tmpIn);  } catch (_) {}
        try { fs.unlinkSync(tmpOut); } catch (_) {}
        reject(err);
      })
      .save(tmpOut);
  });
}

// ─── Azure STT + Pronunciation ─────────────────────────────
async function azureAssess(audioBuffer) {
  const EMPTY = { transcript: "", accuracyScore: 0, fluencyScore: 0, completenessScore: 0, prosodyScore: 0 };
  const tmpWav = path.join(os.tmpdir(), `spk_${uuidv4()}.wav`);
  try {
    const wavBuffer = await toWav(audioBuffer);
    fs.writeFileSync(tmpWav, wavBuffer);

    const speechCfg = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY, process.env.AZURE_SPEECH_REGION
    );
    speechCfg.speechRecognitionLanguage = "en-US";
    const audioCfg = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(tmpWav));
    const pronCfg  = new sdk.PronunciationAssessmentConfig(
      "", sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Word, true
    );
    pronCfg.enableProsodyAssessment = true;
    const recognizer = new sdk.SpeechRecognizer(speechCfg, audioCfg);
    pronCfg.applyTo(recognizer);

    return await new Promise((resolve) => {
      recognizer.recognizeOnceAsync((result) => {
        recognizer.close();
        try { fs.unlinkSync(tmpWav); } catch (_) {}
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          const a = sdk.PronunciationAssessmentResult.fromResult(result);
          resolve({
            transcript:        result.text || "",
            accuracyScore:     Math.round(a.accuracyScore     ?? 0),
            fluencyScore:      Math.round(a.fluencyScore      ?? 0),
            completenessScore: Math.round(a.completenessScore ?? 0),
            prosodyScore:      Math.round(a.prosodyScore      ?? 0),
          });
        } else {
          try { fs.unlinkSync(tmpWav); } catch (_) {}
          resolve(EMPTY);
        }
      }, (err) => {
        try { fs.unlinkSync(tmpWav); } catch (_) {}
        console.error("Azure error:", err);
        resolve(EMPTY);
      });
    });
  } catch (err) {
    try { fs.unlinkSync(tmpWav); } catch (_) {}
    console.error("azureAssess error:", err.message);
    return EMPTY;
  }
}

// ─── GPT IELTS Speaking Evaluator ─────────────────────────
async function gptEvaluate({ prompt, transcript, mode, userBand, azure }) {
  if (!transcript) {
    return { fluencyCoherence: 0, lexicalResource: 0, grammaticalRange: 0, pronunciation: 0, band: 0, feedback: "No speech detected.", strengths: [], improvements: ["Ensure your microphone is working."] };
  }
  const partLabel = mode === "free" ? "Free Practice" : mode === "ielts_part1" ? "IELTS Part 1" : mode === "ielts_part2" ? "IELTS Part 2 (Cue Card)" : "IELTS Part 3 (Discussion)";
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini", max_tokens: 500,
    messages: [{ role: "user", content:
      `You are an expert IELTS speaking examiner. Evaluate this ${partLabel} response.
User's current band level: ${userBand || "unknown"}
QUESTION/PROMPT: "${prompt}"
TRANSCRIPT: "${transcript}"
AZURE PRONUNCIATION (0-100): Accuracy=${azure.accuracyScore}, Fluency=${azure.fluencyScore}, Completeness=${azure.completenessScore}, Prosody=${azure.prosodyScore}

Score strictly using official IELTS speaking rubrics (1-9 each):
- Fluency & Coherence: flow, hesitation, coherent connected speech
- Lexical Resource: vocabulary range, precision, idiomatic language
- Grammatical Range & Accuracy: sentence structures, error frequency
- Pronunciation: clarity, accent, intonation, stress

Return ONLY valid JSON (no markdown):
{"fluencyCoherence":<1-9>,"lexicalResource":<1-9>,"grammaticalRange":<1-9>,"pronunciation":<1-9>,"band":<average nearest 0.5>,"feedback":"<3 sentences specific to this response>","strengths":["specific strength 1","specific strength 2"],"improvements":["specific improvement 1","specific improvement 2"]}`
    }],
  });
  try {
    return JSON.parse(r.choices[0].message.content.replace(/```json|```/g, "").trim());
  } catch {
    return { fluencyCoherence: 4, lexicalResource: 4, grammaticalRange: 4, pronunciation: 4, band: 4, feedback: "Evaluation complete.", strengths: [], improvements: [] };
  }
}

// ─── Get user's average band ───────────────────────────────
async function getUserAvgBand(userId) {
  const sessions = await SpeakingSession.find({ userId, band: { $gt: 0 } }).sort({ createdAt: -1 }).limit(10).lean();
  if (!sessions.length) return 0;
  const avg = sessions.reduce((s, x) => s + x.band, 0) / sessions.length;
  return Math.round(avg * 2) / 2;
}

// ─────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────

/**
 * GET /api/speaking/prompt
 * Generate a prompt based on mode and user's band
 */
exports.getPrompt = async (req, res) => {
  try {
    const { mode = "free" } = req.query;
    const userBand = await getUserAvgBand(req.user._id);

    const levelDesc = userBand >= 7 ? "advanced (Band 7-9)" : userBand >= 5 ? "intermediate (Band 5-6.5)" : "beginner (Band 3-4.5)";

    const promptMap = {
      free: `Generate a single interesting IELTS-style speaking prompt for a ${levelDesc} student. It should be conversational and easy to start speaking about immediately. Return ONLY the prompt text, no labels or prefixes.`,
      ielts_part1: `Generate a set of 3 IELTS Part 1 speaking questions on a single topic (like hometown, hobbies, food, travel, work/study) for a ${levelDesc} student. These should be short personal questions. Return ONLY a JSON array of 3 question strings: ["q1","q2","q3"]`,
      ielts_part2: `Generate an IELTS Part 2 cue card for a ${levelDesc} student. Include the main topic and 3-4 bullet points of what to cover. Return ONLY the cue card text as a single string, formatted naturally.`,
      ielts_part3: `Generate 2 IELTS Part 3 discussion questions related to a broader social/abstract topic suitable for a ${levelDesc} student. These should require extended abstract answers. Return ONLY a JSON array of 2 question strings: ["q1","q2"]`,
    };

    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini", max_tokens: 300,
      messages: [{ role: "user", content: promptMap[mode] || promptMap.free }],
    });

    let promptText = r.choices[0].message.content.trim();
    // For array responses (part1, part3), parse and join
    if (mode === "ielts_part1" || mode === "ielts_part3") {
      try {
        const arr = JSON.parse(promptText.replace(/```json|```/g, "").trim());
        promptText = Array.isArray(arr) ? arr.join("\n\n") : promptText;
      } catch { /* keep as is */ }
    }

    res.json({ success: true, prompt: promptText, userBand, levelDesc });
  } catch (err) {
    console.error("getPrompt error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/speaking/evaluate
 * Multipart: fields: mode, prompt, duration | file: audio (webm)
 */
exports.evaluate = async (req, res) => {
  try {
    const userId   = req.user._id;
    const mode     = req.body.mode     || "free";
    const prompt   = req.body.prompt   || "";
    const duration = parseInt(req.body.duration || "30", 10);
    const userBand = await getUserAvgBand(userId);

    const audioFile = req.files?.audio?.[0];
    if (!audioFile) return res.status(400).json({ success: false, message: "No audio file received." });

    console.log(`🎤 Speaking evaluate: ${Math.round(audioFile.buffer.length / 1024)} KB, mode=${mode}`);

    // 1. Azure STT + pronunciation
    const azure = await azureAssess(audioFile.buffer);
    console.log(`   Transcript: "${azure.transcript || "(empty)"}"`);

    // 2. GPT IELTS evaluation
    const gpt = await gptEvaluate({ prompt, transcript: azure.transcript, mode, userBand, azure });
    console.log(`   Band: ${gpt.band}`);

    // 3. Save session
    const session = await SpeakingSession.create({
      userId, mode, prompt, duration,
      transcript:        azure.transcript,
      fluencyCoherence:  gpt.fluencyCoherence,
      lexicalResource:   gpt.lexicalResource,
      grammaticalRange:  gpt.grammaticalRange,
      pronunciation:     gpt.pronunciation,
      band:              gpt.band,
      feedback:          gpt.feedback,
      strengths:         gpt.strengths  || [],
      improvements:      gpt.improvements || [],
      azureAccuracy:     azure.accuracyScore,
      azureFluency:      azure.fluencyScore,
      azureCompleteness: azure.completenessScore,
      azureProsody:      azure.prosodyScore,
      userBandAtTime:    userBand,
    });

    res.json({ success: true, session });
  } catch (err) {
    console.error("evaluate error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/speaking/stats
 * Returns user's average band, recent sessions summary, trend
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessions = await SpeakingSession.find({ userId, band: { $gt: 0 } })
      .sort({ createdAt: -1 }).limit(20).lean();

    const avgBand = sessions.length
      ? Math.round((sessions.reduce((s, x) => s + x.band, 0) / sessions.length) * 2) / 2
      : 0;

    // Per-mode averages
    const modeStats = {};
    for (const s of sessions) {
      if (!modeStats[s.mode]) modeStats[s.mode] = { total: 0, count: 0 };
      modeStats[s.mode].total += s.band;
      modeStats[s.mode].count++;
    }
    for (const m of Object.keys(modeStats)) {
      modeStats[m].avg = Math.round((modeStats[m].total / modeStats[m].count) * 2) / 2;
    }

    // Trend: last 5 sessions
    const trend = sessions.slice(0, 5).reverse().map(s => ({
      date: s.createdAt, band: s.band, mode: s.mode,
    }));

    // Criterion averages
    const criteriaAvg = sessions.length ? {
      fluencyCoherence:  Math.round((sessions.reduce((s, x) => s + x.fluencyCoherence, 0) / sessions.length) * 10) / 10,
      lexicalResource:   Math.round((sessions.reduce((s, x) => s + x.lexicalResource,  0) / sessions.length) * 10) / 10,
      grammaticalRange:  Math.round((sessions.reduce((s, x) => s + x.grammaticalRange, 0) / sessions.length) * 10) / 10,
      pronunciation:     Math.round((sessions.reduce((s, x) => s + x.pronunciation,    0) / sessions.length) * 10) / 10,
    } : { fluencyCoherence: 0, lexicalResource: 0, grammaticalRange: 0, pronunciation: 0 };

    res.json({ success: true, avgBand, totalSessions: sessions.length, modeStats, trend, criteriaAvg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/speaking/history
 * Paginated session history
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page   = parseInt(req.query.page  || "1",  10);
    const limit  = parseInt(req.query.limit || "10", 10);
    const skip   = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      SpeakingSession.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SpeakingSession.countDocuments({ userId }),
    ]);

    res.json({ success: true, sessions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/speaking/weekly-mock
 * Generate a weekly mock speaking test based on user's weak areas
 */
exports.getWeeklyMock = async (req, res) => {
  try {
    const userId   = req.user._id;
    const sessions = await SpeakingSession.find({ userId, band: { $gt: 0 } }).sort({ createdAt: -1 }).limit(10).lean();
    const avgBand  = sessions.length
      ? Math.round((sessions.reduce((s, x) => s + x.band, 0) / sessions.length) * 2) / 2
      : 4.0;

    // Find weakest criterion
    const criteria = ["fluencyCoherence", "lexicalResource", "grammaticalRange", "pronunciation"];
    let weakest = "fluencyCoherence";
    if (sessions.length) {
      const avgs = criteria.map(c => ({ c, avg: sessions.reduce((s, x) => s + (x[c] || 0), 0) / sessions.length }));
      weakest = avgs.sort((a, b) => a.avg - b.avg)[0].c;
    }

    const levelDesc = avgBand >= 7 ? "advanced" : avgBand >= 5 ? "intermediate" : "beginner";
    const weakLabel = { fluencyCoherence: "fluency and coherence", lexicalResource: "vocabulary range", grammaticalRange: "grammatical accuracy", pronunciation: "pronunciation" }[weakest];

    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini", max_tokens: 600,
      messages: [{ role: "user", content:
        `Generate a complete weekly IELTS speaking mock test for a ${levelDesc} student (Band ${avgBand}) who needs to improve ${weakLabel}.
Return ONLY valid JSON:
{
  "part1": { "topic": "<topic>", "questions": ["q1","q2","q3"] },
  "part2": { "cueCard": "<full cue card text with bullets>" },
  "part3": { "questions": ["q1","q2"] },
  "focusTip": "<1 sentence tip targeting ${weakLabel}>"
}`
      }],
    });

    const mock = JSON.parse(r.choices[0].message.content.replace(/```json|```/g, "").trim());
    res.json({ success: true, mock, avgBand, weakest, weekLabel: weakLabel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};