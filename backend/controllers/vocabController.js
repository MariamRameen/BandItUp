const Word = require("../models/Word");
const UserWordProgress = require("../models/UserWordProgress");
const VocabQuizSession = require("../models/VocabQuizSession");
const { autoCompleteTaskBySkill } = require("./studyPlannerController");
const { v4: uuidv4 } = require("uuid");
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom(arr, n) {
  return shuffle([...arr]).slice(0, n);
}


function computeQuizBandScore(mcqScore, totalMcq, writtenScore, writtenBand) {
  const mcqRatio = totalMcq > 0 ? mcqScore / totalMcq : 0;
  const writtenRatio = writtenScore / 4;
  const bandRatio = writtenBand / 9;
  const raw = (mcqRatio * 0.5 + writtenRatio * 0.3 + bandRatio * 0.2) * 9;
  const clamped = Math.max(4.0, Math.min(9.0, raw));
  return Math.round(clamped * 2) / 2; 
}


exports.getBandSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const bandCounts = await Word.aggregate([
      { $group: { _id: "$bandLevel", total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    
    const masteredCounts = await UserWordProgress.aggregate([
      { $match: { userId, masteryStatus: "mastered" } },
      {
        $lookup: {
          from: "words",
          localField: "wordId",
          foreignField: "_id",
          as: "wordData",
        },
      },
      { $unwind: "$wordData" },
      { $group: { _id: "$wordData.bandLevel", mastered: { $sum: 1 } } },
    ]);

    const masteredMap = {};
    masteredCounts.forEach((m) => (masteredMap[m._id] = m.mastered));

    const bands = bandCounts.map((b) => ({
      band: b._id,
      total: b.total,
      mastered: masteredMap[b._id] || 0,
    }));

    res.json({ success: true, bands });
  } catch (err) {
    console.error("getBandSummary:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.getWords = async (req, res) => {
  try {
    const userId = req.user._id;
    const { band, topics, letter, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (band) filter.bandLevel = parseInt(band);
    if (topics) {
      const topicArr = topics.split(",").map((t) => t.trim());
      if (topicArr.length > 0) filter.topics = { $in: topicArr };
    }
    if (letter) filter.word = { $regex: `^${letter}`, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [words, total] = await Promise.all([
      Word.find(filter).sort({ word: 1 }).skip(skip).limit(parseInt(limit)),
      Word.countDocuments(filter),
    ]);

   
    const wordIds = words.map((w) => w._id);
    const progressList = await UserWordProgress.find({
      userId,
      wordId: { $in: wordIds },
    });
    const progressMap = {};
    progressList.forEach((p) => (progressMap[String(p.wordId)] = p));

    const wordsWithProgress = words.map((w) => {
      const prog = progressMap[String(w._id)];
      return {
        ...w.toObject(),
        seenCount: prog?.seenCount || 0,
        masteryStatus: prog?.masteryStatus || "unseen",
        accuracy: prog?.accuracy || 0,
        lastReviewedDate: prog?.lastReviewedDate || null,
      };
    });

    // Get unique topics for this band (for filter dropdown)
    const allTopics = await Word.distinct("topics", band ? { bandLevel: parseInt(band) } : {});

    res.json({
      success: true,
      words: wordsWithProgress,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      topics: allTopics.sort(),
    });
  } catch (err) {
    console.error("getWords:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.markWordSeen = async (req, res) => {
  try {
    const userId = req.user._id;
    const { wordId } = req.body;

    const word = await Word.findById(wordId);
    if (!word) return res.status(404).json({ success: false, message: "Word not found" });

    let progress = await UserWordProgress.findOne({ userId, wordId });
    if (!progress) {
      progress = new UserWordProgress({
        userId,
        wordId,
        word: word.word,
        masteryStatus: "learning",
      });
    }

    progress.seenCount += 1;
    progress.lastReviewedDate = new Date();
    if (progress.masteryStatus === "unseen") progress.masteryStatus = "learning";

    await progress.save();
    res.json({ success: true, seenCount: progress.seenCount });
  } catch (err) {
    console.error("markWordSeen:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/vocab/word-of-day  — daily adaptive word
// ─────────────────────────────────────────────
exports.getWordOfDay = async (req, res) => {
  try {
    const userId = req.user._id;

    // ── Check if user already has a word assigned in last 24 hours ──
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentWod = await UserWordProgress.findOne({
      userId,
      wordOfDayShownAt: { $gte: twentyFourHoursAgo },
    }).populate("wordId");

    if (recentWod && recentWod.wordId) {
      // If already viewed — don't show it again until 24h passes
      if (recentWod.wordOfDayViewed) {
        const msRemaining = new Date(recentWod.wordOfDayShownAt).getTime() + 24 * 60 * 60 * 1000 - Date.now();
        const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));
        return res.json({ success: true, word: null, cooldown: true, hoursRemaining });
      }
      // Assigned but not yet viewed — return it
      const msRemaining = new Date(recentWod.wordOfDayShownAt).getTime() + 24 * 60 * 60 * 1000 - Date.now();
      const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));
      return res.json({ success: true, word: recentWod.wordId, cooldown: false, hoursRemaining });
    }

    // ── Pick a new word ──────────────────────────────────────────────
    const masteredProgress = await UserWordProgress.find({
      userId,
      masteryStatus: "mastered",
    }).select("wordId");
    const masteredIds = masteredProgress.map((p) => p.wordId);

    let chosenWord = null;
    for (const band of [6, 7, 8, 9]) {
      const candidates = await Word.find({
        bandLevel: band,
        _id: { $nin: masteredIds },
      });
      if (candidates.length > 0) {
        chosenWord = pickRandom(candidates, 1)[0];
        break;
      }
    }

    if (!chosenWord) {
      return res.json({ success: true, word: null, allMastered: true });
    }

    // ── Record that this word was shown today ────────────────────────
    await UserWordProgress.findOneAndUpdate(
      { userId, wordId: chosenWord._id },
      {
        $set: {
          wordOfDayShownAt: new Date(),
          wordOfDayViewed: false,
          word: chosenWord.word,
        },
        $setOnInsert: { masteryStatus: "unseen" },
      },
      { upsert: true }
    );

    res.json({ success: true, word: chosenWord, cooldown: false });
  } catch (err) {
    console.error("getWordOfDay:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/vocab/word-of-day/viewed  — mark WoD as viewed, hide for 24h
// ─────────────────────────────────────────────
exports.markWordOfDayViewed = async (req, res) => {
  try {
    const userId = req.user._id;
    const { wordId } = req.body;

    await UserWordProgress.findOneAndUpdate(
      { userId, wordId },
      { $set: { wordOfDayViewed: true, wordOfDayShownAt: new Date(), word: req.body.word } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("markWordOfDayViewed:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// GET /api/vocab/quiz/generate
// Quiz rules:
//   - 1 MCQ per word seen TODAY (mandatory, guaranteed)
//   - 2 MCQ from random seen pool (excluding today's words)
//   - 1 Written question: topic-based (from today's seen words' topics)
//     NO specific word given — user writes freely about the topic
//   - If no words seen today → fallback: all 3 MCQs from random seen pool
//   - If nothing seen at all → fallback: random words from DB
// ─────────────────────────────────────────────
exports.generateQuiz = async (req, res) => {
  try {
    const userId = req.user._id;

    // ── Step 1: Get words seen TODAY ───────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayProgress = await UserWordProgress.find({
      userId,
      lastReviewedDate: { $gte: todayStart },
      seenCount: { $gte: 1 },
    }).select("wordId");

    const todayWordIds = todayProgress.map((p) => p.wordId);

    // ── Step 2: Get ALL seen words (for random pool) ────────
    const allSeenProgress = await UserWordProgress.find({
      userId,
      seenCount: { $gte: 1 },
    }).select("wordId");

    const allSeenIds = allSeenProgress.map((p) => p.wordId);

    // ── Step 3: Fetch today's word documents ───────────────
    let todayWords = [];
    if (todayWordIds.length > 0) {
      todayWords = await Word.find({ _id: { $in: todayWordIds } });
    }

    // ── Step 4: Fetch random pool (seen but NOT today) ──────
    const randomPoolIds = allSeenIds.filter(
      (id) => !todayWordIds.map(String).includes(String(id))
    );
    let randomPoolWords = await Word.find({ _id: { $in: randomPoolIds } });

    // ── Step 5: Handle fallback if nothing seen today ───────
    // If no today words → use all seen as random pool for 3 MCQs
    // If nothing seen at all → pick random words from DB
    let useFallback = false;
    if (todayWords.length === 0) {
      useFallback = true;
      if (allSeenIds.length === 0) {
        // Nothing seen at all — pick any 5 words from DB
        randomPoolWords = await Word.find({}).limit(10);
        randomPoolWords = pickRandom(randomPoolWords, Math.min(5, randomPoolWords.length));
      } else {
        randomPoolWords = await Word.find({ _id: { $in: allSeenIds } });
      }
    }

    if (todayWords.length === 0 && randomPoolWords.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No words available. Please view some flashcards first.",
      });
    }

   
    const allWords = await Word.find({});

  
 
    const todayMcqWords = todayWords; 
    const randomMcqWords = pickRandom(randomPoolWords, 2);

   
    const mcqWords = useFallback
      ? pickRandom(randomPoolWords, Math.min(3, randomPoolWords.length))
      : [...todayMcqWords, ...randomMcqWords];

    // ── Step 8: Pick written question topic from today's words
    let writtenTopic = "Academic"; // default
    if (todayWords.length > 0) {
      const allTodayTopics = todayWords.flatMap((w) => w.topics || []);
      if (allTodayTopics.length > 0) {
        writtenTopic = pickRandom(allTodayTopics, 1)[0];
      }
    } else if (randomPoolWords.length > 0) {
      const allPoolTopics = randomPoolWords.flatMap((w) => w.topics || []);
      if (allPoolTopics.length > 0) {
        writtenTopic = pickRandom(allPoolTopics, 1)[0];
      }
    }

    // ── Step 9: Build questions ──────────────────────────────
    const sessionId = uuidv4();
    const questions = [];
    const mcqTypes = ["meaning_mcq", "collocation_mcq", "fill_blank_mcq"];

    mcqWords.forEach((targetWord, idx) => {
      const qType = mcqTypes[idx % 3];

      const distractors = pickRandom(
        allWords.filter((w) => String(w._id) !== String(targetWord._id)),
        3
      );

      let question = {};

      if (qType === "meaning_mcq") {
        const options = shuffle([
          { text: targetWord.meaning, correct: true },
          ...distractors.map((d) => ({ text: d.meaning, correct: false })),
        ]);
        question = {
          type: "meaning_mcq",
          wordId: targetWord._id,
          word: targetWord.word,
          seenToday: todayWordIds.map(String).includes(String(targetWord._id)),
          prompt: `What is the meaning of "${targetWord.word}"?`,
          options,
          correctAnswer: targetWord.meaning,
        };
      } else if (qType === "collocation_mcq") {
        const correctColl = targetWord.collocations?.[0] || `use ${targetWord.word}`;
        const options = shuffle([
          { text: correctColl, correct: true },
          ...distractors.map((d) => ({ text: d.collocations?.[0] || `use ${d.word}`, correct: false })),
        ]);
        question = {
          type: "collocation_mcq",
          wordId: targetWord._id,
          word: targetWord.word,
          seenToday: todayWordIds.map(String).includes(String(targetWord._id)),
          prompt: `Which collocation is correct for "${targetWord.word}"?`,
          options,
          correctAnswer: correctColl,
        };
      } else {
        const blank = targetWord.exampleSentence.replace(
          new RegExp(targetWord.word, "gi"), "_____"
        );
        const options = shuffle([
          { text: targetWord.word, correct: true },
          ...distractors.map((d) => ({ text: d.word, correct: false })),
        ]);
        question = {
          type: "fill_blank_mcq",
          wordId: targetWord._id,
          word: targetWord.word,
          seenToday: todayWordIds.map(String).includes(String(targetWord._id)),
          prompt: `Fill in the blank: "${blank}"`,
          options,
          correctAnswer: targetWord.word,
        };
      }

      questions.push(question);
    });

    // ── Step 10: Written question — topic based, no word given ─
    // Pick a representative word from today's seen words for scoring reference
    const writtenRefWords = todayWords.length > 0 ? todayWords : randomPoolWords;
    const writtenRefWord = pickRandom(writtenRefWords, 1)[0];

    questions.push({
      type: "written",
      wordId: writtenRefWord._id,
      word: writtenRefWord.word,       // used internally for scoring only
      topic: writtenTopic,
      // NO meaning shown to user — topic-based challenge
      prompt: `Write a short paragraph (max 30 words) on the topic: "${writtenTopic}". Use varied vocabulary and correct grammar to demonstrate your IELTS writing skills.`,
      correctAnswer: writtenRefWord.exampleSentence,
    });

    res.json({
      success: true,
      sessionId,
      todayWordsCount: todayWords.length,
      questions,
    });
  } catch (err) {
    console.error("generateQuiz:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────────
// POST /api/vocab/quiz/submit
// Body: { sessionId, bandLevel, topics, answers: [{wordId, type, userAnswer, correctAnswer, isCorrect}] }
// ─────────────────────────────────────────────
exports.submitQuiz = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId, bandLevel, topics, answers } = req.body;

    if (!sessionId || !bandLevel || !answers || answers.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    let mcqCorrect = 0;
    let mcqTotal = 0;
    let writtenScore = 0;
    let writtenBand = 5;
    let writtenEval = null;
    const questionResults = [];

    for (const answer of answers) {
      if (answer.type === "written") {
        // ── GPT evaluation for written answer ──────────────
        const writtenWord = await Word.findById(answer.wordId);
        let aiResult = { bandScore: 5, marks: 2, feedback: "Answer evaluated.", lowBandWords: [], suggestions: [] };

        try {
          const prompt = `You are an IELTS examiner. A student was asked to write a short paragraph on the topic: "${answer.topic || "Academic"}".

Student response: "${answer.userAnswer}"

Evaluate strictly based on IELTS criteria:
- Vocabulary range and accuracy
- Grammar structures and accuracy
- Relevance to the topic

Return ONLY valid JSON (no markdown, no extra text):
{
  "bandScore": <number 4-9>,
  "marks": <number 0-4>,
  "feedback": "<max 60 words: what they did well, what was weak, one specific tip>",
  "lowBandWords": ["<basic word used that could be improved>"],
  "suggestions": ["<stronger replacement 1>", "<stronger replacement 2>"]
}`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.3,
          });

          const raw = completion.choices[0].message.content.trim();
          const cleaned = raw.replace(/```json|```/g, "").trim();
          aiResult = JSON.parse(cleaned);
        } catch (aiErr) {
          console.error("GPT eval error:", aiErr.message);
        }

        writtenScore = aiResult.marks || 0;
        writtenBand = aiResult.bandScore || 5;
        writtenEval = aiResult;

        questionResults.push({
          wordId: answer.wordId,
          word: answer.word,
          questionType: "written",
          isCorrect: aiResult.marks >= 3,
          userAnswer: answer.userAnswer,
          correctAnswer: answer.correctAnswer,
          aiEvaluation: {
            bandScore: aiResult.bandScore,
            marks: aiResult.marks,
            feedback: aiResult.feedback,
            lowBandWords: aiResult.lowBandWords || [],
            suggestions: aiResult.suggestions || [],
          },
        });

        // Update word progress for written
        await updateWordProgress(userId, answer.wordId, sessionId, "written", aiResult.marks >= 3);
      } else {
        // ── MCQ ────────────────────────────────────────────
        mcqTotal++;
        if (answer.isCorrect) mcqCorrect++;

        questionResults.push({
          wordId: answer.wordId,
          word: answer.word,
          questionType: answer.type,
          isCorrect: answer.isCorrect,
          userAnswer: answer.userAnswer,
          correctAnswer: answer.correctAnswer,
        });

        await updateWordProgress(userId, answer.wordId, sessionId, answer.type, answer.isCorrect);
      }
    }

    const quizBandScore = computeQuizBandScore(mcqCorrect, mcqTotal, writtenScore, writtenBand);

    // Save session
    await VocabQuizSession.create({
      userId,
      sessionId,
      bandLevel,
      topics: topics ? topics.split(",") : [],
      questions: questionResults,
      totalQuestions: answers.length,
      correctAnswers: mcqCorrect + (writtenScore >= 3 ? 1 : 0),
      mcqScore: mcqCorrect,
      writtenScore,
      writtenBand,
      quizBandScore,
    });

    // Auto-complete study plan task for vocabulary
    await autoCompleteTaskBySkill(userId, "vocabulary", sessionId);

    res.json({
      success: true,
      sessionId,
      mcqScore: mcqCorrect,
      mcqTotal,
      writtenScore,
      writtenBand,
      writtenEval,
      quizBandScore,
      questions: questionResults,
    });
  } catch (err) {
    console.error("submitQuiz:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/** Update UserWordProgress after a quiz attempt */
async function updateWordProgress(userId, wordId, sessionId, questionType, isCorrect) {
  try {
    let progress = await UserWordProgress.findOne({ userId, wordId });
    if (!progress) {
      const word = await Word.findById(wordId);
      progress = new UserWordProgress({
        userId,
        wordId,
        word: word?.word,
        masteryStatus: "learning",
        seenCount: 1,
      });
    }

    progress.attempts.push({ quizSessionId: sessionId, correct: isCorrect, questionType, attemptedAt: new Date() });
    progress.recalculateMastery();
    await progress.save();
  } catch (err) {
    console.error("updateWordProgress:", err);
  }
}

// ─────────────────────────────────────────────
// GET /api/vocab/progress  — full progress page data
// ─────────────────────────────────────────────
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    // Words learned (seen >= 1)
    const seenProgress = await UserWordProgress.find({
      userId,
      seenCount: { $gte: 1 },
    });
    const totalWordsSeen = seenProgress.length;
    const totalMastered = seenProgress.filter((p) => p.masteryStatus === "mastered").length;
    const avgAccuracy =
      seenProgress.length > 0
        ? Math.round(seenProgress.reduce((sum, p) => sum + p.accuracy, 0) / seenProgress.length)
        : 0;

    // Band-wise breakdown
    const bandCounts = await Word.aggregate([
      { $group: { _id: "$bandLevel", total: { $sum: 1 } } },
    ]);
    const bandMap = {};
    bandCounts.forEach((b) => (bandMap[b._id] = { total: b.total, mastered: 0, seen: 0 }));

    // Attach mastered/seen per band
    const progressWithWord = await UserWordProgress.find({ userId }).populate("wordId", "bandLevel");
    progressWithWord.forEach((p) => {
      const band = p.wordId?.bandLevel;
      if (!band || !bandMap[band]) return;
      if (p.seenCount >= 1) bandMap[band].seen++;
      if (p.masteryStatus === "mastered") bandMap[band].mastered++;
    });

    const bandBreakdown = Object.entries(bandMap).map(([band, data]) => ({
      band: parseInt(band),
      ...data,
      completionPct: data.total > 0 ? Math.round((data.mastered / data.total) * 100) : 0,
    })).sort((a, b) => a.band - b.band);

    // Recent quiz sessions (last 10)
    const recentSessions = await VocabQuizSession.find({ userId })
      .sort({ completedAt: -1 })
      .limit(10)
      .select("bandLevel quizBandScore mcqScore writtenScore completedAt totalQuestions correctAnswers");

    // Weekly word growth (last 6 weeks)
    const sixWeeksAgo = new Date();
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
    const weeklyData = await UserWordProgress.aggregate([
      { $match: { userId, lastReviewedDate: { $gte: sixWeeksAgo } } },
      {
        $group: {
          _id: {
            week: { $isoWeek: "$lastReviewedDate" },
            year: { $isoWeekYear: "$lastReviewedDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    // Word history table (difficult words first)
    const wordHistory = await UserWordProgress.find({ userId, seenCount: { $gte: 1 } })
      .populate("wordId", "word bandLevel")
      .sort({ accuracy: 1 })
      .limit(50);

    const wordHistoryFormatted = wordHistory.map((p) => ({
      word: p.wordId?.word || p.word,
      band: p.wordId?.bandLevel,
      attempts: p.attempts.length,
      accuracy: p.accuracy,
      status: p.masteryStatus,
      lastReview: p.lastReviewedDate,
    }));

    // Streak (consecutive days with activity)
    const streak = await calculateStreak(userId);

    res.json({
      success: true,
      summary: {
        totalWordsSeen,
        totalMastered,
        avgAccuracy,
        streak,
      },
      bandBreakdown,
      recentSessions,
      weeklyData,
      wordHistory: wordHistoryFormatted,
    });
  } catch (err) {
    console.error("getProgress:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

async function calculateStreak(userId) {
  const sessions = await VocabQuizSession.find({ userId })
    .sort({ completedAt: -1 })
    .select("completedAt");

  if (sessions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const activityDays = new Set(
    sessions.map((s) => {
      const d = new Date(s.completedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  while (activityDays.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// ─────────────────────────────────────────────
// GET /api/vocab/quiz/history?limit=5
// ─────────────────────────────────────────────
exports.getQuizHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const sessions = await VocabQuizSession.find({ userId })
      .sort({ completedAt: -1 })
      .limit(limit);

    res.json({ success: true, sessions });
  } catch (err) {
    console.error("getQuizHistory:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};