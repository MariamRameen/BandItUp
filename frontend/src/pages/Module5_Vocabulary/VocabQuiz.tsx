import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export default function VocabQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<boolean>(false);

  const quizQuestions: QuizQuestion[] = [
    { question: "What does 'substantial' mean?", options: ["small", "considerable", "temporary", "uncertain"], correct: 1 },
    { question: "Choose the correct word: 'The study shows a ___ improvement in test scores.'", options: ["significant", "signify", "significance", "significantly"], correct: 0 },
    { question: "Which word means 'present everywhere'?", options: ["unique", "ubiquitous", "rare", "limited"], correct: 1 },
    { question: "Select the synonym for 'inevitable':", options: ["avoidable", "unlikely", "unavoidable", "possible"], correct: 2 },
    { question: "Complete the sentence: 'The results were ___ and required further investigation.'", options: ["clear", "ambiguous", "obvious", "transparent"], correct: 1 },
  ];

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const calculateScore = (): number => {
  return Object.entries(selectedAnswers).reduce((score, [questionIndex, answerIndex]) => {
    const qIndex = parseInt(questionIndex); 
    return score + (answerIndex === quizQuestions[qIndex].correct ? 1 : 0);
  }, 0);
};

  if (showResults) {
    const score = calculateScore();
    const percentage = (score / quizQuestions.length) * 100;

    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <Header />
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm text-center">
            <h1 className="text-2xl font-semibold mb-6">Quiz Results</h1>
            <div className="w-32 h-32 mx-auto bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              {score}/{quizQuestions.length}
            </div>
            <p className="text-xl font-semibold text-[#7D3CFF] mb-2">{percentage}% Correct</p>
            <p className="text-[#777] mb-6">
              {percentage >= 80 ? 'Excellent! You have a strong vocabulary.' :
               percentage >= 60 ? 'Good job! Keep practicing to improve.' :
               'Keep studying! Review the words and try again.'}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#E8FFF3] p-4 rounded-lg">
                <p className="font-semibold text-[#138A4D]">Correct</p>
                <p className="text-2xl">{score}</p>
              </div>
              <div className="bg-[#FFF7EB] p-4 rounded-lg">
                <p className="font-semibold text-[#C2751C]">Incorrect</p>
                <p className="text-2xl">{quizQuestions.length - score}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestion(0);
                  setSelectedAnswers({});
                }}
                className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]"
              >
                Retry Quiz
              </button>
              <Link to="/vocabulary">
                <button className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-3 rounded-lg hover:bg-[#E8DCFF]">
                  Back to Vocabulary
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      <div className="max-w-4xl mx-auto px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#333]">Vocabulary Quiz</h1>
          <p className="text-[#777] text-sm">Test your knowledge with 10 random questions from Band 6</p>
        </div>
        <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">
                Question {currentQuestion + 1} of {quizQuestions.length}
              </h2>
              <p className="text-[#777] text-sm">Band 6 Vocabulary</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#777]">Progress</div>
              <div className="w-32 bg-[#EDE3FF] h-2 rounded-full">
                <div 
                  className="bg-[#7D3CFF] h-full rounded-full" 
                  style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-6">
              {quizQuestions[currentQuestion].question}
            </h3>
            <div className="space-y-3">
              {quizQuestions[currentQuestion].options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedAnswers[currentQuestion] === optionIndex
                      ? 'bg-[#7D3CFF] text-white'
                      : 'bg-[#F8F9FF] text-[#333] hover:bg-[#E8DCFF]'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    checked={selectedAnswers[currentQuestion] === optionIndex}
                    onChange={() => handleAnswerSelect(currentQuestion, optionIndex)}
                    className="hidden"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-3 rounded-lg hover:bg-[#E8DCFF] disabled:opacity-50"
            >
              Previous
            </button>
            {currentQuestion === quizQuestions.length - 1 ? (
              <button
                onClick={() => setShowResults(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Finish Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]"
              >
                Next Question
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
