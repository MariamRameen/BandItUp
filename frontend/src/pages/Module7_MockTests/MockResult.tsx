import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = "http://localhost:4000/api/mock-tests";
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` } });

interface SectionResult {
  band: number;
  rawScore?: number;
  maxScore?: number;
  feedback?: string;
  details?: any;
}

interface MockTestResult {
  _id: string;
  testNumber: number;
  overallBand: number;
  listening: SectionResult;
  reading: SectionResult;
  writing: SectionResult;
  speaking: SectionResult;
  baselineBand?: number;
  improvementFromBaseline?: number;
  improvementFromPrevious?: number;
  diagnosticReport?: {
    strengths: string[];
    weaknesses: string[];
    advice: string[];
    focusAreas: string[];
  };
  completedAt: string;
  // Study plan integration results
  studyPlanUpdated?: boolean;
  currentBand?: number;
  weakSkills?: string[];
  newFocus?: string;
  progressPercentage?: number;
}

interface ProgressPoint {
  week: string;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
}

export default function MockResult() {
  const [searchParams] = useSearchParams();
  const testId = searchParams.get('id');
  
  const [result, setResult] = useState<MockTestResult | null>(null);
  const [progressData, setProgressData] = useState<ProgressPoint[]>([]);
  const [baselineScores, setBaselineScores] = useState<{listening: number; reading: number; writing: number; speaking: number}>({ listening: 0, reading: 0, writing: 0, speaking: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (testId) {
      loadResult();
      loadProgress();
    }
  }, [testId]);

  const loadResult = async () => {
    try {
      const res = await fetch(`${API_URL}/${testId}`, auth());
      const data = await res.json();
      if (data.success) {
        setResult(data.mockTest);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to load test result");
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const res = await fetch(`${API_URL}/progress`, auth());
      const data = await res.json();
      if (data.success) {
        // progression array: first item is baseline, rest are mock tests
        const progression = data.progression || [];
        const formatted: ProgressPoint[] = progression.map((p: any, idx: number) => ({
          week: idx === 0 ? 'Baseline' : `Test ${idx}`,
          listening: p.listening || 0,
          reading: p.reading || 0,
          writing: p.writing || 0,
          speaking: p.speaking || 0,
          overall: p.overall || 0,
        }));
        setProgressData(formatted);
        
        // Store baseline scores for the comparison chart
        if (progression.length > 0) {
          const baseline = progression[0];
          setBaselineScores({
            listening: baseline.listening || 0,
            reading: baseline.reading || 0,
            writing: baseline.writing || 0,
            speaking: baseline.speaking || 0,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load progress data");
    }
  };

  const sectionScores = result ? [
    { skill: 'Listening', baseline: baselineScores.listening, current: result.listening?.band ?? 0 },
    { skill: 'Reading', baseline: baselineScores.reading, current: result.reading?.band ?? 0 },
    { skill: 'Writing', baseline: baselineScores.writing, current: result.writing?.band ?? 0 },
    { skill: 'Speaking', baseline: baselineScores.speaking, current: result.speaking?.band ?? 0 },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D3CFF]" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#F7F5FF]">
        <Header />
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error || "Test result not found"}
          </div>
          <Link to="/mock-tests" className="text-[#7D3CFF] mt-4 inline-block">
            Back to Mock Tests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FF]">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#333]">Mock Test Results</h1>
          <p className="text-[#777] text-sm">
            Mock Test {result.testNumber} | Completed {new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Score */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm text-center">
            <div className="w-24 h-24 mx-auto bg-[#7D3CFF] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
              {result.overallBand}
            </div>
            <h3 className="text-lg font-semibold mb-2">Overall Band Score</h3>
            <p className="text-[#777] text-sm mb-4">
              {result.improvementFromBaseline && result.improvementFromBaseline > 0 
                ? "Great progress from your baseline!" 
                : "Keep practicing to improve"}
            </p>
            <div className="flex justify-center gap-4 text-sm">
              {result.improvementFromBaseline !== undefined && (
                <>
                  <div>
                    <span className="text-[#777]">vs Baseline: </span>
                    <span className={`font-semibold ${result.improvementFromBaseline >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {result.improvementFromBaseline >= 0 ? '+' : ''}{result.improvementFromBaseline}
                    </span>
                  </div>
                </>
              )}
              {result.improvementFromPrevious !== undefined && result.improvementFromPrevious !== 0 && (
                <div>
                  <span className="text-[#777]">vs Previous: </span>
                  <span className={`font-semibold ${result.improvementFromPrevious >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {result.improvementFromPrevious >= 0 ? '+' : ''}{result.improvementFromPrevious}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Criteria Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Section Scores</h3>
            <div className="space-y-4">
              {sectionScores.map((section, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{section.skill}</span>
                  <div className="flex items-center gap-3">
                    {section.baseline > 0 && (
                      <span className="text-xs text-[#777]">Baseline: {section.baseline}</span>
                    )}
                    <div className="w-20 bg-[#EDE3FF] h-2 rounded-full">
                      <div 
                        className="bg-[#7D3CFF] h-full rounded-full" 
                        style={{ width: `${(section.current / 9) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-[#7D3CFF] w-8">{section.current}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Next Steps</h3>
            <div className="space-y-3">
              <Link to="/vocabulary">
                <button className="w-full bg-[#7D3CFF] text-white py-2 rounded-lg text-sm hover:bg-[#6B2FE6]">
                  Practice Vocabulary
                </button>
              </Link>
              <Link to="/study-planner">
                <button className="w-full bg-[#F4F0FF] text-[#7D3CFF] py-2 rounded-lg text-sm hover:bg-[#E8DCFF]">
                  View Study Plan
                </button>
              </Link>
              <Link to="/mock-tests">
                <button className="w-full bg-[#F4F0FF] text-[#7D3CFF] py-2 rounded-lg text-sm hover:bg-[#E8DCFF]">
                  Take Another Test
                </button>
              </Link>
            </div>
          </div>
        </div>

        {progressData.length > 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Progress Over Time */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Progress Over Time</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[4, 9]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="overall" stroke="#7D3CFF" strokeWidth={2} name="Overall" />
                    <Line type="monotone" dataKey="listening" stroke="#8884d8" name="Listening" />
                    <Line type="monotone" dataKey="reading" stroke="#82ca9d" name="Reading" />
                    <Line type="monotone" dataKey="writing" stroke="#ffc658" name="Writing" />
                    <Line type="monotone" dataKey="speaking" stroke="#ff7300" name="Speaking" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Baseline vs Current */}
            <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Baseline vs Current Performance</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionScores}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="skill" />
                    <YAxis domain={[4, 9]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="baseline" fill="#E2D9FF" name="Baseline" />
                    <Bar dataKey="current" fill="#7D3CFF" name="Current" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* AI Diagnostic Report */}
        {result.diagnosticReport && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Strengths */}
            {result.diagnosticReport.strengths?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-green-600">Strengths</h3>
                <div className="space-y-3">
                  {result.diagnosticReport.strengths.map((s, i) => (
                    <div key={i} className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-700">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas to Improve */}
            {result.diagnosticReport.weaknesses?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-amber-600">Areas to Improve</h3>
                <div className="space-y-3">
                  {result.diagnosticReport.weaknesses.map((w, i) => (
                    <div key={i} className="bg-amber-50 p-3 rounded-lg">
                      <p className="text-sm text-amber-700">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.diagnosticReport.advice?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[#F0E8FF] shadow-sm">
                <h3 className="font-semibold text-lg mb-4 text-[#7D3CFF]">Recommendations</h3>
                <div className="space-y-3">
                  {result.diagnosticReport.advice.map((r, i) => (
                    <div key={i} className="bg-[#F4F0FF] p-3 rounded-lg">
                      <p className="text-sm text-[#666]">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Study Plan Integration Results */}
        {result.studyPlanUpdated && (
          <div className="bg-gradient-to-r from-[#7D3CFF] to-[#A855F7] rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-semibold text-xl">Study Plan Updated!</h3>
            </div>
            <p className="text-white/90 mb-4">
              Your study plan has been automatically adjusted based on this mock test result.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {result.currentBand && (
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/70">Current Band</p>
                  <p className="text-2xl font-bold">{result.currentBand}</p>
                </div>
              )}
              {result.progressPercentage !== undefined && (
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-white/70">Progress</p>
                  <p className="text-2xl font-bold">{Math.round(result.progressPercentage)}%</p>
                </div>
              )}
              {result.weakSkills && result.weakSkills.length > 0 && (
                <div className="bg-white/10 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-white/70">Focus Areas</p>
                  <p className="text-sm font-medium mt-1">
                    {result.weakSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}
                  </p>
                </div>
              )}
            </div>
            {result.newFocus && (
              <div className="mt-4 bg-white/10 rounded-lg p-3">
                <p className="text-xs text-white/70 mb-1">AI Recommendation</p>
                <p className="text-sm">{result.newFocus}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center mt-8">
          <Link to="/study-planner">
            <button className="bg-[#7D3CFF] text-white px-6 py-3 rounded-lg hover:bg-[#6B2FE6]">
              Update Study Plan
            </button>
          </Link>
          <Link to="/mock-tests">
            <button className="bg-[#F4F0FF] text-[#7D3CFF] px-6 py-3 rounded-lg hover:bg-[#E8DCFF]">
              Back to Mock Tests
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}