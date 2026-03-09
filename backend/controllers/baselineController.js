const OpenAI  = require("openai");
const fs      = require("fs");
const path    = require("path");
const os      = require("os");
const { v4: uuidv4 } = require("uuid");
const ffmpeg     = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const sdk        = require("microsoft-cognitiveservices-speech-sdk");
ffmpeg.setFfmpegPath(ffmpegPath);
const BaselineTest   = require("../models/BaselineTest");
const BaselineResult = require("../models/BaselineResult");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helpers ──────────────────────────────────────────────
function roundHalf(n) { return Math.round(n * 2) / 2; }

function bandToLabel(b) {
  if (b >= 8.5) return "Expert";
  if (b >= 7.5) return "Very Good";
  if (b >= 6.5) return "Competent";
  if (b >= 5.5) return "Modest";
  if (b >= 4.5) return "Limited";
  return "Beginner";
}

function gradeSection(questions, answers) {
  const norm = (s) => (s || "").replace(/^[a-d]\.\s*/i, "").trim().toLowerCase();
  let correct = 0;
  const details = questions.map((q) => {
    const ua = norm(answers[q.questionNumber]);
    const ok = [q.correctAnswer, ...(q.acceptedAnswers || [])].map(norm).some((a) => ua === a);
    if (ok) correct++;
    return { questionNumber: q.questionNumber, userAnswer: answers[q.questionNumber] || "", isCorrect: ok };
  });
  const table = [3.0, 3.5, 4.0, 5.0, 6.5, 8.0];
  return { band: table[correct] ?? 3.0, rawScore: correct, maxScore: questions.length, details };
}

// ─── Convert webm → WAV 16kHz mono ────────────────────────
function toWav(inputBuffer) {
  return new Promise((resolve, reject) => {
    const tmpIn  = path.join(os.tmpdir(), `in_${uuidv4()}.webm`);
    const tmpOut = path.join(os.tmpdir(), `out_${uuidv4()}.wav`);
    fs.writeFileSync(tmpIn, inputBuffer);
    ffmpeg(tmpIn)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec("pcm_s16le")
      .format("wav")
      .on("end", () => {
        const buf = fs.readFileSync(tmpOut);
        try { fs.unlinkSync(tmpIn);  } catch (_) {}
        try { fs.unlinkSync(tmpOut); } catch (_) {}
        console.log("✅ ffmpeg converted WAV:", buf.length, "bytes");
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

// ─── Azure STT + Pronunciation Assessment ─────────────────
async function azureAssess(audioBuffer, referenceText) {
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

    // Empty reference = free speech mode, no forced word matching
    const pronCfg = new sdk.PronunciationAssessmentConfig(
      "",
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Word,
      true
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
          console.log("✅ Azure transcript:", result.text);
          console.log(`   Accuracy:${Math.round(a.accuracyScore)} Fluency:${Math.round(a.fluencyScore)} Completeness:${Math.round(a.completenessScore)} Prosody:${Math.round(a.prosodyScore)}`);
          resolve({
            transcript:        result.text || "",
            accuracyScore:     Math.round(a.accuracyScore     ?? 0),
            fluencyScore:      Math.round(a.fluencyScore      ?? 0),
            completenessScore: Math.round(a.completenessScore ?? 0),
            prosodyScore:      Math.round(a.prosodyScore      ?? 0),
          });
        } else {
          console.log("❌ Azure reason:", result.reason, result.errorDetails);
          try { fs.unlinkSync(tmpWav); } catch (_) {}
          resolve(EMPTY);
        }
      }, (err) => {
        console.error("❌ Azure error:", err);
        try { fs.unlinkSync(tmpWav); } catch (_) {}
        resolve(EMPTY);
      });
    });
  } catch (err) {
    console.error("azureAssess error:", err.message);
    try { fs.unlinkSync(tmpWav); } catch (_) {}
    return EMPTY;
  }
}

// ─── GPT Speaking ──────────────────────────────────────────
async function gptSpeaking({ question, transcript, azure }) {
  if (!transcript) return { band: 0, feedback: "No speech detected. Score not counted.", strengths: [], improvements: ["Ensure microphone is working and try again."] };
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini", max_tokens: 400,
    messages: [{ role: "user", content:
      `You are an IELTS speaking examiner. Evaluate this spoken response.
QUESTION: ${question}
TRANSCRIPT: "${transcript}"
AZURE SCORES (0-100): Accuracy=${azure.accuracyScore}, Fluency=${azure.fluencyScore}, Completeness=${azure.completenessScore}, Prosody=${azure.prosodyScore}
Score on 4 IELTS criteria (1-9). Return ONLY valid JSON (no markdown):
{"fluencyCoherence":<1-9>,"lexicalResource":<1-9>,"grammaticalRange":<1-9>,"pronunciation":<1-9>,"band":<average nearest 0.5>,"feedback":"<2 sentences>","strengths":["s1"],"improvements":["i1"]}`
    }],
  });
  return JSON.parse(r.choices[0].message.content.replace(/```json|```/g, "").trim());
}

// ─── GPT Writing ───────────────────────────────────────────
async function gptWriting({ prompt, response }) {
  const wc = response.trim().split(/\s+/).length;
  const r  = await openai.chat.completions.create({
    model: "gpt-4o-mini", max_tokens: 500,
    messages: [{ role: "user", content:
      `You are an IELTS writing examiner. Evaluate this response.
TASK: ${prompt}
RESPONSE (${wc} words): "${response}"
Return ONLY valid JSON (no markdown):
{"taskAchievement":<1-9>,"coherenceCohesion":<1-9>,"lexicalResource":<1-9>,"grammaticalRange":<1-9>,"band":<average nearest 0.5>,"feedback":"<3 sentences>","strengths":["s1"],"improvements":["i1"]}`
    }],
  });
  return JSON.parse(r.choices[0].message.content.replace(/```json|```/g, "").trim());
}

// ─── GPT Diagnostic ────────────────────────────────────────
async function gptDiagnostic({ lBand, rBand, wBand, sBand, overall, wFeedback, sFeedback }) {
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini", max_tokens: 600,
    messages: [{ role: "user", content:
      `You are an IELTS expert. Generate a personalised diagnostic report.
Bands — Listening:${lBand}, Reading:${rBand}, Writing:${wBand}, Speaking:${sBand}, Overall:${overall}
Writing feedback: ${wFeedback}
Speaking feedback: ${sFeedback}
Return ONLY valid JSON (no markdown):
{"strengths":["s1","s2"],"weaknesses":["w1","w2"],"advice":["a1","a2","a3"],"studyPlanSummary":"2-3 sentences"}`
    }],
  });
  return JSON.parse(r.choices[0].message.content.replace(/```json|```/g, "").trim());
}

// ─────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────

exports.getAudio = async (req, res) => {
  try {
    const test = await BaselineTest.findOne({ isActive: true }).select("listening.audioBase64").lean();
    if (!test?.listening?.audioBase64) {
      return res.status(404).json({ message: "Audio not found. Run seed script." });
    }
    const base64 = test.listening.audioBase64.replace(/^data:audio\/[^;]+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
    const isMP3  = test.listening.audioBase64.startsWith("data:audio/mpeg") ||
                   test.listening.audioBase64.startsWith("data:audio/mp3");
    const ctype  = isMP3 ? "audio/mpeg" : "audio/wav";
    const total  = buffer.length;

    const range = req.headers.range;
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end   = endStr ? parseInt(endStr, 10) : total - 1;
      const chunk = buffer.slice(start, end + 1);
      res.writeHead(206, {
        "Content-Range":  `bytes ${start}-${end}/${total}`,
        "Accept-Ranges":  "bytes",
        "Content-Length": chunk.length,
        "Content-Type":   ctype,
        "Cache-Control":  "public, max-age=86400",
      });
      return res.end(chunk);
    }
    res.writeHead(200, {
      "Content-Length": total,
      "Content-Type":   ctype,
      "Accept-Ranges":  "bytes",
      "Cache-Control":  "public, max-age=86400",
    });
    res.end(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTest = async (req, res) => {
  try {
    const test = await BaselineTest.findOne({ isActive: true })
      .select("-listening.audioBase64").lean();
    if (!test) return res.status(404).json({ success: false, message: "No baseline test found. Run seed script." });
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.json({ success: true, completed: true, isAdmin: true, result: null });
    }
    const result = await BaselineResult.findOne({ userId: req.user._id }).lean();
    res.json({
      success:   true,
      completed: !!result,
      result: result ? {
        overallBand: result.overallBand,
        skillLabel:  result.skillLabel,
        completedAt: result.createdAt,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitTest = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await BaselineResult.findOne({ userId });
    if (existing) {
      return res.json({ success: true, alreadyCompleted: true, overallBand: existing.overallBand });
    }

    const testId           = req.body.testId;
    const timeUsed         = parseInt(req.body.timeUsed || "0", 10);
    const listeningAnswers = JSON.parse(req.body.listeningAnswers || "{}");
    const readingAnswers   = JSON.parse(req.body.readingAnswers   || "{}");
    const writingResponse  = (req.body.writingResponse || "").trim();

    const test = await BaselineTest.findById(testId).lean();
    if (!test) return res.status(404).json({ success: false, message: "Test not found." });

    // 1. Listening + Reading
    const lisRes  = gradeSection(test.listening.questions, listeningAnswers);
    const readRes = gradeSection(test.reading.questions,   readingAnswers);

    // 2. Writing
    let writeRes = { band: 4.0, feedback: "No response provided.", details: {} };
    if (writingResponse.split(/\s+/).length >= 20) {
      const g  = await gptWriting({ prompt: test.writing.prompt, response: writingResponse });
      writeRes = { band: g.band, feedback: g.feedback, details: g };
    }

    // 3. Speaking — ffmpeg converts webm → WAV → Azure assesses
    let speakBand   = 0;
    let speakResult = { transcript: "", azureScores: {}, gptFeedback: "No audio submitted.", details: {} };
    const audioFile = req.files?.speaking_audio?.[0];
    if (audioFile) {
      console.log(`🎤 Speaking audio: ${Math.round(audioFile.buffer.length / 1024)} KB`);
      const azure = await azureAssess(audioFile.buffer, test.speaking.question);
      const gpt   = await gptSpeaking({ question: test.speaking.question, transcript: azure.transcript, azure });
      speakBand   = gpt.band;
      speakResult = { transcript: azure.transcript, azureScores: azure, gptFeedback: gpt.feedback, details: gpt };
      console.log(`🏅 Speaking band: ${speakBand}`);
    }

    // 4. Overall
    const sectionCount = speakBand > 0 ? 4 : 3;
    const overallBand  = roundHalf((lisRes.band + readRes.band + writeRes.band + speakBand) / sectionCount);

    // 5. Diagnostic
    const diagnostic = await gptDiagnostic({
      lBand: lisRes.band, rBand: readRes.band, wBand: writeRes.band, sBand: speakBand, overall: overallBand,
      wFeedback: writeRes.feedback, sFeedback: speakResult.gptFeedback,
    });

    // 6. Save
    const result = await BaselineResult.create({
      userId, testId, timeUsed,
      listening: { band: lisRes.band,   rawScore: lisRes.rawScore,  maxScore: lisRes.maxScore,  feedback: `${lisRes.rawScore}/${lisRes.maxScore} correct` },
      reading:   { band: readRes.band,  rawScore: readRes.rawScore, maxScore: readRes.maxScore, feedback: `${readRes.rawScore}/${readRes.maxScore} correct` },
      writing:   { band: writeRes.band, rawScore: writeRes.band,    maxScore: 9, feedback: writeRes.feedback, details: writeRes.details },
      speaking:  { band: speakBand,     rawScore: speakBand,        maxScore: 9, feedback: speakResult.gptFeedback },
      overallBand,
      skillLabel:       bandToLabel(overallBand),
      diagnosticReport: diagnostic,
      listeningAnswers: lisRes.details,
      readingAnswers:   readRes.details,
      writingResponse,
      speakingResult:   speakResult,
    });

    const User = require("../models/User");
    await User.findByIdAndUpdate(userId, { baselineDone: true });

    res.json({ success: true, resultId: result._id, overallBand, skillLabel: result.skillLabel });

  } catch (err) {
    console.error("Baseline submit error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getResult = async (req, res) => {
  try {
    const result = await BaselineResult.findOne({ userId: req.user._id }).lean();
    if (!result) return res.status(404).json({ success: false, message: "No result found." });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
