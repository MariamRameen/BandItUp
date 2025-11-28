
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';

export default function VocabBands() {
  const [selectedBand, setSelectedBand] = useState(6);
  const bands = [
    { level: 4, words: 150, learned: 150 },
    { level: 5, words: 200, learned: 152 },
    { level: 6, words: 250, learned: 87 },
    { level: 7, words: 300, learned: 45 },
    { level: 8, words: 350, learned: 12 },
    { level: 9, words: 400, learned: 0 },
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
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Band {selectedBand} Vocabulary</h2>
                  <p className="text-[#777]">
                    {currentBand?.words} words | {Math.round((currentBand?.learned / currentBand?.words) * 100)}% complete
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link to="/vocabulary/flashcards">
                    <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
                      Flashcards
                    </button>
                  </Link>
                  <Link to="/vocabulary/quiz">
                    <button className="bg-[#7D3CFF] text-white px-4 py-2 rounded-lg hover:bg-[#6B2FE6]">
                      Take Quiz
                    </button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { word: "substantial", definition: "of considerable importance, size, or worth", example: "The company made substantial profits this year." },
                  { word: "inevitable", definition: "certain to happen; unavoidable", example: "Climate change seems inevitable without action." },
                  { word: "comprehensive", definition: "complete and including everything necessary", example: "We need a comprehensive solution to this problem." },
                  { word: "significant", definition: "sufficiently great or important to be worthy of attention", example: "There was a significant increase in sales." },
                ].map((vocab, index) => (
                  <div key={index} className="bg-[#F8F9FF] p-4 rounded-lg border border-[#E2D9FF]">
                    <h4 className="font-semibold text-[#7D3CFF] mb-2">{vocab.word}</h4>
                    <p className="text-sm text-[#666] mb-2">{vocab.definition}</p>
                    <p className="text-sm text-[#777] italic">"{vocab.example}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}