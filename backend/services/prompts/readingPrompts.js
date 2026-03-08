/**
 * Reading Module Prompt Templates
 * IELTS Reading passage generation and question creation prompts
 */

// ─── PASSAGE GENERATION PROMPT ─────────────────────────────────────────────────

const READING_PASSAGE_GENERATION_PROMPT = `You are an expert IELTS examiner and content creator. Generate an IELTS-style reading passage.

## Requirements:
- Exam Type: {examType}
- Topic: {topic}
- Target Difficulty: {difficulty}
- Word Count: Approximately {wordCount} words

## Passage Guidelines for {examType}:
${'{examType}' === 'Academic' ? `
- Use formal academic register
- Include technical vocabulary appropriate for the topic
- Present complex arguments and multiple perspectives
- Include data, research findings, or expert opinions
- Structure with clear paragraphs (A, B, C, D, etc.)
- Topics: science, technology, medicine, history, psychology, economics, environment
` : `
- Use semi-formal to formal register
- Focus on practical, everyday topics
- Include clear factual information
- May include instructions, descriptions, or explanations
- Topics: workplace, travel, consumer info, public services, housing
`}

## Difficulty Guidelines for {difficulty}:
- Band 5-6: Simpler vocabulary, shorter sentences, clearer structure
- Band 6-7: Moderate complexity, some specialized terms, clear argument flow
- Band 7-8: Complex vocabulary, varied sentence structures, nuanced arguments
- Band 8-9: Sophisticated language, complex ideas, implicit meanings

## Output Format (JSON):
{
  "title": "<engaging, relevant title>",
  "topic": "{topic}",
  "paragraphs": [
    {
      "id": "A",
      "text": "<first paragraph text>"
    },
    {
      "id": "B", 
      "text": "<second paragraph text>"
    },
    {
      "id": "C",
      "text": "<third paragraph text>"
    },
    {
      "id": "D",
      "text": "<fourth paragraph text>"
    },
    {
      "id": "E",
      "text": "<fifth paragraph text (if needed)>"
    }
  ],
  "wordCount": <actual word count>
}

Generate a coherent, engaging passage with 4-6 paragraphs. Each paragraph should be 100-200 words.
Ensure the passage has enough detail to support 10-14 questions of various types.`;

// ─── QUESTION GENERATION PROMPT ────────────────────────────────────────────────

const READING_QUESTIONS_GENERATION_PROMPT = `You are an expert IELTS examiner. Generate reading comprehension questions for the following passage.

## Passage:
{passage}

## Requirements:
- Generate {questionCount} questions total
- Include these question types: {questionTypes}
- Difficulty: {difficulty}

## Question Type Specifications:

### Multiple Choice (single answer):
- 4 options (A, B, C, D)
- One clearly correct answer
- Distractors should be plausible but wrong
- correctAnswer should be JUST the letter: "B"

### True/False/Not Given:
- Statement about factual information
- TRUE = matches passage exactly
- FALSE = contradicts passage
- NOT GIVEN = not mentioned in passage
- correctAnswer: "True", "False", or "Not Given"

### Yes/No/Not Given:
- Statement about writer's opinion/claim
- YES = writer agrees
- NO = writer disagrees
- NOT GIVEN = opinion not stated
- correctAnswer: "Yes", "No", or "Not Given"

### Matching Headings:
- Generate ONE question per paragraph to match
- Each question asks "Which heading best matches paragraph X?"
- Provide the same list of headings as options for each
- correctAnswer should be the heading letter: "C"

### Matching Information:
- Generate ONE question per piece of information
- Each question asks "Which paragraph contains [information]?"
- Options should be paragraph letters: ["A", "B", "C", "D"]
- correctAnswer should be the paragraph letter: "B"

### Sentence Completion:
- Complete sentence using words from passage
- Specify word limit (e.g., "NO MORE THAN THREE WORDS")
- Answer must be exact words from passage
- correctAnswer should be the exact fill-in words

### Short Answer:
- Answer with words from passage
- Specify word limit
- Clear, specific questions
- correctAnswer: exact words, but comparison will be flexible

### Summary Completion:
- ONE question per blank to fill
- Each question specifies which blank in the summary
- correctAnswer should be the word(s) for that ONE blank

## Output Format (JSON):
{
  "questions": [
    {
      "id": "q1",
      "type": "<question_type>",
      "questionText": "<the question or statement>",
      "instruction": "<specific instruction, e.g., 'Choose ONE answer'>",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "correctAnswer": "<correct answer or array for multiple>",
      "paragraphRef": "<paragraph ID where answer is found, e.g., 'B'>",
      "explanation": "<brief explanation of why this is correct>"
    }
  ]
}

## Important:
- All answers must be clearly supported by the passage
- Provide paragraph references for each question
- Explanations should cite specific passage text
- For completion questions, answers must be EXACT words from passage
- Question difficulty should match target band

Generate varied, well-crafted questions that test different reading skills.`;

// ─── FEEDBACK GENERATION PROMPT ────────────────────────────────────────────────

const READING_FEEDBACK_PROMPT = `You are an expert IELTS tutor. Analyze the student's reading test performance and provide detailed feedback.

## Test Summary:
- Total Questions: {totalQuestions}
- Correct Answers: {correctAnswers}
- Score: {score}%
- Band Score: {bandScore}
- Time Spent: {timeSpent} minutes
- Time Limit: {timeLimit} minutes

## Question Type Performance:
{questionTypeAnalysis}

## Detailed Results:
{detailedResults}

## Task:
Provide comprehensive, encouraging feedback that helps the student improve.

## Output Format (JSON):
{
  "overallFeedback": "<2-3 sentences summarizing performance, what went well, and areas to focus on>",
  "strengths": [
    "<specific strength with example from their performance>",
    "<another strength>"
  ],
  "areasToImprove": [
    "<specific area to improve with actionable advice>",
    "<another area to improve>"
  ],
  "studyTips": [
    "<specific practice activity or strategy>",
    "<another recommendation>",
    "<another recommendation>"
  ]
}

## Guidelines:
- Be encouraging but honest
- Cite specific question types where they excelled or struggled
- Provide actionable, practical advice
- If they ran out of time, address time management
- Recommend specific strategies for their weak question types`;

// ─── QUESTION TYPE INSTRUCTIONS ────────────────────────────────────────────────

const QUESTION_TYPE_INSTRUCTIONS = {
  multiple_choice: {
    instruction: 'Choose the correct letter, A, B, C or D.',
    description: 'Select one answer from four options',
  },
  multiple_choice_multiple: {
    instruction: 'Choose TWO letters, A-E.',
    description: 'Select multiple correct answers',
  },
  true_false_not_given: {
    instruction: 'Do the following statements agree with the information given in the passage? Write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.',
    description: 'Determine if statements match passage facts',
  },
  yes_no_not_given: {
    instruction: "Do the following statements agree with the views of the writer? Write YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.",
    description: "Determine if statements match writer's opinions",
  },
  matching_headings: {
    instruction: 'Choose the correct heading for each paragraph from the list of headings below.',
    description: 'Match headings to paragraphs',
  },
  matching_information: {
    instruction: 'Which paragraph contains the following information?',
    description: 'Match information to paragraphs',
  },
  matching_features: {
    instruction: 'Match each statement with the correct person/category.',
    description: 'Match items to categories',
  },
  matching_sentence_endings: {
    instruction: 'Complete each sentence with the correct ending, A-G.',
    description: 'Match sentence beginnings with endings',
  },
  sentence_completion: {
    instruction: 'Complete the sentences below. Choose NO MORE THAN {wordLimit} WORDS from the passage for each answer.',
    description: 'Fill in blanks with passage words',
  },
  summary_completion: {
    instruction: 'Complete the summary below. Choose NO MORE THAN {wordLimit} WORDS from the passage for each answer.',
    description: 'Complete a passage summary',
  },
  note_completion: {
    instruction: 'Complete the notes below. Choose NO MORE THAN {wordLimit} WORDS from the passage for each answer.',
    description: 'Fill in notes/bullet points',
  },
  table_completion: {
    instruction: 'Complete the table below. Choose NO MORE THAN {wordLimit} WORDS from the passage for each answer.',
    description: 'Fill in table cells',
  },
  short_answer: {
    instruction: 'Answer the questions below. Choose NO MORE THAN {wordLimit} WORDS from the passage for each answer.',
    description: 'Short answer questions',
  },
};

// ─── TOPIC LISTS ───────────────────────────────────────────────────────────────

const ACADEMIC_TOPICS = [
  'Climate Change and Environmental Science',
  'Artificial Intelligence and Machine Learning',
  'Space Exploration and Astronomy',
  'Medical Research and Healthcare',
  'Archaeology and Ancient Civilizations',
  'Psychology and Human Behavior',
  'Economics and Global Trade',
  'Education Systems Worldwide',
  'Marine Biology and Ocean Conservation',
  'Renewable Energy Technologies',
  'Urban Planning and Architecture',
  'Linguistics and Language Evolution',
  'Neuroscience and the Brain',
  'Biotechnology and Genetics',
  'Social Media and Society',
];

const GENERAL_TOPICS = [
  'Travel and Tourism',
  'Workplace Safety',
  'Consumer Rights',
  'Public Transportation',
  'Health and Fitness',
  'Housing and Property',
  'Entertainment and Leisure',
  'Banking and Finance',
  'Environmental Awareness',
  'Community Services',
];

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Fill template placeholders with values
 * @param {string} template - Template string with {placeholders}
 * @param {object} values - Key-value pairs for replacement
 * @returns {string} - Filled template
 */
const fillPromptTemplate = (template, values) => {
  let result = template;
  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
};

/**
 * Get random topic based on exam type
 * @param {string} examType - 'Academic' or 'General'
 * @returns {string} - Random topic
 */
const getRandomTopic = (examType) => {
  const topics = examType === 'Academic' ? ACADEMIC_TOPICS : GENERAL_TOPICS;
  return topics[Math.floor(Math.random() * topics.length)];
};

/**
 * Get question type instruction
 * @param {string} type - Question type
 * @param {number} wordLimit - Word limit for completion questions
 * @returns {string} - Instruction text
 */
const getQuestionInstruction = (type, wordLimit = 3) => {
  const typeInfo = QUESTION_TYPE_INSTRUCTIONS[type];
  if (!typeInfo) return '';
  return typeInfo.instruction.replace('{wordLimit}', wordLimit.toString());
};

/**
 * Get recommended question types for difficulty
 * @param {string} difficulty - Target difficulty band
 * @returns {string[]} - Array of question types
 */
const getQuestionTypesForDifficulty = (difficulty) => {
  const easyTypes = ['multiple_choice', 'true_false_not_given', 'sentence_completion'];
  const mediumTypes = ['matching_information', 'summary_completion', 'short_answer'];
  const hardTypes = ['matching_headings', 'yes_no_not_given', 'matching_sentence_endings'];
  
  switch (difficulty) {
    case 'Band 5-6':
      return [...easyTypes];
    case 'Band 6-7':
      return [...easyTypes, ...mediumTypes.slice(0, 1)];
    case 'Band 7-8':
      return [...easyTypes.slice(0, 1), ...mediumTypes, ...hardTypes.slice(0, 1)];
    case 'Band 8-9':
      return [...mediumTypes, ...hardTypes];
    default:
      return [...easyTypes, ...mediumTypes.slice(0, 1)];
  }
};

module.exports = {
  READING_PASSAGE_GENERATION_PROMPT,
  READING_QUESTIONS_GENERATION_PROMPT,
  READING_FEEDBACK_PROMPT,
  QUESTION_TYPE_INSTRUCTIONS,
  ACADEMIC_TOPICS,
  GENERAL_TOPICS,
  fillPromptTemplate,
  getRandomTopic,
  getQuestionInstruction,
  getQuestionTypesForDifficulty,
};
