import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function VocabFlashcards() {
  const [currentCard, setCurrentCard] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [selectedBand, setSelectedBand] = useState(6);

  const bands = [
    { level: 4, words: 150, learned: 150 },
    { level: 5, words: 200, learned: 152 },
    { level: 6, words: 250, learned: 85 },
    { level: 7, words: 300, learned: 45 },
    { level: 8, words: 350, learned: 12 },
    { level: 9, words: 400, learned: 0 },
  ];

  const flashcards = [
    { word: "ubiquitous", definition: "present, appearing, or found everywhere", example: "Mobile phones are now ubiquitous in modern society." },
    { word: "substantial", definition: "of considerable importance, size, or worth", example: "The company made substantial profits this year." },
    { word: "inevitable", definition: "certain to happen; unavoidable", example: "Climate change seems inevitable without immediate action." },
    { word: "comprehensive", definition: "complete and including everything necessary", example: "We need a comprehensive solution to this complex problem." },
    { word: "ambiguous", definition: "open to more than one interpretation; not clear", example: "The instructions were ambiguous and confusing." },
  ];

  const currentBand = bands.find(band => band.level === selectedBand) || { level: selectedBand, words: 0, learned: 0 };


  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Vocabulary Builder</h1>
          <p className="text-[#777] text-sm">Build your vocabulary with band-specific word packs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold mb-4">Select Band Level</h3>
              <div className="space-y-3">
                {bands.map(band => (
                  <button
                    key={band.level}
                    onClick={() => setSelectedBand(band.level)}
                    className={`w-full text-left p-3 rounded-lg ${
                      selectedBand === band.level ? 'bg-[#7D3CFF] text-white' : 'bg-[#F8F9FF] text-[#333]'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Band {band.level}</span>
                      <span className="text-sm">
                        {band.learned}/{band.words}
                      </span>
                    </div>
                    <div className="w-full bg-[#EDE3FF] h-2 rounded-full mt-2">
                      <div 
                        className="bg-[#7D3CFF] h-full rounded-full" 
                        style={{ width: `${(band.learned / band.words) * 100}%` }}
                      ></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-8 border border-[#F0E8FF] shadow-sm mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Band {selectedBand} Vocabulary</h2>
                  <p className="text-[#777]">
                    {currentBand.words} words | {Math.round((currentBand.learned / currentBand.words) * 100)}% complete
                    </p>
                </div>
                <div className="flex gap-2">
                  <Link to="/vocabulary">
                    <button className="bg-[#F4F0FF] text-[#7D3CFF] px-4 py-2 rounded-lg hover:bg-[#E8DCFF]">
                      Word List
                    </button>
                  </Link>
                  <Link to="/vocabulary/quiz">
                    <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
                      Take Quiz
                    </button>
                  </Link>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="text-sm text-[#777] mb-2">Card {currentCard + 1} of {flashcards.length}</div>
                <div className="w-full max-w-md mx-auto">
                  <div 
                    className="bg-[#7D3CFF] text-white p-12 rounded-2xl shadow-lg cursor-pointer transform transition-transform hover:scale-105"
                    onClick={() => setShowDefinition(!showDefinition)}
                  >
                    {showDefinition ? (
                      <div>
                        <h3 className="text-2xl font-bold mb-4">{flashcards[currentCard].word}</h3>
                        <p className="text-lg mb-4">{flashcards[currentCard].definition}</p>
                        <p className="text-sm opacity-90 italic">"{flashcards[currentCard].example}"</p>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-3xl font-bold mb-4">{flashcards[currentCard].word}</h3>
                        <p className="text-sm">(Click to see definition)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setCurrentCard(Math.max(0, currentCard - 1));
                    setShowDefinition(false);
                  }}
                  disabled={currentCard === 0}
                  className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-3 rounded-lg hover:bg-[#E8DCFF] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setShowDefinition(!showDefinition)}
                  className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]"
                >
                  {showDefinition ? 'Show Word' : 'Show Definition'}
                </button>
                <button
                  onClick={() => {
                    setCurrentCard(Math.min(flashcards.length - 1, currentCard + 1));
                    setShowDefinition(false);
                  }}
                  disabled={currentCard === flashcards.length - 1}
                  className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-3 rounded-lg hover:bg-[#E8DCFF] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {flashcards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentCard(index);
                    setShowDefinition(false);
                  }}
                  className={`h-10 rounded-lg ${
                    currentCard === index ? 'bg-[#7D3CFF] text-white' : 'bg-[#F8F9FF] text-[#333]'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}