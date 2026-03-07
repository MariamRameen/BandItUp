/**
 * AI Service Module - OpenAI Integration for Writing Module
 * 
 * Handles all AI-related operations: essay evaluation, task generation,
 * grammar analysis, and vocabulary suggestions.
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

module.exports = {
  // Main dispatchers
  evaluateWriting,
  generateWritingTask,
  
  // Specific evaluation functions
  evaluateWritingTask2,
  evaluateWritingTask1Academic,
  evaluateWritingTask1General,
  
  // Specific generation functions
  generateWritingTask2,
  generateWritingTask1Academic,
  generateWritingTask1General,
  
  // Analysis functions
  analyzeGrammar,
  analyzeVocabulary,
};
