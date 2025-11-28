import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function WritingSelection() {
  const [currentMode, setCurrentMode] = useState('Academic');
  const [selectedTask, setSelectedTask] = useState('');

  const tasks = [
    {
      type: 'Task 1 - Academic',
      title: 'Describe, summarize or explain information from a chart, graph, table or diagram',
      duration: '20 minutes',
      words: 'Max. 150 words',
      question: 'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.'
    },
    {
      type: 'Task 2 - Essay', 
      title: 'Write an essay in response to a point of view, argument or problem',
      duration: '40 minutes',
      words: 'Max. 250 words',
      question: 'Some people believe that social media has had a positive impact on society, while others think it has been largely negative. Discuss both views and give your own opinion.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Writing Practice</h1>
          <p className="text-[#777] text-sm">Select a writing task to practice and improve your skills</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setCurrentMode('Academic')}
                  className={`px-4 py-2 rounded-lg ${
                    currentMode === 'Academic' ? 'bg-[#7D3CFF] text-white' : 'bg-[#F4F0FF] text-[#7D3CFF]'
                  }`}
                >
                  Academic
                </button>
                <button
                  onClick={() => setCurrentMode('General')}
                  className={`px-4 py-2 rounded-lg ${
                    currentMode === 'General' ? 'bg-[#7D3CFF] text-white' : 'bg-[#F4F0FF] text-[#7D3CFF]'
                  }`}
                >
                  General Training
                </button>
              </div>

              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedTask(task.type)}
                    className={`p-4 border-2 rounded-lg cursor-pointer ${
                      selectedTask === task.type ? 'border-[#7D3CFF] bg-[#F8F9FF]' : 'border-[#F0E8FF] bg-white'
                    }`}
                  >
                    <h3 className="font-semibold text-lg mb-2">{task.type}</h3>
                    <p className="text-[#777] text-sm mb-3">{task.title}</p>
                    <div className="flex gap-4 text-sm text-[#666]">
                      <span>{task.duration}</span>
                      <span>•</span>
                      <span>{task.words}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Task Preview</h3>
              {selectedTask ? (
                <div>
                  <p className="text-sm text-[#777] mb-3">Review the instructions before starting</p>
                  <div className="bg-[#F8F9FF] p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Question:</p>
                    <p className="text-sm text-[#333] mb-4">
                      {tasks.find(t => t.type === selectedTask)?.question}
                    </p>
                    <div className="space-y-2 text-sm text-[#666]">
                      <p>• Write at least {selectedTask.includes('Task 1') ? '150' : '250'} words</p>
                      <p>• You should spend about {selectedTask.includes('Task 1') ? '20' : '40'} minutes on this task</p>
                      {selectedTask.includes('Task 2') && (
                        <>
                          <p>• Discuss both viewpoints</p>
                          <p>• Provide your own opinion with examples</p>
                        </>
                      )}
                    </div>
                  </div>
                  <Link to="/writing/practice">
                    <button className="w-full bg-[#7D3CFF] text-white py-3 rounded-lg mt-4 hover:bg-[#6B2FE6]">
                      Start Writing
                    </button>
                  </Link>
                </div>
              ) : (
                <p className="text-[#777] text-sm">Select a task to view instructions</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-3">Current Band</h3>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-xl font-bold mb-2">
                  6.5
                </div>
                <p className="text-sm text-[#777]">Writing Band Score</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}