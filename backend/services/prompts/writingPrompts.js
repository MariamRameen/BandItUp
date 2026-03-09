/**
 * Writing Module - AI Prompt Templates
 * 
 * These prompts are aligned with official IELTS Writing Band Descriptors
 * and designed to produce consistent, structured JSON output.
 */

// ─────────────────────────────────────────────────────────────────────────────
// WRITING TASK 2 EVALUATION (Essays - Academic & General)
// ─────────────────────────────────────────────────────────────────────────────
const WRITING_TASK2_EVALUATION_PROMPT = `You are an expert IELTS examiner with 15+ years of experience. Evaluate the following Task 2 essay using the official IELTS Writing Band Descriptors.

## IELTS Writing Task 2 Band Descriptors:

### Task Response (TR)
- Band 9: Fully addresses all parts with a fully developed position; presents well-developed relevant extended ideas
- Band 7: Addresses all parts; presents a clear position with relevant main ideas, though some may be over-generalized
- Band 5: Addresses the task only partially; expresses a position but development is limited

### Coherence & Cohesion (CC)
- Band 9: Uses cohesion in a skilled manner; paragraphing is appropriate
- Band 7: Logically organizes information; uses a range of cohesive devices appropriately
- Band 5: Presents information with some organization; may be repetitive or not always logical

### Lexical Resource (LR)
- Band 9: Uses a wide range of vocabulary naturally; rare errors occur only as 'slips'
- Band 7: Uses a sufficient range with some flexibility; may produce occasional errors in word choice
- Band 5: Uses a limited range; errors in word choice may cause some difficulty

### Grammatical Range & Accuracy (GRA)
- Band 9: Uses a wide range of structures with full flexibility and accuracy
- Band 7: Uses a variety of complex structures; produces frequent error-free sentences
- Band 5: Uses only a limited range of structures; errors may cause some difficulty

## Task Prompt:
{taskPrompt}

## Essay Type: {essayType}

## Candidate's Essay:
{essay}

## Word Count: {wordCount}

## Your Evaluation Task:
Analyze the essay thoroughly and provide your assessment in the following JSON format:

{
  "overallBand": <number from 4.0 to 9.0 in 0.5 increments>,
  "criteria": {
    "taskResponse": {
      "band": <number>,
      "feedback": "<2-3 sentences of specific feedback with examples from the essay>"
    },
    "coherenceCohesion": {
      "band": <number>,
      "feedback": "<2-3 sentences of specific feedback with examples>"
    },
    "lexicalResource": {
      "band": <number>,
      "feedback": "<2-3 sentences of specific feedback with examples>"
    },
    "grammaticalRange": {
      "band": <number>,
      "feedback": "<2-3 sentences of specific feedback with examples>"
    }
  },
  "strengths": [
    "<specific strength 1 with example>",
    "<specific strength 2 with example>"
  ],
  "improvements": [
    "<actionable improvement 1>",
    "<actionable improvement 2>",
    "<actionable improvement 3>"
  ],
  "grammarErrors": [
    {
      "original": "<exact text with error>",
      "correction": "<corrected version>",
      "explanation": "<brief grammar rule explanation>"
    }
  ],
  "vocabularySuggestions": [
    {
      "original": "<basic word/phrase used>",
      "upgrade": "<more sophisticated alternative>",
      "context": "<sentence showing proper usage>"
    }
  ],
  "wordCountAnalysis": "<assessment of word count adequacy>"
}

Important Guidelines:
1. Overall band is the average of four criteria, rounded to nearest 0.5
2. Be specific - cite actual phrases from the essay
3. Identify up to 5 grammar errors (most significant ones)
4. Suggest 3-5 vocabulary upgrades
5. Word count under 250 should negatively impact Task Response
6. Be constructive and encouraging while being accurate`;

// ─────────────────────────────────────────────────────────────────────────────
// WRITING TASK 1 ACADEMIC EVALUATION (Reports)
// ─────────────────────────────────────────────────────────────────────────────
const WRITING_TASK1_ACADEMIC_EVALUATION_PROMPT = `You are an expert IELTS examiner. Evaluate the following Task 1 Academic report using official IELTS Writing Band Descriptors.

## IELTS Writing Task 1 Academic Requirements:
- Summarize visual information (graph, chart, table, diagram, map, process)
- Select and report main features
- Make comparisons where relevant
- Minimum 150 words
- 20 minutes recommended

### Task Achievement (TA) - Task 1 Specific:
- Band 9: Fully satisfies all requirements; clearly presents a fully developed response
- Band 7: Covers requirements; presents a clear overview with key features highlighted
- Band 5: Generally addresses the task; may omit important features or be unclear

## Task Prompt:
{taskPrompt}

## Visual Description: {visualDescription}

## Candidate's Report:
{essay}

## Word Count: {wordCount}

## Your Evaluation Task:
Provide assessment in this JSON format:

{
  "overallBand": <number 4.0-9.0 in 0.5 increments>,
  "criteria": {
    "taskAchievement": {
      "band": <number>,
      "feedback": "<specific feedback on overview, key features, comparisons>"
    },
    "coherenceCohesion": {
      "band": <number>,
      "feedback": "<feedback on organization and linking>"
    },
    "lexicalResource": {
      "band": <number>,
      "feedback": "<feedback on vocabulary range and accuracy>"
    },
    "grammaticalRange": {
      "band": <number>,
      "feedback": "<feedback on grammar structures>"
    }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "grammarErrors": [
    {
      "original": "<error text>",
      "correction": "<corrected>",
      "explanation": "<rule>"
    }
  ],
  "vocabularySuggestions": [
    {
      "original": "<basic term>",
      "upgrade": "<better alternative>",
      "context": "<usage example>"
    }
  ],
  "wordCountAnalysis": "<assessment>"
}`;

// ─────────────────────────────────────────────────────────────────────────────
// WRITING TASK 1 GENERAL EVALUATION (Letters)
// ─────────────────────────────────────────────────────────────────────────────
const WRITING_TASK1_GENERAL_EVALUATION_PROMPT = `You are an expert IELTS examiner. Evaluate the following Task 1 General Training letter.

## IELTS Writing Task 1 General Requirements:
- Write a letter (formal, semi-formal, or informal)
- Address all bullet points in the task
- Use appropriate tone and register
- Minimum 150 words
- 20 minutes recommended

### Letter Types:
- Formal: To companies, authorities, strangers (Dear Sir/Madam)
- Semi-formal: To someone you know professionally (Dear Mr./Ms. [Name])
- Informal: To friends/family (Dear [First Name])

## Task Prompt:
{taskPrompt}

## Letter Type: {letterType}

## Candidate's Letter:
{essay}

## Word Count: {wordCount}

## Your Evaluation Task:
Provide assessment in this JSON format:

{
  "overallBand": <number 4.0-9.0>,
  "criteria": {
    "taskAchievement": {
      "band": <number>,
      "feedback": "<feedback on addressing bullet points, tone, purpose>"
    },
    "coherenceCohesion": {
      "band": <number>,
      "feedback": "<feedback on letter structure, paragraphing>"
    },
    "lexicalResource": {
      "band": <number>,
      "feedback": "<feedback on vocabulary, register appropriateness>"
    },
    "grammaticalRange": {
      "band": <number>,
      "feedback": "<feedback on grammar>"
    }
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "grammarErrors": [{"original": "", "correction": "", "explanation": ""}],
  "vocabularySuggestions": [{"original": "", "upgrade": "", "context": ""}],
  "toneAnalysis": "<assessment of register/tone appropriateness>",
  "wordCountAnalysis": "<assessment>"
}`;

// ─────────────────────────────────────────────────────────────────────────────
// WRITING TASK GENERATION PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
const WRITING_TASK2_GENERATION_PROMPT = `Generate an authentic IELTS Writing Task 2 essay question.

## Requirements:
- Exam Type: {examType}
- Topic Category: {topic}
- Essay Type: {essayType}

## Essay Types (pick one if not specified):
1. Opinion (Agree/Disagree)
2. Discussion (Discuss both views)
3. Problem-Solution
4. Advantages-Disadvantages
5. Two-Part Question

## Output Format (JSON):
{
  "prompt": "<full task prompt exactly as it would appear on IELTS exam, 2-4 sentences setting up the topic followed by a clear question>",
  "essayType": "<type from above>",
  "topic": "<topic category>",
  "keyPoints": [
    "<key point 1 candidates should address>",
    "<key point 2>",
    "<key point 3>"
  ],
  "sampleIdeas": {
    "position1": ["<idea supporting one view>", "<another idea>"],
    "position2": ["<idea supporting opposite view>", "<another idea>"]
  },
  "vocabularyHints": ["<relevant academic vocabulary>", "<more vocabulary>"],
  "commonMistakes": ["<mistake to avoid>", "<another mistake>"]
}

Topic Categories: Education, Technology, Environment, Health, Society, Work, Government, Culture, Media, Globalization

Make the question thought-provoking and suitable for a range of band levels.`;

const WRITING_TASK1_ACADEMIC_GENERATION_PROMPT = `Generate an IELTS Writing Task 1 Academic question with visual data description.

## Requirements:
- Chart/Graph Type: {chartType}
- Topic: {topic}

## Chart Types:
1. Line graph (trends over time)
2. Bar chart (comparisons)
3. Pie chart (proportions)
4. Table (multiple data points)
5. Process diagram (steps)
6. Map (changes/comparisons)

## Output Format (JSON):
{
  "prompt": "<task instruction as it appears on IELTS>",
  "chartType": "<type>",
  "topic": "<topic>",
  "visualDescription": "<detailed description of the visual that the candidate would see, including all data points, labels, time periods>",
  "keyFeatures": ["<main feature 1>", "<main feature 2>", "<main feature 3>"],
  "comparisonPoints": ["<comparison 1>", "<comparison 2>"],
  "vocabularyHints": ["<trend vocabulary>", "<comparison vocabulary>"],
  "dataPoints": {
    "labels": ["<label1>", "<label2>"],
    "values": [[<values>]]
  }
}`;

const WRITING_TASK1_GENERAL_GENERATION_PROMPT = `Generate an IELTS Writing Task 1 General Training letter question.

## Requirements:
- Letter Type: {letterType}
- Situation: {situation}

## Letter Types:
1. Formal (complaint, inquiry, job application)
2. Semi-formal (to a colleague, landlord, teacher)
3. Informal (to a friend, family member)

## Output Format (JSON):
{
  "prompt": "<full task with situation and 3 bullet points to address>",
  "letterType": "<formal/semi-formal/informal>",
  "situation": "<brief situation description>",
  "bulletPoints": [
    "<first thing to include>",
    "<second thing to include>",
    "<third thing to include>"
  ],
  "appropriateOpening": "<suggested opening phrase>",
  "appropriateClosing": "<suggested closing phrase>",
  "vocabularyHints": ["<useful phrases>"],
  "toneGuidance": "<guidance on register>"
}`;

// ─────────────────────────────────────────────────────────────────────────────
// GRAMMAR ANALYSIS PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const GRAMMAR_ANALYSIS_PROMPT = `Analyze the following text for grammar errors. Focus on:
1. Subject-verb agreement
2. Tense consistency
3. Article usage (a/an/the)
4. Preposition errors
5. Sentence fragments and run-ons
6. Punctuation errors
7. Word form errors

## Text to Analyze:
{text}

## Output Format (JSON):
{
  "errorCount": <number>,
  "errors": [
    {
      "original": "<exact text with error>",
      "correction": "<corrected version>",
      "explanation": "<brief explanation of the grammar rule>",
      "errorType": "<category: subject-verb, tense, article, preposition, sentence structure, punctuation, word form>",
      "severity": "<minor/major>"
    }
  ],
  "overallAssessment": "<1-2 sentence summary of grammar strengths and weaknesses>",
  "grammarLevel": "<CEFR level estimate: A2, B1, B2, C1, C2>"
}

Limit to the 10 most significant errors. Prioritize errors that affect meaning or are repeated.`;

// ─────────────────────────────────────────────────────────────────────────────
// VOCABULARY ANALYSIS PROMPT
// ─────────────────────────────────────────────────────────────────────────────
const VOCABULARY_ANALYSIS_PROMPT = `Analyze the vocabulary in this text and suggest upgrades for IELTS Band {targetBand}.

## Text to Analyze:
{text}

## Target Band: {targetBand}

## Output Format (JSON):
{
  "currentLevel": "<estimated CEFR level: A2, B1, B2, C1, C2>",
  "estimatedBand": <number>,
  "suggestions": [
    {
      "original": "<basic word/phrase used>",
      "upgrade": "<more sophisticated alternative>",
      "context": "<example sentence using the upgrade>",
      "bandLevel": "<band level this word is appropriate for>"
    }
  ],
  "collocations": [
    {
      "used": "<collocation used>",
      "better": "<stronger collocation>",
      "example": "<example sentence>"
    }
  ],
  "academicVocabulary": {
    "present": ["<AWL words used>"],
    "suggested": ["<AWL words that could be included>"]
  },
  "overallAssessment": "<1-2 sentence vocabulary assessment>"
}

Focus on suggesting 5-8 vocabulary upgrades that would increase the band score.`;

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  // Evaluation prompts
  WRITING_TASK2_EVALUATION_PROMPT,
  WRITING_TASK1_ACADEMIC_EVALUATION_PROMPT,
  WRITING_TASK1_GENERAL_EVALUATION_PROMPT,
  
  // Generation prompts
  WRITING_TASK2_GENERATION_PROMPT,
  WRITING_TASK1_ACADEMIC_GENERATION_PROMPT,
  WRITING_TASK1_GENERAL_GENERATION_PROMPT,
  
  // Analysis prompts
  GRAMMAR_ANALYSIS_PROMPT,
  VOCABULARY_ANALYSIS_PROMPT,
};
