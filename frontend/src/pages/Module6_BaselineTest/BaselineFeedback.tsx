import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function BaselineFeedback() {
  const skills = [
    { name: 'Listening', score: 6.5, level: 'Competent' },
    { name: 'Reading', score: 6.0, level: 'Competent' },
    { name: 'Writing', score: 5.5, level: 'Modest' },
    { name: 'Speaking', score: 7.0, level: 'Good' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-[#333] mb-2">Your Baseline Results</h1>
          <p className="text-[#777] text-lg">Congratulations on completing your baseline test!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Score */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm text-center">
              <div className="w-32 h-32 mx-auto bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                6.5
              </div>
              <h2 className="text-2xl font-semibold mb-2">Overall Band Score</h2>
              <p className="text-[#7D3CFF] text-lg font-semibold mb-4">Competent User</p>
              <p className="text-[#666]">
                Great start! You're on your way to achieving your target band score.
              </p>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Skills Breakdown</h3>
            <div className="space-y-4">
              {skills.map((skill, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-[#7D3CFF] font-semibold">{skill.score}</span>
                  </div>
                  <div className="w-full bg-[#EDE3FF] h-2 rounded-full">
                    <div 
                      className="bg-[#7D3CFF] h-full rounded-full" 
                      style={{ width: `${(skill.score / 9) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-[#777] mt-1">{skill.level}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <div className="bg-[#E8FFF3] rounded-2xl p-6 border border-[#C6FDE7]">
            <h3 className="font-semibold text-lg mb-4 text-[#138A4D]">Strengths</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-[#138A4D]">✓</span>
                <div>
                  <p className="font-medium">Fluency in speaking</p>
                  <p className="text-sm text-[#666]">You speak confidently and naturally</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#138A4D]">✓</span>
                <div>
                  <p className="font-medium">Good comprehension</p>
                  <p className="text-sm text-[#666]">You understand complex listening passages</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#138A4D]">✓</span>
                <div>
                  <p className="font-medium">Effective grammar use</p>
                  <p className="text-sm text-[#666]">You use grammatical structures accurately</p>
                </div>
              </div>
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-[#FFF7EB] rounded-2xl p-6 border border-[#FFE5C2]">
            <h3 className="font-semibold text-lg mb-4 text-[#C2751C]">Areas for Improvement</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-[#C2751C]">→</span>
                <div>
                  <p className="font-medium">Task Achievement in Writing</p>
                  <p className="text-sm text-[#666]">Focus on fully addressing the question</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#C2751C]">→</span>
                <div>
                  <p className="font-medium">Time management in Reading</p>
                  <p className="text-sm text-[#666]">Practice reading faster under time pressure</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#C2751C]">→</span>
                <div>
                  <p className="font-medium">Coherence in writing</p>
                  <p className="text-sm text-[#666]">Improve paragraph structure and linking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personalized Feedback */}
        <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-8">
          <h3 className="font-semibold text-lg mb-4">Personalized Feedback</h3>
          <p className="text-[#666] leading-relaxed">
            Based on your baseline test performance, you've demonstrated a solid foundation in English proficiency. 
            Your speaking skills are particularly strong, showing good fluency and vocabulary range. Your listening 
            comprehension is also above average, indicating you can follow complex discussions effectively.
          </p>
          <p className="text-[#666] leading-relaxed mt-4">
            To reach your target band score, focus on improving your writing structure and coherence. Practice organizing 
            your ideas more systematically and using a wider range of linking devices. Additionally, work on your reading 
            speed and time management to ensure you can complete all questions within the allocated time.
          </p>
        </div>

        {/* Training Plan Ready */}
        <div className="bg-[#F0F9FF] rounded-2xl p-6 border border-[#E1F5FE] text-center">
          <h3 className="text-xl font-semibold text-[#7D3CFF] mb-2">
            Your training plan is ready!
          </h3>
          <p className="text-[#666] mb-4">
            We've created a personalized study plan based on your results.
          </p>
          <Link to="/study-planner">
            <button className="bg-[#7D3CFF] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#6B2FE6]">
              View My Study Plan
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}