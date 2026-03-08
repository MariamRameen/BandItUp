/**
 * AI Service Module - OpenAI Integration for Writing and Reading Modules
 * 
 * Handles all AI-related operations: essay evaluation, task generation,
 * grammar analysis, vocabulary suggestions, and reading passage/question generation.
 */

const OpenAI = require('openai');
const {
  WRITING_TASK2_EVALUATION_PROMPT,
  WRITING_TASK1_ACADEMIC_EVALUATION_PROMPT,
  WRITING_TASK1_GENERAL_EVALUATION_PROMPT,
  WRITING_TASK2_GENERATION_PROMPT,
  WRITING_TASK1_ACADEMIC_GENERATION_PROMPT,
  WRITING_TASK1_GENERAL_GENERATION_PROMPT,
  GRAMMAR_ANALYSIS_PROMPT,
  VOCABULARY_ANALYSIS_PROMPT,
} = require('./prompts/writingPrompts');

const {
  READING_PASSAGE_GENERATION_PROMPT,
  READING_QUESTIONS_GENERATION_PROMPT,
  READING_FEEDBACK_PROMPT,
  getRandomTopic,
  getQuestionTypesForDifficulty,
} = require('./prompts/readingPrompts');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
const MODELS = {
  EVALUATION: 'gpt-4o-mini', // Cost-effective for evaluation
  GENERATION: 'gpt-4o-mini', // For task generation
  ANALYSIS: 'gpt-4o-mini',   // For grammar/vocab analysis
};

// Temperature settings
const TEMPERATURE = {
  EVALUATION: 0.3, // Lower for consistent scoring
  GENERATION: 0.7, // Higher for creative task generation
  ANALYSIS: 0.2,   // Low for accurate grammar detection
};

/**
 * Helper function to fill prompt template with values
 * @param {string} template - Prompt template with {placeholders}
 * @param {object} values - Key-value pairs to fill placeholders
 * @returns {string} - Filled prompt
 */
const fillPromptTemplate = (template, values) => {
  let filled = template;
  for (const [key, value] of Object.entries(values)) {
    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    filled = filled.replace(placeholder, value || '');
  }
  return filled;
};

/**
 * Parse JSON response from OpenAI, handling markdown code blocks
 * @param {string} content - Raw response content
 * @returns {object} - Parsed JSON object
 */
const parseJSONResponse = (content) => {
  // Remove markdown code blocks if present
  let cleaned = content.trim();
  
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  return JSON.parse(cleaned.trim());
};

/**
 * Evaluate a Writing Task 2 essay
 * @param {object} params - Evaluation parameters
 * @param {string} params.taskPrompt - The essay prompt/question
 * @param {string} params.essay - The candidate's essay
 * @param {string} params.essayType - Type: opinion, discussion, problem-solution, etc.
 * @returns {Promise<object>} - Evaluation result with bands and feedback
 */
const evaluateWritingTask2 = async ({ taskPrompt, essay, essayType }) => {
  const wordCount = essay.trim().split(/\s+/).length;
  
  const prompt = fillPromptTemplate(WRITING_TASK2_EVALUATION_PROMPT, {
    taskPrompt,
    essay,
    essayType: essayType || 'Not specified',
    wordCount: wordCount.toString(),
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.EVALUATION,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS examiner. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.EVALUATION,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const evaluation = parseJSONResponse(content);

    return {
      success: true,
      evaluation,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.EVALUATION,
      },
    };
  } catch (error) {
    console.error('Error evaluating Task 2 essay:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Evaluate a Writing Task 1 Academic report
 * @param {object} params - Evaluation parameters
 * @param {string} params.taskPrompt - The task prompt
 * @param {string} params.essay - The candidate's report
 * @param {string} params.visualDescription - Description of the visual data
 * @returns {Promise<object>} - Evaluation result
 */
const evaluateWritingTask1Academic = async ({ taskPrompt, essay, visualDescription }) => {
  const wordCount = essay.trim().split(/\s+/).length;
  
  const prompt = fillPromptTemplate(WRITING_TASK1_ACADEMIC_EVALUATION_PROMPT, {
    taskPrompt,
    essay,
    visualDescription: visualDescription || 'See task prompt',
    wordCount: wordCount.toString(),
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.EVALUATION,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS examiner. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.EVALUATION,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const evaluation = parseJSONResponse(content);

    return {
      success: true,
      evaluation,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.EVALUATION,
      },
    };
  } catch (error) {
    console.error('Error evaluating Task 1 Academic:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Evaluate a Writing Task 1 General Training letter
 * @param {object} params - Evaluation parameters
 * @param {string} params.taskPrompt - The task prompt
 * @param {string} params.essay - The candidate's letter
 * @param {string} params.letterType - formal, semi-formal, informal
 * @returns {Promise<object>} - Evaluation result
 */
const evaluateWritingTask1General = async ({ taskPrompt, essay, letterType }) => {
  const wordCount = essay.trim().split(/\s+/).length;
  
  const prompt = fillPromptTemplate(WRITING_TASK1_GENERAL_EVALUATION_PROMPT, {
    taskPrompt,
    essay,
    letterType: letterType || 'Not specified',
    wordCount: wordCount.toString(),
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.EVALUATION,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS examiner. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.EVALUATION,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const evaluation = parseJSONResponse(content);

    return {
      success: true,
      evaluation,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.EVALUATION,
      },
    };
  } catch (error) {
    console.error('Error evaluating Task 1 General:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate a new Writing Task 2 question
 * @param {object} params - Generation parameters
 * @param {string} params.examType - Academic or General
 * @param {string} params.topic - Topic category (optional)
 * @param {string} params.essayType - Essay type (optional)
 * @returns {Promise<object>} - Generated task
 */
const generateWritingTask2 = async ({ examType = 'Academic', topic = 'random', essayType = '' }) => {
  const prompt = fillPromptTemplate(WRITING_TASK2_GENERATION_PROMPT, {
    examType,
    topic: topic === 'random' ? 'any topic' : topic,
    essayType: essayType || 'any type',
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.GENERATION,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS task writer. Generate authentic, exam-quality tasks. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.GENERATION,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const task = parseJSONResponse(content);

    return {
      success: true,
      task,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.GENERATION,
      },
    };
  } catch (error) {
    console.error('Error generating Task 2:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate a new Writing Task 1 Academic question
 * @param {object} params - Generation parameters
 * @param {string} params.chartType - Type of visual (line, bar, pie, table, process, map)
 * @param {string} params.topic - Topic (optional)
 * @returns {Promise<object>} - Generated task with visual description
 */
const generateWritingTask1Academic = async ({ chartType = 'random', topic = 'random' }) => {
  const chartTypes = ['line graph', 'bar chart', 'pie chart', 'table', 'process diagram', 'map'];
  const selectedChart = chartType === 'random' 
    ? chartTypes[Math.floor(Math.random() * chartTypes.length)]
    : chartType;

  const prompt = fillPromptTemplate(WRITING_TASK1_ACADEMIC_GENERATION_PROMPT, {
    chartType: selectedChart,
    topic: topic === 'random' ? 'any topic' : topic,
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.GENERATION,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS task writer. Generate authentic, exam-quality tasks with realistic data. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.GENERATION,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const task = parseJSONResponse(content);

    return {
      success: true,
      task,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.GENERATION,
      },
    };
  } catch (error) {
    console.error('Error generating Task 1 Academic:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate a new Writing Task 1 General Training letter question
 * @param {object} params - Generation parameters
 * @param {string} params.letterType - formal, semi-formal, informal
 * @param {string} params.situation - Situation type (optional)
 * @returns {Promise<object>} - Generated task
 */
const generateWritingTask1General = async ({ letterType = 'random', situation = 'random' }) => {
  const letterTypes = ['formal', 'semi-formal', 'informal'];
  const selectedType = letterType === 'random'
    ? letterTypes[Math.floor(Math.random() * letterTypes.length)]
    : letterType;

  const prompt = fillPromptTemplate(WRITING_TASK1_GENERAL_GENERATION_PROMPT, {
    letterType: selectedType,
    situation: situation === 'random' ? 'any situation' : situation,
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.GENERATION,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS task writer. Generate authentic, exam-quality letter tasks. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.GENERATION,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;
    const task = parseJSONResponse(content);

    return {
      success: true,
      task,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.GENERATION,
      },
    };
  } catch (error) {
    console.error('Error generating Task 1 General:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Analyze text for grammar errors
 * @param {string} text - Text to analyze
 * @returns {Promise<object>} - Grammar analysis result
 */
const analyzeGrammar = async (text) => {
  const prompt = fillPromptTemplate(GRAMMAR_ANALYSIS_PROMPT, {
    text,
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.ANALYSIS,
      messages: [
        {
          role: 'system',
          content: 'You are an expert English grammar teacher. Identify grammar errors precisely. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.ANALYSIS,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const analysis = parseJSONResponse(content);

    return {
      success: true,
      analysis,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.ANALYSIS,
      },
    };
  } catch (error) {
    console.error('Error analyzing grammar:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Analyze vocabulary and suggest upgrades
 * @param {string} text - Text to analyze
 * @param {number} targetBand - Target IELTS band (default: 7)
 * @returns {Promise<object>} - Vocabulary analysis result
 */
const analyzeVocabulary = async (text, targetBand = 7) => {
  const prompt = fillPromptTemplate(VOCABULARY_ANALYSIS_PROMPT, {
    text,
    targetBand: targetBand.toString(),
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.ANALYSIS,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS vocabulary coach. Suggest vocabulary improvements. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.ANALYSIS,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const analysis = parseJSONResponse(content);

    return {
      success: true,
      analysis,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.ANALYSIS,
      },
    };
  } catch (error) {
    console.error('Error analyzing vocabulary:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Main evaluation dispatcher - routes to correct evaluation function
 * @param {object} params - Evaluation parameters
 * @param {number} params.taskType - 1 or 2
 * @param {string} params.examType - Academic or General
 * @param {string} params.taskPrompt - The task prompt
 * @param {string} params.essay - The candidate's response
 * @param {object} params.metadata - Additional metadata (letterType, essayType, etc.)
 * @returns {Promise<object>} - Evaluation result
 */
const evaluateWriting = async ({ taskType, examType, taskPrompt, essay, metadata = {} }) => {
  if (taskType === 2) {
    return evaluateWritingTask2({
      taskPrompt,
      essay,
      essayType: metadata.essayType,
    });
  } else if (taskType === 1) {
    if (examType === 'Academic') {
      return evaluateWritingTask1Academic({
        taskPrompt,
        essay,
        visualDescription: metadata.visualDescription,
      });
    } else {
      return evaluateWritingTask1General({
        taskPrompt,
        essay,
        letterType: metadata.letterType,
      });
    }
  }
  
  return {
    success: false,
    error: 'Invalid task type. Must be 1 or 2.',
  };
};

/**
 * Main task generation dispatcher
 * @param {object} params - Generation parameters
 * @param {number} params.taskType - 1 or 2
 * @param {string} params.examType - Academic or General
 * @param {object} params.options - Additional options
 * @returns {Promise<object>} - Generated task
 */
const generateWritingTask = async ({ taskType, examType, options = {} }) => {
  if (taskType === 2) {
    return generateWritingTask2({
      examType,
      topic: options.topic,
      essayType: options.essayType,
    });
  } else if (taskType === 1) {
    if (examType === 'Academic') {
      return generateWritingTask1Academic({
        chartType: options.chartType,
        topic: options.topic,
      });
    } else {
      return generateWritingTask1General({
        letterType: options.letterType,
        situation: options.situation,
      });
    }
  }
  
  return {
    success: false,
    error: 'Invalid task type. Must be 1 or 2.',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// READING MODULE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a reading passage
 * @param {object} params - Generation parameters
 * @param {string} params.examType - 'Academic' or 'General'
 * @param {string} params.topic - Topic for the passage (optional, random if not provided)
 * @param {string} params.difficulty - Target difficulty band
 * @param {number} params.wordCount - Target word count (default 700)
 * @returns {Promise<object>} - Generated passage
 */
const generateReadingPassage = async ({ examType, topic, difficulty, wordCount = 700 }) => {
  const actualTopic = topic || getRandomTopic(examType);
  
  const prompt = fillPromptTemplate(READING_PASSAGE_GENERATION_PROMPT, {
    examType,
    topic: actualTopic,
    difficulty,
    wordCount: wordCount.toString(),
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.GENERATION,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS content creator. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.GENERATION,
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content;
    const passage = parseJSONResponse(content);

    // Construct full content from paragraphs
    passage.content = passage.paragraphs.map(p => p.text).join('\n\n');

    return {
      success: true,
      passage,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.GENERATION,
      },
    };
  } catch (error) {
    console.error('Error generating reading passage:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate questions for a reading passage
 * @param {object} params - Generation parameters
 * @param {object} params.passage - The reading passage object
 * @param {string[]} params.questionTypes - Array of question types to include
 * @param {number} params.questionCount - Number of questions to generate (default 13)
 * @param {string} params.difficulty - Target difficulty
 * @returns {Promise<object>} - Generated questions
 */
const generateReadingQuestions = async ({ passage, questionTypes, questionCount = 13, difficulty }) => {
  // Format passage for prompt
  const passageText = passage.paragraphs
    .map(p => `[Paragraph ${p.id}]\n${p.text}`)
    .join('\n\n');

  const prompt = fillPromptTemplate(READING_QUESTIONS_GENERATION_PROMPT, {
    passage: `Title: ${passage.title}\n\n${passageText}`,
    questionTypes: questionTypes.join(', '),
    questionCount: questionCount.toString(),
    difficulty,
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.GENERATION,
      messages: [
        {
          role: 'system',
          content: 'You are an expert IELTS examiner. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.GENERATION,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    const result = parseJSONResponse(content);

    return {
      success: true,
      questions: result.questions,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.GENERATION,
      },
    };
  } catch (error) {
    console.error('Error generating reading questions:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate a complete reading test (passage + questions)
 * @param {object} params - Generation parameters
 * @param {string} params.examType - 'Academic' or 'General'
 * @param {string} params.topic - Topic (optional)
 * @param {string} params.difficulty - Target difficulty band
 * @param {number} params.questionCount - Number of questions (default 13)
 * @returns {Promise<object>} - Complete reading test
 */
const generateReadingTest = async ({ examType, topic, difficulty, questionCount = 13 }) => {
  // Step 1: Generate passage
  const passageResult = await generateReadingPassage({
    examType,
    topic,
    difficulty,
    wordCount: 700,
  });

  if (!passageResult.success) {
    return passageResult;
  }

  // Step 2: Determine question types based on difficulty
  const questionTypes = getQuestionTypesForDifficulty(difficulty);

  // Step 3: Generate questions
  const questionsResult = await generateReadingQuestions({
    passage: passageResult.passage,
    questionTypes,
    questionCount,
    difficulty,
  });

  if (!questionsResult.success) {
    return questionsResult;
  }

  // Combine usage stats
  const totalUsage = {
    promptTokens: passageResult.usage.promptTokens + questionsResult.usage.promptTokens,
    completionTokens: passageResult.usage.completionTokens + questionsResult.usage.completionTokens,
    totalTokens: passageResult.usage.totalTokens + questionsResult.usage.totalTokens,
    model: MODELS.GENERATION,
  };

  return {
    success: true,
    passage: passageResult.passage,
    questions: questionsResult.questions,
    usage: totalUsage,
  };
};

/**
 * Generate feedback for a completed reading session
 * @param {object} params - Session data
 * @param {number} params.totalQuestions - Total questions
 * @param {number} params.correctAnswers - Number correct
 * @param {number} params.score - Percentage score
 * @param {number} params.bandScore - IELTS band score
 * @param {number} params.timeSpent - Time spent in seconds
 * @param {number} params.timeLimit - Time limit in seconds
 * @param {object[]} params.questionTypeAnalysis - Performance by question type
 * @param {object[]} params.questions - All questions with user answers
 * @returns {Promise<object>} - AI-generated feedback
 */
const generateReadingFeedback = async ({
  totalQuestions,
  correctAnswers,
  score,
  bandScore,
  timeSpent,
  timeLimit,
  questionTypeAnalysis,
  questions,
}) => {
  // Format question type analysis
  const typeAnalysisText = questionTypeAnalysis
    .map(t => `- ${t.type}: ${t.correct}/${t.attempted} correct (${t.accuracy}% accuracy)`)
    .join('\n');

  // Format detailed results (just wrong answers for brevity)
  const wrongAnswers = questions.filter(q => q.isCorrect === false);
  const detailedResultsText = wrongAnswers.slice(0, 5).map(q => 
    `Q${q.id}: Type=${q.type}, User="${q.userAnswer}", Correct="${q.correctAnswer}"`
  ).join('\n');

  const prompt = fillPromptTemplate(READING_FEEDBACK_PROMPT, {
    totalQuestions: totalQuestions.toString(),
    correctAnswers: correctAnswers.toString(),
    score: score.toString(),
    bandScore: bandScore.toString(),
    timeSpent: Math.round(timeSpent / 60).toString(),
    timeLimit: Math.round(timeLimit / 60).toString(),
    questionTypeAnalysis: typeAnalysisText || 'No data available',
    detailedResults: detailedResultsText || 'All answers were correct!',
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.EVALUATION,
      messages: [
        {
          role: 'system',
          content: 'You are an encouraging IELTS tutor. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: TEMPERATURE.EVALUATION,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    const feedback = parseJSONResponse(content);

    return {
      success: true,
      feedback: {
        ...feedback,
        questionTypeAnalysis,
      },
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        model: MODELS.EVALUATION,
      },
    };
  } catch (error) {
    console.error('Error generating reading feedback:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  // Writing - Main dispatchers
  evaluateWriting,
  generateWritingTask,
  
  // Writing - Specific evaluation functions
  evaluateWritingTask2,
  evaluateWritingTask1Academic,
  evaluateWritingTask1General,
  
  // Writing - Specific generation functions
  generateWritingTask2,
  generateWritingTask1Academic,
  generateWritingTask1General,
  
  // Writing - Analysis functions
  analyzeGrammar,
  analyzeVocabulary,
  
  // Reading functions
  generateReadingPassage,
  generateReadingQuestions,
  generateReadingTest,
  generateReadingFeedback,
};
